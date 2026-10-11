"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PERSONAS, type PersonaId } from "@/lib/demo";
import { getJSON, postJSON, setAuthHeaderSource, type ClientSigner } from "@/lib/client/api";
import { ACCOUNTS_ON, AccountProvider, useAccount, type Role } from "./auth/Account";
import type { TaskCard } from "@/lib/server/views";
import type { ConfigView } from "@/lib/wukong";

export interface AppState {
  ready: boolean;
  error?: string;
  deployment?: { cluster: string; rpcUrl: string; programId: string; mint: string; judge: string };
  judge?: { engine: "claude" | "openai-compatible" | "heuristic"; model: string };
  /** Demo features: the simulated crowd, closing demo tasks early, the test-funds button */
  demoMode?: boolean;
  /** The network hands out test funds: a signed-in account's wallet is topped up quietly */
  autoFund?: boolean;
  config?: ConfigView | null;
  tasks?: TaskCard[];
  stats?: { tasks: number; open: number; escrowed: number; paid: number; submissions: number };
}

export type ActiveId = PersonaId | "wallet" | "account";

interface Ctx {
  state: AppState;
  refresh: () => Promise<void>;
  persona: ActiveId;
  setPersona: (p: ActiveId) => void;
  signer: ClientSigner | null;
  /** What the active identity may do: workers enter tasks, companies post them. null: not signed in / not set up */
  role: Role | null;
  /** Demo personas are on offer (demo mode, or accounts not configured) */
  personasOn: boolean;
  /** Who's signed in is known (saved persona read, Privy settled): hide identity UI until then so it never flashes */
  identityReady: boolean;
  personaName: string;
  personaKeys: Record<string, string>;
  funding: boolean;
  explorer: (kind: "tx" | "address", id: string) => string;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside Providers");
  return ctx;
}

const STORE_KEY = "wukong.personas.v1";
const ACTIVE_KEY = "wukong.persona.active";
const FUNDED_KEY = "wukong.funded";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: personas just won't persist */
  }
}

function loadPersonaKeys(): Record<string, Keypair> {
  let raw: Record<string, number[]> = {};
  try {
    raw = JSON.parse(safeGet(STORE_KEY) ?? "{}");
  } catch {
    raw = {};
  }
  const out: Record<string, Keypair> = {};
  let changed = false;
  for (const p of PERSONAS) {
    if (raw[p.id]) out[p.id] = Keypair.fromSecretKey(Uint8Array.from(raw[p.id]));
    else {
      out[p.id] = Keypair.generate();
      raw[p.id] = Array.from(out[p.id].secretKey);
      changed = true;
    }
  }
  if (changed) safeSet(STORE_KEY, JSON.stringify(raw));
  return out;
}

function burnerSigner(kp: Keypair): ClientSigner {
  return {
    publicKey: kp.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof VersionedTransaction) tx.sign([kp]);
      else tx.partialSign(kp);
      return tx;
    },
  };
}

function Inner({ children, state, refresh }: { children: ReactNode; state: AppState; refresh: () => Promise<void> }) {
  const wallet = useWallet();
  const account = useAccount();
  // Burner personas are for demos without sign-in. Where real accounts exist, they're the only identity.
  const personasOn = !account.enabled;
  const [keys, setKeys] = useState<Record<string, Keypair>>({});
  const [persona, setPersonaState] = useState<ActiveId>("company");
  const [funding, setFunding] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [graceOver, setGraceOver] = useState(false);
  const fundedFor = useRef<string | null>(null);

  useEffect(() => {
    setKeys(loadPersonaKeys());
    const saved = safeGet(ACTIVE_KEY) as ActiveId | null;
    if (saved) setPersonaState(saved);
    setHydrated(true);
    // Never hold the identity UI back for long, even if Privy or the API is slow.
    const t = setTimeout(() => setGraceOver(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const setPersona = useCallback((p: ActiveId) => {
    setPersonaState(p);
    safeSet(ACTIVE_KEY, p);
  }, []);

  // Signing in switches to the account; with the demo off, the account is the only identity.
  useEffect(() => {
    if (!personasOn || account.authenticated) setPersonaState("account");
    else setPersonaState((p) => (p === "account" ? "company" : p));
  }, [account.authenticated, personasOn]);

  // The account's Privy tokens go with API calls while the account is the active identity.
  useEffect(() => {
    setAuthHeaderSource(persona === "account" && account.authenticated ? account.tokens : null);
    return () => setAuthHeaderSource(null);
  }, [persona, account.authenticated, account.tokens]);

  // Fund personas (gas + demo USDC for the company) once per deployment, only where demo personas are on offer.
  const mint = state.deployment?.mint;
  const fundPersonas = personasOn && state.demoMode !== false;
  useEffect(() => {
    if (!fundPersonas || !mint || !Object.keys(keys).length || fundedFor.current === mint) return;
    fundedFor.current = mint;
    const already = safeGet(FUNDED_KEY) === mint;
    const names: Record<string, string> = {};
    for (const p of PERSONAS) names[keys[p.id].publicKey.toBase58()] = `${p.name} · ${p.city}`;
    postJSON("/api/names", { names }).catch(() => {});
    if (already) return;
    setFunding(true);
    (async () => {
      for (const p of PERSONAS) {
        await postJSON("/api/faucet", { address: keys[p.id].publicKey.toBase58(), role: p.role }).catch(() => {});
      }
      safeSet(FUNDED_KEY, mint);
      setFunding(false);
    })();
  }, [mint, keys, fundPersonas]);

  const signer: ClientSigner | null = useMemo(() => {
    if (persona === "account") return account.signer;
    if (persona === "wallet") {
      if (!wallet.publicKey || !wallet.signTransaction) return null;
      return { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction };
    }
    const kp = keys[persona];
    return kp ? burnerSigner(kp) : null;
  }, [persona, keys, wallet.publicKey, wallet.signTransaction, account.signer]);

  const profile = account.me?.profile;
  const personaName =
    persona === "account"
      ? account.authenticated
        ? profile
          ? `${profile.role === "company" ? profile.company || profile.displayName : profile.displayName}${profile.city ? ` · ${profile.city}` : ""}`
          : (account.name ?? account.me?.email ?? "Your account")
        : "Sign in"
      : persona === "wallet"
        ? wallet.publicKey
          ? "Your wallet"
          : "Connect wallet"
        : (() => {
            const p = PERSONAS.find((x) => x.id === persona)!;
            return `${p.name} · ${p.city}`;
          })();

  // Workers enter tasks, companies post them. A bare wallet (no account) counts as a worker.
  const role: Role | null =
    persona === "account" ? account.role : persona === "wallet" ? (wallet.publicKey ? "worker" : null) : PERSONAS.find((x) => x.id === persona)?.role === "company" ? "company" : "worker";

  // On a test network, a signed-in account's wallet is kept topped up for fees (and an
  // organisation's with the network's USDC), quietly: once per browser session, and the
  // server only sends anything when a balance has run low.
  const accountWallet = persona === "account" && account.role ? account.me?.wallet : undefined;
  useEffect(() => {
    if (!accountWallet || !state.autoFund || !mint) return;
    const key = `${FUNDED_KEY}.${accountWallet}.${mint}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: top up anyway, the server rate-limits it */
    }
    postJSON("/api/faucet", { address: accountWallet, role: account.role === "company" ? "company" : "worker" }).catch(() => {});
  }, [accountWallet, state.autoFund, mint, account.role]);

  const identityReady =
    hydrated &&
    (graceOver ||
      (account.ready &&
        (persona !== "account" || !account.authenticated || account.me !== null) &&
        (!account.enabled || state.demoMode !== undefined || state.error !== undefined)));

  const personaKeys = useMemo(
    () => Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, v.publicKey.toBase58()])),
    [keys],
  );

  const explorer = useCallback(
    (kind: "tx" | "address", id: string) => {
      const dep = state.deployment;
      const base = `https://explorer.solana.com/${kind}/${id}`;
      if (!dep || dep.cluster === "mainnet-beta") return base;
      if (dep.cluster === "devnet") return `${base}?cluster=devnet`;
      return `${base}?cluster=custom&customUrl=${encodeURIComponent(dep.rpcUrl)}`;
    },
    [state.deployment],
  );

  return (
    <AppCtx.Provider
      value={{ state, refresh, persona, setPersona, signer, role, personasOn, identityReady, personaName, personaKeys, funding, explorer }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ ready: false });

  const refresh = useCallback(async () => {
    try {
      const s = await getJSON<AppState>("/api/state");
      setState(s);
    } catch (err) {
      setState((prev) => ({ ...prev, ready: false, error: (err as Error).message }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const endpoint = state.deployment?.rpcUrl ?? "http://127.0.0.1:8899";
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* With accounts on, Privy owns wallet connections; the adapter reconnecting too would fight it. */}
      <WalletProvider wallets={wallets} autoConnect={!ACCOUNTS_ON}>
        <WalletModalProvider>
          <AccountProvider cluster={state.deployment?.cluster}>
            <Inner state={state} refresh={refresh}>
              {children}
            </Inner>
          </AccountProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
