import { createPublicKey } from "node:crypto";
import { PrivyClient, type User } from "@privy-io/server-auth";
import { cleanCredential, privyConfig } from "./config";
import { describeError } from "./diagnose";
import { HttpError } from "./guard";

let client: PrivyClient | null = null;
const MISCONFIGURED = "Sign-in isn't set up correctly on our side. Try again later.";

/**
 * The Privy client, or null when auth isn't configured. Throws a 503 when the
 * credentials can't be used at all: Privy's client throws on any character in
 * the id or secret that isn't plain text (a stray curly quote, say).
 */
function privy(): PrivyClient | null {
  if (client) return client;
  const cfg = privyConfig();
  if (!cfg) return null;
  try {
    client = new PrivyClient(cfg.appId, cfg.appSecret);
  } catch (err) {
    console.error("privy client:", describeError(err));
    throw new HttpError(503, MISCONFIGURED);
  }
  return client;
}

/** Where a credential has a character Privy can't send, if anywhere. */
function oddCharacter(cfg: { appId: string; appSecret: string }): string | null {
  if (/[^\x21-\x7e]/.test(cfg.appId)) return "NEXT_PUBLIC_PRIVY_APP_ID";
  if (/[^\x21-\x7e]/.test(cfg.appSecret)) return "PRIVY_APP_SECRET";
  return null;
}

let keyChecked = false;
let key: string | undefined;

/**
 * PRIVY_VERIFICATION_KEY as a usable PEM, or undefined when it's unset or broken
 * (then the key is fetched from Privy, so a bad paste can't lock everyone out).
 * Dashboards often turn the key's line breaks into literal "\n"; undo that.
 */
function verificationKey(): string | undefined {
  if (keyChecked) return key;
  keyChecked = true;
  const raw = cleanCredential(process.env.PRIVY_VERIFICATION_KEY?.replace(/\\n/g, "\n"));
  if (!raw) return undefined;
  try {
    createPublicKey(raw);
    key = raw;
  } catch {
    console.error("privy: PRIVY_VERIFICATION_KEY isn't a valid public key; fetching the key from Privy instead");
  }
  return key;
}

export interface AuthUser {
  privyId: string;
  email?: string;
  /** The name on the Google account, when they signed in with Google */
  name?: string;
  wallet?: string;
}

// Privy's API normally answers in well under a second; never let a slow call hang a request.
const PRIVY_TIMEOUT_MS = 8_000;
const UNREACHABLE = "We couldn't reach the sign-in service. Try again in a moment.";

async function within<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new HttpError(503, UNREACHABLE)), PRIVY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// getUser(userId) calls Privy's API and is rate limited, so remember each user
// briefly, but only once they have a Solana wallet: a new user's embedded wallet
// is created a moment after sign-in, and the next request must see it. The
// identity token path (verified locally) skips the call entirely.
const users = new Map<string, { user: User; at: number }>();
const USER_TTL_MS = 60_000;

/** The verified email behind the login: an email login, or the Google account's address. */
function verifiedEmail(user: User): string | undefined {
  return (user.email?.address ?? user.google?.email)?.toLowerCase();
}

/** The user's Solana wallet: the Privy embedded wallet first, else the first linked Solana wallet. */
function solanaWallet(user: User): string | undefined {
  const wallets = user.linkedAccounts.filter(
    (a): a is Extract<User["linkedAccounts"][number], { type: "wallet" }> => a.type === "wallet" && a.chainType === "solana",
  );
  const embedded = wallets.find((w) => w.walletClientType === "privy");
  return (embedded ?? wallets[0])?.address;
}

/**
 * Verify a Privy access token (signature, expiry, app id) and resolve the user.
 * An identity token, when the client sends one, must belong to the same user.
 * Returns null for a token that doesn't verify; throws a 503 HttpError when Privy
 * can't be reached, so an outage isn't mistaken for a bad sign-in.
 * PRIVY_VERIFICATION_KEY (the key from Privy's dashboard), when set, verifies
 * tokens without fetching it from Privy.
 */
export async function verifyAuth(authToken: string | undefined, idToken?: string): Promise<AuthUser | null> {
  if (!authToken) return null;
  const p = privy();
  if (!p) return null;
  let claims: Awaited<ReturnType<PrivyClient["verifyAuthToken"]>>;
  try {
    claims = await within(p.verifyAuthToken(authToken, verificationKey()));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    return null; // expired, forged or for another app
  }
  let user: User | undefined;
  if (idToken) {
    const fromId = await within(p.getUser({ idToken })).catch(() => undefined);
    // A token minted before the embedded wallet existed won't list it; look the user up instead.
    if (fromId && fromId.id === claims.userId && solanaWallet(fromId)) user = fromId;
  }
  if (!user) {
    const cached = users.get(claims.userId);
    if (cached && Date.now() - cached.at < USER_TTL_MS) user = cached.user;
    else {
      try {
        user = await within(p.getUser(claims.userId));
      } catch (err) {
        console.error("privy getUser:", (err as Error).message);
        throw err instanceof HttpError ? err : new HttpError(503, UNREACHABLE);
      }
      if (solanaWallet(user)) users.set(claims.userId, { user, at: Date.now() });
      if (users.size > 5000) users.delete(users.keys().next().value!);
    }
  }
  return { privyId: claims.userId, email: verifiedEmail(user), name: user.google?.name ?? undefined, wallet: solanaWallet(user) };
}

export interface Diagnosis {
  /** null: not configured, so not checked */
  ok: boolean | null;
  reason?: string;
}

/** Whether Privy accepts the configured app id and secret, and if not, why (for the status page). */
export async function privyDiagnosis(): Promise<Diagnosis> {
  const cfg = privyConfig();
  if (!cfg) return { ok: null };
  const odd = oddCharacter(cfg);
  if (odd) return { ok: false, reason: `${odd} contains a character that isn't plain text (often a curly quote or an invisible character from copying). Paste it again by hand.` };
  try {
    const p = privy();
    if (!p) return { ok: null };
    await within(p.getAppSettings());
    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401 || status === 403 || status === 404) {
      return { ok: false, reason: `Privy refused this app id and secret (HTTP ${status}). Copy both from the same app in Privy's dashboard.` };
    }
    return { ok: false, reason: err instanceof HttpError ? err.message : describeError(err) };
  }
}

/** Whether PRIVY_VERIFICATION_KEY, if set, is a usable key (null: not set; tokens are checked with Privy's key). */
export function verificationKeyUsable(): boolean | null {
  if (!cleanCredential(process.env.PRIVY_VERIFICATION_KEY)) return null;
  return verificationKey() !== undefined;
}
