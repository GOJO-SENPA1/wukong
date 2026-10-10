import { PrivyClient } from "@privy-io/server-auth";
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

export async function verifyAuth(authToken: string | undefined): Promise<AuthUser | null> {
  if (!authToken) return null;
  const p = privy();
  if (!p) return null;

  try {
    const claims = await p.verifyAuthToken(authToken);
    const user = await p.getUser(claims.userId);

    const email = user.email?.address;
    const solWallet =
      user.linkedAccounts.find(
        (a) => a.type === "wallet" && a.chainType === "solana",
      ) as { address?: string } | undefined;

    return {
      privyId: claims.userId,
      email,
      wallet: solWallet?.address,
    };
  } catch {
    return null;
  }
}
