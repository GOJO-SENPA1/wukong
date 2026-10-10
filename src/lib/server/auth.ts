import { PrivyClient, type User } from "@privy-io/server-auth";
import { privyConfig } from "./config";

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
  wallet?: string;
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
 * Returns null for anything that doesn't verify.
 */
export async function verifyAuth(authToken: string | undefined, idToken?: string): Promise<AuthUser | null> {
  if (!authToken) return null;
  const p = privy();
  if (!p) return null;
  try {
    const claims = await p.verifyAuthToken(authToken);
    let user: User | undefined;
    if (idToken) {
      const fromId = await p.getUser({ idToken }).catch(() => undefined);
      // A token minted before the embedded wallet existed won't list it; look the user up instead.
      if (fromId && fromId.id === claims.userId && solanaWallet(fromId)) user = fromId;
    }
    if (!user) {
      const cached = users.get(claims.userId);
      if (cached && Date.now() - cached.at < USER_TTL_MS) user = cached.user;
      else {
        user = await p.getUser(claims.userId);
        if (solanaWallet(user)) users.set(claims.userId, { user, at: Date.now() });
        if (users.size > 5000) users.delete(users.keys().next().value!);
      }
    }
    return { privyId: claims.userId, email: verifiedEmail(user), wallet: solanaWallet(user) };
  } catch {
    return null;
  }
}

/** Whether the configured Privy app id and secret are accepted by Privy (null: not configured). */
export async function privyCredentialsWork(): Promise<boolean | null> {
  const p = privy();
  if (!p) return null;
  try {
    await p.getAppSettings();
    return true;
  } catch {
    return false;
  }
}
