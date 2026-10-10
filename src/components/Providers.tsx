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
import { getJSON, postJSON, type ClientSigner } from "@/lib/client/api";
import type { TaskCard } from "@/lib/server/views";
import type { ConfigView } from "@/lib/wukong";

export interface AppState {
  ready: boolean;
  error?: string;
  deployment?: { cluster: string; rpcUrl: string; programId: string; mint: string; judge: string };
  judge?: { engine: "claude" | "heuristic"; model: string };
  demoMode?: boolean;
  config?: ConfigView | null;
  tasks?: TaskCard[];
  stats?: { tasks: number; open: number; escrowed: number; paid: number; submissions: number };
}

interface Ctx {
  state: AppState;
  refresh: () => Promise<void>;
  persona: PersonaId | "wallet";
  setPersona: (p: PersonaId | "wallet") => void;
  signer: ClientSigner | null;
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
  const [keys, setKeys] = useState<Record<string, Keypair>>({});
  const [persona, setPersonaState] = useState<PersonaId | "wallet">("company");
  const [funding, setFunding] = useState(false);
  const fundedFor = useRef<string | null>(null);

  useEffect(() => {
    setKeys(loadPersonaKeys());
    const saved = safeGet(ACTIVE_KEY) as PersonaId | "wallet" | null;
    if (saved) setPersonaState(saved);
  }, []);

  const setPersona = useCallback((p: PersonaId | "wallet") => {
    setPersonaState(p);
    safeSet(ACTIVE_KEY, p);
  }, []);

  // Fund personas (gas + demo USDC for the company) once per deployment.
  const mint = state.deployment?.mint;
  useEffect(() => {
    if (!mint || !Object.keys(keys).length || fundedFor.current === mint) return;
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
  }, [mint, keys]);

  const signer: ClientSigner | null = useMemo(() => {
    if (persona === "wallet") {
      if (!wallet.publicKey || !wallet.signTransaction) return null;
      return { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction };
    }
    const kp = keys[persona];
    return kp ? burnerSigner(kp) : null;
  }, [persona, keys, wallet.publicKey, wallet.signTransaction]);

  const personaName =
    persona === "wallet"
      ? wallet.publicKey
        ? "Your wallet"
        : "Connect wallet"
      : (() => {
          const p = PERSONAS.find((x) => x.id === persona)!;
          return `${p.name} · ${p.city}`;
        })();

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
      value={{ state, refresh, persona, setPersona, signer, personaName, personaKeys, funding, explorer }}
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
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Inner state={state} refresh={refresh}>
            {children}
          </Inner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
