"use client";

// The signed-in account. With Privy configured (NEXT_PUBLIC_PRIVY_APP_ID), this
// wraps Privy's hooks: sign-in, the user's Solana wallet (embedded or linked),
// signing, key export, and the profile from /api/me. Without it, accounts are
// simply off and the app runs on demo personas and wallet adapters.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePrivy, useIdentityToken } from "@privy-io/react-auth";
import { useExportWallet, useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { Transaction, PublicKey, type VersionedTransaction } from "@solana/web3.js";
import type { ClientSigner } from "@/lib/client/api";

export type Role = "worker" | "company";

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
}

export interface AccountState {
  /** Privy is configured on this deployment */
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  me: Me | null;
  /** The account's role once onboarded */
  role: Role | null;
  signer: ClientSigner | null;
  /** The account wallet is Privy's embedded wallet (so its key can be exported) */
  embedded: boolean;
  login: () => void;
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
  signer: null,
  embedded: false,
  login: () => {},
  logout: noop,
  tokens: async () => ({}),
  refresh: noop,
  exportWallet: noop,
};

const Ctx = createContext<AccountState>(OFF);
export const useAccount = () => useContext(Ctx);

export const ACCOUNTS_ON = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function AccountProvider({ children, cluster }: { children: ReactNode; cluster?: string }) {
  if (!ACCOUNTS_ON) return <Ctx.Provider value={OFF}>{children}</Ctx.Provider>;
  return <PrivyAccount cluster={cluster}>{children}</PrivyAccount>;
}

function PrivyAccount({ children, cluster }: { children: ReactNode; cluster?: string }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
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

  const refresh = useCallback(async () => {
    if (!authenticated) return setMe(null);
    try {
      const res = await fetch("/api/me", { headers: await tokens(), cache: "no-store" });
      if (res.ok) setMe((await res.json()) as Me);
    } catch {
      /* offline: keep what we had */
    }
  }, [authenticated, tokens]);

  useEffect(() => {
    refresh();
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
    signer,
    embedded: !!embeddedAddress && wallet?.address === embeddedAddress,
    login,
    logout: async () => {
      await logout();
      setMe(null);
    },
    tokens,
    refresh,
    exportWallet: async () => {
      if (embeddedAddress) await exportWallet({ address: embeddedAddress });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
