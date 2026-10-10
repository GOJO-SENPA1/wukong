// Accounts: a Privy-verified user joined to a Profile row (wallet, handle,
// role). Every authenticated route goes through requireAccount(), which checks
// the Privy access token on the server; nothing trusts a client-supplied user
// id or wallet. Roles are fixed at onboarding: a "worker" does tasks, a
// "company" posts them.

import type { CompanyInvite, Profile } from "@prisma/client";
import { z } from "zod";
import { verifyAuth, type AuthUser } from "./auth";
import { hasDatabase, privyConfig } from "./config";
import { db } from "./db";
import { demoMode } from "./env";
import { store } from "./store";
import { HttpError } from "./guard";
import { HELP_EMAIL } from "@/lib/contact";

export type Role = "worker" | "company";

/** Accounts need both Privy (identity) and a database (profiles). */
export function accountsEnabled(): boolean {
  return !!privyConfig() && hasDatabase();
}

export { HttpError };

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED = new Set([
  "admin", "administrator", "api", "app", "about", "agents", "auth", "billing", "dashboard", "docs", "help", "home",
  "leaderboard", "login", "logout", "me", "mod", "moderator", "new", "null", "official", "privacy", "root", "security",
  "settings", "signin", "signup", "staff", "status", "support", "system", "tasks", "team", "terms", "u", "undefined",
  "wallet", "welcome", "workers", "wukong", "wukonghq",
]);

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function handleProblem(handle: string): string | null {
  if (!HANDLE_RE.test(handle)) return "3 to 20 characters: lowercase letters, numbers and _";
  if (RESERVED.has(handle)) return "That handle is reserved";
  return null;
}

function bearer(req: Request): string | undefined {
  const h = req.headers.get("authorization") ?? "";
  return /^Bearer\s+(\S{10,4096})$/i.exec(h)?.[1];
}

/** The verified Privy user behind a request, or null (no token, bad token, or accounts off). */
export async function authFromRequest(req: Request): Promise<AuthUser | null> {
  if (!accountsEnabled()) return null;
  const idToken = req.headers.get("x-privy-id-token") ?? undefined;
  return verifyAuth(bearer(req), idToken && idToken.length < 8192 ? idToken : undefined);
}

export interface Account {
  auth: AuthUser;
  profile: Profile | null;
}

/**
 * Verify the request's Privy token and load (or create) the user row. The
 * profile is created on first sight with the user's Privy Solana wallet; it
 * stays un-onboarded (no handle, default role) until /api/me is POSTed.
 */
export async function requireAccount(req: Request): Promise<Account> {
  if (!accountsEnabled()) throw new HttpError(503, "Accounts are not configured on this server");
  const auth = await authFromRequest(req);
  if (!auth) throw new HttpError(401, "Sign in first");
  const prisma = db();
  await ensureUser(auth);
  let profile = await prisma.profile.findUnique({ where: { userId: auth.privyId } });
  if (!profile && auth.wallet) {
    // The wallet column is unique: a wallet already claimed by another user stays theirs.
    const taken = await prisma.profile.findUnique({ where: { wallet: auth.wallet } });
    if (!taken) {
      profile = await prisma.profile.create({
        data: { userId: auth.privyId, wallet: auth.wallet, displayName: auth.email?.split("@")[0]?.slice(0, 40) || "New user" },
      });
    }
  } else if (profile && auth.wallet && profile.wallet !== auth.wallet && !profile.onboardedAt) {
    // Before onboarding, follow the user's current Privy wallet.
    const taken = await prisma.profile.findUnique({ where: { wallet: auth.wallet } });
    if (!taken) profile = await prisma.profile.update({ where: { id: profile.id }, data: { wallet: auth.wallet } });
  }
  return { auth, profile };
}

/** The user row for a verified login, keeping its email current. */
export async function ensureUser(auth: AuthUser): Promise<void> {
  const prisma = db();
  try {
    await prisma.user.upsert({
      where: { id: auth.privyId },
      create: { id: auth.privyId, email: auth.email ?? null },
      update: auth.email ? { email: auth.email } : {},
    });
  } catch (err) {
    // The email already belongs to another Privy user (say, an email login and a Google login
    // for the same address). It stays with them; this user is still let in, just without it.
    if ((err as { code?: string }).code !== "P2002") throw err;
    await prisma.user.upsert({ where: { id: auth.privyId }, create: { id: auth.privyId }, update: {} });
  }
}

export const OnboardSchema = z.object({
  handle: z.string().max(21),
  displayName: z.string().trim().min(1).max(40),
  role: z.enum(["worker", "company"]),
  company: z.string().trim().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(280).optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  languages: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  emailOnWin: z.boolean().default(true),
});
export type OnboardInput = z.infer<typeof OnboardSchema>;

/**
 * The organisation invitation for this login's verified email (email login or
 * Google), if there is one and nobody else has used it. Wallet-only logins have
 * no email, so they can't be organisations.
 */
export async function companyInviteFor(auth: AuthUser): Promise<CompanyInvite | null> {
  if (!auth.email) return null;
  const invite = await db().companyInvite.findUnique({ where: { email: auth.email.toLowerCase() } });
  return invite && (!invite.claimedBy || invite.claimedBy === auth.privyId) ? invite : null;
}

/**
 * Save the profile. The handle and role are set once, at onboarding: everyone is
 * a freelancer unless an organisation invitation matches their email, and then
 * the organisation's name comes from the invitation. Afterwards only the
 * descriptive fields and the email preference change.
 */
export async function saveProfile(account: Account, input: OnboardInput): Promise<Profile> {
  const prisma = db();
  if (!account.profile) throw new HttpError(409, "Your wallet isn't ready yet. Try again in a moment.");
  const onboarded = !!account.profile.onboardedAt;
  const handle = normalizeHandle(input.handle);
  let invite: CompanyInvite | null = null;
  if (!onboarded) {
    const problem = handleProblem(handle);
    if (problem) throw new HttpError(400, problem);
    const owner = await prisma.profile.findUnique({ where: { handle } });
    if (owner && owner.id !== account.profile.id) throw new HttpError(409, "That handle is taken");
    if (input.role === "company") {
      invite = await companyInviteFor(account.auth);
      if (!invite) throw new HttpError(403, `Organisation accounts are by invitation. Email ${HELP_EMAIL} to register yours.`);
    }
  }
  const role = onboarded ? (account.profile.role as Role) : input.role;
  const data = {
    displayName: input.displayName,
    company: role === "company" ? (invite?.company ?? account.profile.company) : null,
    city: input.city || null,
    bio: input.bio || null,
    skills: [...new Set(input.skills)],
    languages: [...new Set(input.languages)],
    emailOnWin: input.emailOnWin,
    ...(onboarded ? {} : { handle, role, onboardedAt: new Date() }),
  };
  const profileId = account.profile.id;
  let saved: Profile;
  try {
    saved = await prisma.$transaction(async (tx) => {
      if (invite) {
        // Claim the invitation in the same transaction, so two accounts can't both use it.
        const claimed = await tx.companyInvite.updateMany({
          where: { email: invite.email, OR: [{ claimedBy: null }, { claimedBy: account.auth.privyId }] },
          data: { claimedBy: account.auth.privyId, claimedAt: new Date() },
        });
        if (claimed.count !== 1) throw new HttpError(409, "That invitation has already been used");
      }
      return tx.profile.update({ where: { id: profileId }, data });
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if ((err as { code?: string }).code === "P2002") throw new HttpError(409, "That handle is taken");
    throw err;
  }
  // The arena, leaderboard and reports show names from the store; keep it in step.
  await store.setName(saved.wallet, profileLabel(saved));
  return saved;
}

/** What a profile shows publicly (never the email or user id). */
export function publicProfile(p: Profile) {
  return {
    handle: p.handle,
    displayName: p.displayName,
    role: p.role as Role,
    company: p.company,
    city: p.city,
    bio: p.bio,
    skills: p.skills,
    languages: p.languages,
    wallet: p.wallet,
    joined: p.createdAt.toISOString(),
  };
}
export type PublicProfile = ReturnType<typeof publicProfile>;

export async function profileByHandle(handle: string): Promise<Profile | null> {
  if (!hasDatabase()) return null;
  const h = normalizeHandle(handle);
  if (!HANDLE_RE.test(h)) return null;
  return db().profile.findUnique({ where: { handle: h } });
}

export async function profileByWallet(wallet: string): Promise<Profile | null> {
  if (!hasDatabase()) return null;
  return db().profile.findUnique({ where: { wallet } });
}

/** Profiles (with their user row, for the email) for a set of wallets. */
export async function profilesByWallets(wallets: string[]) {
  if (!hasDatabase() || !wallets.length) return [];
  return db().profile.findMany({ where: { wallet: { in: [...new Set(wallets)] } }, include: { user: true } });
}

/** Turn an HttpError (or anything) into a JSON response. */
export function accountError(err: unknown): Response {
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  if (err instanceof z.ZodError) return Response.json({ error: "Invalid request" }, { status: 400 });
  console.error("accounts:", err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}

/**
 * Identity for a write that only one role may make. Signed in: the verified,
 * onboarded account with that role. Not signed in: allowed only where there are
 * no accounts to sign in to, or on a demo deployment (demo personas); returns null.
 */
export async function writerFor(req: Request, role: Role): Promise<Profile | null> {
  const signedIn = accountsEnabled() && (await authFromRequest(req)) !== null;
  if (signedIn) {
    const { profile } = await requireAccount(req);
    if (!profile?.onboardedAt) throw new HttpError(403, "Finish setting up your account first");
    if (profile.role !== role) {
      throw new HttpError(403, role === "company" ? "Only organisation accounts can post tasks" : "Organisation accounts can't enter tasks");
    }
    return profile;
  }
  if (accountsEnabled() && !demoMode()) throw new HttpError(401, "Sign in to continue");
  return null;
}

/** The name an account shows on tasks and boards. */
export function profileLabel(p: Profile): string {
  const label = p.role === "company" ? p.company || p.displayName : p.displayName;
  return p.city ? `${label} · ${p.city}` : label;
}
