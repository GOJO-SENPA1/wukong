import { PrivyClient, type User } from "@privy-io/server-auth";
import { privyConfig } from "./config";
import { HttpError } from "./guard";

let client: PrivyClient | null = null;

function privy(): PrivyClient | null {
  if (client) return client;
  const cfg = privyConfig();
  if (!cfg) return null;
  client = new PrivyClient(cfg.appId, cfg.appSecret);
  return client;
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
    claims = await within(p.verifyAuthToken(authToken, process.env.PRIVY_VERIFICATION_KEY || undefined));
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

/** Whether the configured Privy app id and secret are accepted by Privy (null: not configured). */
export async function privyCredentialsWork(): Promise<boolean | null> {
  const p = privy();
  if (!p) return null;
  try {
    await within(p.getAppSettings());
    return true;
  } catch {
    return false;
  }
}
