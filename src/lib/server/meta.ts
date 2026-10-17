// Small, cached lookups for page metadata, share images and structured data.
// Each one is time-boxed: a slow RPC or database must never hold a page back,
// so on a timeout or error they answer "unknown" and the page falls back to
// generic text.

import { cache } from "react";
import { PublicKey } from "@solana/web3.js";
import { fetchReputation } from "../wukong";
import { HANDLE_RE, normalizeHandle, profileByHandle, profileByWallet, publicProfile, type PublicProfile } from "./accounts";
import { hasDeployment, program } from "./env";
import { store } from "./store";
import { taskSummary, type TaskSummary } from "./views";

const TIMEOUT_MS = 3500;

export type Lookup<T> = { found: true; value: T } | { found: false; known: boolean };

async function lookup<T>(work: () => Promise<T | null>): Promise<Lookup<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      work(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), TIMEOUT_MS);
      }),
    ]);
    if (value === "timeout") return { found: false, known: false };
    return value === null ? { found: false, known: true } : { found: true, value };
  } catch {
    return { found: false, known: false };
  } finally {
    clearTimeout(timer);
  }
}

/** A base58 Solana address: 32–44 characters, no 0, O, I or l. */
export function isAddress(s: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return false;
  try {
    return new PublicKey(s).toBase58() === s;
  } catch {
    return false;
  }
}

/** A handle from a URL segment ("@sita", "%40sita" or "sita"), or null when it can't be one. */
export function handleFromSegment(segment: string): string | null {
  let raw = segment;
  try {
    raw = decodeURIComponent(segment);
  } catch {
    return null;
  }
  const h = normalizeHandle(raw.replace(/^@/, ""));
  return HANDLE_RE.test(h) ? h : null;
}

export const getTaskSummary = cache(
  (taskKey: string): Promise<Lookup<TaskSummary>> => (hasDeployment() ? lookup(() => taskSummary(taskKey)) : Promise.resolve({ found: false, known: false })),
);

export const getProfileByHandle = cache(
  (handle: string): Promise<Lookup<PublicProfile>> =>
    lookup(async () => {
      const p = await profileByHandle(handle);
      return p?.onboardedAt ? publicProfile(p) : null;
    }),
);

export interface WorkerSummary {
  wallet: string;
  name?: string;
  profile: PublicProfile | null;
  wins: number;
  submissions: number;
  rating: number;
}

export const getWorkerSummary = cache(
  (wallet: string): Promise<Lookup<WorkerSummary>> =>
    lookup(async () => {
      const [profile, names, rep] = await Promise.all([
        profileByWallet(wallet).catch(() => null),
        store.names().catch(() => ({}) as Record<string, string>),
        hasDeployment() ? fetchReputation(program(), new PublicKey(wallet)).catch(() => null) : Promise.resolve(null),
      ]);
      return {
        wallet,
        name: names[wallet],
        profile: profile?.onboardedAt ? publicProfile(profile) : null,
        wins: rep?.wins ?? 0,
        submissions: rep?.submissions ?? 0,
        rating: rep?.rating ?? 0,
      };
    }),
);
