// Accounts: a Privy-verified user joined to a Profile row (wallet, handle,
// role). Every authenticated route goes through requireAccount(), which checks
// the Privy access token on the server; nothing trusts a client-supplied user
// id or wallet. Roles are fixed at onboarding: a "worker" does tasks, a
// "company" posts them.

import type { CompanyInvite, Prisma, Profile } from "@prisma/client";
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
 * Verify the request's Privy token and load the account. The profile is set up
 * automatically the first time the user's Solana wallet exists (see setUpProfile),
 * so a new account has a handle and a name straight away.
 */
export async function requireAccount(req: Request): Promise<Account> {
  if (!accountsEnabled()) throw new HttpError(503, "Accounts are not configured on this server");
  const auth = await authFromRequest(req);
  if (!auth) throw new HttpError(401, "Sign in first");
  return accountFor(auth);
}

/** The account behind a verified login, set up on first sight once its wallet exists. */
export async function accountFor(auth: AuthUser): Promise<Account> {
  const prisma = db();
  await ensureUser(auth);
  let profile = await prisma.profile.findUnique({ where: { userId: auth.privyId } });
  if (profile && auth.wallet && profile.wallet !== auth.wallet && !profile.onboardedAt) {
    // Not set up yet: follow the user's current Privy wallet.
    const taken = await prisma.profile.findUnique({ where: { wallet: auth.wallet } });
    if (!taken) profile = await prisma.profile.update({ where: { id: profile.id }, data: { wallet: auth.wallet } });
  }
  if (!profile?.onboardedAt) {
    // The wallet column is unique: a wallet already claimed by another user stays theirs.
    const walletFree = !!auth.wallet && !(await prisma.profile.findUnique({ where: { wallet: auth.wallet } }));
    if (profile || walletFree) profile = await setUpProfile(auth, profile);
  } else if (profile.role === "worker" && auth.email) {
    // Approved as an organisation after the account was made: it becomes one.
    const invite = await companyInviteFor(auth);
    if (invite) profile = await becomeOrganisation(auth, profile, invite);
  }
  return { auth, profile };
}

/** A handle from the login: the email's name (sita@example.com → sita), else "user_" and the wallet's start. */
export function suggestHandle(auth: AuthUser): string {
  const fromEmail = (auth.email?.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  if (fromEmail.length >= 3) return fromEmail;
  const seed = (auth.wallet ?? auth.privyId.split(":").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `user_${seed.slice(0, 6) || Date.now().toString(36).slice(-6)}`;
}

/** The suggested handle if it's free, else the same with four digits added. */
async function freeHandle(base: string): Promise<string> {
  const prisma = db();
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 15)}_${Math.floor(1000 + Math.random() * 9000)}`;
    if (handleProblem(candidate)) continue;
    if (!(await prisma.profile.findUnique({ where: { handle: candidate }, select: { id: true } }))) return candidate;
  }
  return `user_${Date.now().toString(36).slice(-10)}`;
}

/** The name an account starts with: the Google account's name, else the email's name. */
export function defaultName(auth: AuthUser): string {
  return auth.name?.trim().slice(0, 40) || auth.email?.split("@")[0]?.slice(0, 40) || "New user";
}

type Tx = Prisma.TransactionClient;

/** Mark an organisation invitation as used by this account, inside the caller's transaction. */
async function claimInvite(tx: Tx, invite: CompanyInvite, auth: AuthUser): Promise<void> {
  const claimed = await tx.companyInvite.updateMany({
    where: { email: invite.email, OR: [{ claimedBy: null }, { claimedBy: auth.privyId }] },
    data: { claimedBy: auth.privyId, claimedAt: new Date() },
  });
  if (claimed.count !== 1) throw new HttpError(409, "That invitation has already been used");
}

/**
 * Set up a new account's profile: a free handle from the email, a name, and its side
 * (an organisation when an unused invitation matches its email, a freelancer otherwise).
 * Everything but the side can be changed later in settings.
 */
async function setUpProfile(auth: AuthUser, existing: Profile | null): Promise<Profile> {
  const prisma = db();
  const invite = await companyInviteFor(auth);
  for (let attempt = 0; attempt < 3; attempt++) {
    const data = {
      handle: await freeHandle(suggestHandle(auth)),
      displayName: defaultName(auth),
      role: invite ? "company" : "worker",
      company: invite?.company ?? null,
      onboardedAt: new Date(),
    };
    try {
      const saved = await prisma.$transaction(async (tx) => {
        if (invite) await claimInvite(tx, invite, auth);
        return existing
          ? tx.profile.update({ where: { id: existing.id }, data })
          : tx.profile.create({ data: { ...data, userId: auth.privyId, wallet: auth.wallet! } });
      });
      await store.setName(saved.wallet, profileLabel(saved)).catch(() => {});
      return saved;
    } catch (err) {
      if ((err as { code?: string }).code !== "P2002") throw err;
      // Another request set this account up at the same moment, or the handle was just taken.
      const now = await prisma.profile.findUnique({ where: { userId: auth.privyId } });
      if (now?.onboardedAt) return now;
      existing = now;
    }
  }
  throw new HttpError(409, "We couldn't set up your profile. Try again in a moment.");
}

/** A freelancer account whose email was approved as an organisation becomes that organisation. */
async function becomeOrganisation(auth: AuthUser, profile: Profile, invite: CompanyInvite): Promise<Profile> {
  const saved = await db().$transaction(async (tx) => {
    await claimInvite(tx, invite, auth);
    return tx.profile.update({ where: { id: profile.id }, data: { role: "company", company: invite.company } });
  });
  await store.setName(saved.wallet, profileLabel(saved)).catch(() => {});
  return saved;
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
 * Save the profile: name, handle, city, bio, skills and the email preference can
 * change any time (a new handle must be free). The side is fixed: everyone is a
 * freelancer unless an organisation invitation matches their email, and then the
 * organisation's name comes from the invitation.
 */
export async function saveProfile(account: Account, input: OnboardInput): Promise<Profile> {
  const prisma = db();
  if (!account.profile) throw new HttpError(409, "Your wallet isn't ready yet. Try again in a moment.");
  const onboarded = !!account.profile.onboardedAt;
  const handle = normalizeHandle(input.handle);
  let invite: CompanyInvite | null = null;
  if (!onboarded || handle !== account.profile.handle) {
    const problem = handleProblem(handle);
    if (problem) throw new HttpError(400, problem);
    const owner = await prisma.profile.findUnique({ where: { handle } });
    if (owner && owner.id !== account.profile.id) throw new HttpError(409, "That handle is taken");
  }
  if (!onboarded) {
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
    handle,
    ...(onboarded ? {} : { role, onboardedAt: new Date() }),
  };
  const profileId = account.profile.id;
  let saved: Profile;
  try {
    saved = await prisma.$transaction(async (tx) => {
      // Claim the invitation in the same transaction, so two accounts can't both use it.
      if (invite) await claimInvite(tx, invite, account.auth);
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

// Prisma errors that mean the database couldn't be reached or didn't answer in time.
const DB_UNAVAILABLE = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/**
 * Turn an HttpError (or anything) into a JSON response that says what went wrong, never how.
 * Prisma's errors are recognised by name and code, not instanceof: when the Prisma client
 * wasn't generated, its error classes don't exist and instanceof would itself throw.
 */
export function accountError(err: unknown): Response {
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  if (err instanceof z.ZodError) return Response.json({ error: "Invalid request" }, { status: 400 });
  console.error("accounts:", err);
  const e = err as { name?: string; code?: unknown; message?: string };
  const dbDown = e?.name === "PrismaClientInitializationError" || (typeof e?.code === "string" && DB_UNAVAILABLE.has(e.code));
  if (dbDown) return Response.json({ error: "Our accounts database didn't respond. Try again in a moment." }, { status: 503 });
  if (String(e?.message ?? "").includes("did not initialize yet")) {
    return Response.json({ error: "Accounts aren't set up on the server yet (its database client is missing). See /status." }, { status: 503 });
  }
  return Response.json({ error: "Something went wrong loading your account. Try again in a moment." }, { status: 500 });
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
