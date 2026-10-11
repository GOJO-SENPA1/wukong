"use client";

// The signed-in account. With Privy configured (NEXT_PUBLIC_PRIVY_APP_ID), this
// wraps Privy's hooks: sign-in, the user's Solana wallet (embedded or linked),
// signing, key export, and the profile from /api/me. Without it, accounts are
// simply off and the app runs on demo personas and wallet adapters.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useIdentityToken, useLogin, usePrivy } from "@privy-io/react-auth";
import { useExportWallet, useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { Transaction, PublicKey, type VersionedTransaction } from "@solana/web3.js";
import type { ClientSigner } from "@/lib/client/api";

export type Role = "worker" | "company";
export type LoginMethod = "email" | "google" | "wallet";

export { HELP_EMAIL } from "@/lib/contact";

export interface MeProfile {
  handle: string | null;
  displayName: string;
  role: Role;
  company: string | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
  wallet: string;
  joined: string;
  emailOnWin: boolean;
}

export interface Me {
  enabled: boolean;
  email: string | null;
  wallet: string | null;
  onboarded: boolean;
  profile: MeProfile | null;
  /** An organisation invitation waiting for this email, until onboarding claims it */
  invite: { company: string } | null;
  /** The login's wallet already belongs to another account */
  walletInUse?: boolean;
}

export interface AccountState {
  /** Privy is configured on this deployment */
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  me: Me | null;
  /** The account's role once onboarded */
  role: Role | null;
  /** What to call the signed-in user before their profile loads (Google name or email name) */
  name: string | null;
  signer: ClientSigner | null;
  /** The account wallet is Privy's embedded wallet (so its key can be exported) */
  embedded: boolean;
  /** Open sign-in, offering only these methods (all of them by default) */
  login: (methods?: LoginMethod[]) => void;
  /** Why signing in or loading the account last failed, in plain words */
  error: string | null;
  clearError: () => void;
  logout: () => Promise<void>;
  /** Authorization headers for API calls */
  tokens: () => Promise<Record<string, string>>;
  refresh: () => Promise<void>;
  exportWallet: () => Promise<void>;
}

const noop = async () => {};
const OFF: AccountState = {
  enabled: false,
  ready: true,
  authenticated: false,
  me: null,
  role: null,
  name: null,
  signer: null,
  embedded: false,
  login: () => {},
  error: null,
  clearError: () => {},
  logout: noop,
  tokens: async () => ({}),
  refresh: noop,
  exportWallet: noop,
};

const Ctx = createContext<AccountState>(OFF);
export const useAccount = () => useContext(Ctx);

export const ACCOUNTS_ON = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/** Privy's error codes, as something a person can act on. Closing the modal isn't an error. */
const LOGIN_ERRORS: Record<string, string> = {
  allowlist_rejected: "This account isn't allowed to sign in yet.",
  disallowed_login_method: "That sign-in method isn't switched on yet. Try another one.",
  oauth_user_denied: "Google sign-in was cancelled.",
  oauth_account_suspended: "That Google account can't be used here.",
  oauth_unexpected: "Google sign-in didn't complete. Try again, or use your email.",
  invalid_credentials: "That code didn't match. Try again.",
  captcha_failure: "The security check failed. Try again.",
  captcha_timeout: "The security check timed out. Try again.",
  too_many_requests: "Too many attempts. Wait a minute and try again.",
  client_request_timeout: "Sign-in timed out. Check your connection and try again.",
  embedded_wallet_create_error: "We couldn't create your wallet. Try again.",
  buffer_not_defined: "Your browser couldn't load the wallet. Refresh the page and try again.",
  generic_connect_wallet_error: "Your wallet didn't connect. Unlock it and try again.",
  unknown_connect_wallet_error: "Your wallet didn't connect. Unlock it and try again.",
  no_solana_accounts: "That wallet has no Solana account. Switch it to Solana and try again.",
  unsupported_wallet_type: "That wallet isn't supported. Try Phantom, Solflare or Backpack.",
  session_storage_unavailable: "Your browser is blocking site storage (private mode?). Allow it and try again.",
  disallowed_plus_email: "Email addresses with a + aren't accepted.",
};
export function loginErrorMessage(code: string): string {
  return LOGIN_ERRORS[code] ?? `Sign-in didn't complete (${code}). Try again.`;
}

export function AccountProvider({ children, cluster }: { children: ReactNode; cluster?: string }) {
  if (!ACCOUNTS_ON) return <Ctx.Provider value={OFF}>{children}</Ctx.Provider>;
  return <PrivyAccount cluster={cluster}>{children}</PrivyAccount>;
}

function PrivyAccount({ children, cluster }: { children: ReactNode; cluster?: string }) {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const [error, setError] = useState<string | null>(null);
  const { login } = useLogin({
    onError: (code) => {
      if (code !== "exited_auth_flow") setError(loginErrorMessage(code));
    },
  });
  const { identityToken } = useIdentityToken();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const { exportWallet } = useExportWallet();
  const [me, setMe] = useState<Me | null>(null);

  const tokens = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getAccessToken();
    if (!token) return {};
    return { authorization: `Bearer ${token}`, ...(identityToken ? { "x-privy-id-token": identityToken } : {}) };
  }, [getAccessToken, identityToken]);

  // Transient failures (a slow or restarting server) are retried a few times before giving up.
  const retries = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refresh = useCallback(async (): Promise<void> => {
    clearTimeout(retryTimer.current);
    if (!authenticated) return setMe(null);
    const retry = (message: string) => {
      if (retries.current < 3) {
        retries.current++;
        retryTimer.current = setTimeout(() => void refresh(), 2500 * retries.current);
      } else setError(message);
    };
    try {
      const res = await fetch("/api/me", { headers: await tokens(), cache: "no-store", signal: AbortSignal.timeout(25_000) });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.enabled === true) {
        retries.current = 0;
        setMe(body as Me);
        setError(null);
      } else if (res.ok) {
        setError("Sign-in isn't fully set up on the server yet (its Privy or database settings are missing).");
      } else if (res.status === 401) {
        setError("We couldn't confirm your sign-in. Sign out, then sign in again.");
      } else if (res.status === 429) {
        retry("Too many requests. Wait a minute and refresh.");
      } else if (body?.error) {
        if (res.status >= 500) retry(`${body.error} (${res.status})`);
        else setError(body.error);
      } else {
        // No JSON at all: the request never reached our code, or the platform cut it off.
        retry(`The server didn't finish loading your account (error ${res.status}). Try again in a moment, or open /status to see why.`);
      }
    } catch (err) {
      if ((err as Error).name === "TimeoutError") retry("The server took too long to load your account. Try again in a moment.");
      /* otherwise offline: keep what we had */
    }
  }, [authenticated, tokens]);

  useEffect(() => {
    retries.current = 0;
    refresh();
    return () => clearTimeout(retryTimer.current);
  }, [refresh, user?.id, wallets.length]);

  const embeddedAddress = useMemo(() => {
    const acct = user?.linkedAccounts.find(
      (a) => a.type === "wallet" && "chainType" in a && a.chainType === "solana" && "walletClientType" in a && a.walletClientType === "privy",
    ) as { address?: string } | undefined;
    return acct?.address;
  }, [user]);

  // Sign with the wallet the server has on file for this account.
  const wallet = useMemo(() => {
    const want = me?.wallet ?? embeddedAddress;
    return wallets.find((w) => w.address === want) ?? null;
  }, [wallets, me?.wallet, embeddedAddress]);

  const signer: ClientSigner | null = useMemo(() => {
    if (!authenticated || !wallet) return null;
    const chain = cluster === "devnet" ? "solana:devnet" : cluster === "mainnet-beta" ? "solana:mainnet" : undefined;
    return {
      publicKey: new PublicKey(wallet.address),
      async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        const bytes =
          tx instanceof Transaction ? tx.serialize({ requireAllSignatures: false, verifySignatures: false }) : (tx as VersionedTransaction).serialize();
        const { signedTransaction } = await signTransaction({ transaction: new Uint8Array(bytes), wallet, ...(chain ? { chain } : {}) });
        return (tx instanceof Transaction ? Transaction.from(signedTransaction) : tx) as T;
      },
    };
  }, [authenticated, wallet, signTransaction, cluster]);

  const value: AccountState = {
    enabled: true,
    ready,
    authenticated,
    me,
    role: me?.onboarded ? (me.profile?.role ?? null) : null,
    name: user?.google?.name ?? (user?.email?.address ?? user?.google?.email)?.split("@")[0] ?? null,
    signer,
    embedded: !!embeddedAddress && wallet?.address === embeddedAddress,
    login: (methods) => {
      setError(null);
      login(methods?.length ? { loginMethods: methods } : undefined);
    },
    error,
    clearError: () => setError(null),
    logout: async () => {
      await logout();
      setMe(null);
      setError(null);
    },
    tokens,
    refresh,
    exportWallet: async () => {
      if (embeddedAddress) await exportWallet({ address: embeddedAddress });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
