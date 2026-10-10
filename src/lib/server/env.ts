import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getProgram, type WukongProgram } from "../wukong";

// turbopackIgnore: keep the dev bundler from tracing (and watching) the whole
// project through process.cwd(); otherwise every ledger/store write reloads the page.
export const DATA_DIR =
  process.env.WUKONG_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".data");
export const KEYS_DIR = path.join(DATA_DIR, "keys");

/**
 * Demo mode enables the faucet, the simulated crowd, and lets anyone ask the
 * judge to close an open task early. On by default only on localnet; a
 * public deployment opts in with WUKONG_DEMO_MODE=1 (e.g. a hackathon demo
 * on devnet). Off: only the creator (on-chain) or the deadline closes
 * submissions, and the demo-only endpoints refuse.
 */
export function demoMode(): boolean {
  let cluster: Deployment["cluster"] | undefined;
  try {
    cluster = deployment().cluster;
  } catch {
    return false; // no deployment: fail closed
  }
  if (cluster === "mainnet-beta") return false; // never with real money
  const flag = process.env.WUKONG_DEMO_MODE?.trim().toLowerCase();
  if (flag !== undefined && flag !== "") return flag === "1" || flag === "true";
  return cluster === "localnet";
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let demoCreators: Set<string> | null = null;

/**
 * The seeded demo companies (keys derived on the server by scripts/seed.ts) and the x402 gateway.
 * In demo mode their tasks may be closed early by anyone, so visitors can watch
 * the judge work; nobody else's task can be closed early by the server.
 */
export function isDemoCreator(creator: string): boolean {
  if (!demoCreators) {
    // Lazy import: demo content is only needed here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TEMPLATES } = require("../demo") as typeof import("../demo");
    demoCreators = new Set(TEMPLATES.map((t) => loadOrDeriveKey(`creators/${slug(t.creatorName)}`).publicKey.toBase58()));
    // x402 tasks are created by the gateway on an agent's behalf: in a demo, the agent's run can close its own task.
    demoCreators.add(deployment().gateway);
  }
  return demoCreators.has(creator);
}

export interface Deployment {
  cluster: "localnet" | "devnet" | "mainnet-beta";
  rpcUrl: string;
  programId: string;
  mint: string;
  admin: string;
  judge: string;
  treasury: string;
  gateway: string;
}

let deploymentCache: Deployment | null = null;

/** From WUKONG_DEPLOYMENT (JSON, for hosted deploys) or .data/deployment.json. */
export function deployment(): Deployment {
  if (deploymentCache) return deploymentCache;
  if (process.env.WUKONG_DEPLOYMENT) {
    deploymentCache = JSON.parse(process.env.WUKONG_DEPLOYMENT) as Deployment;
    return deploymentCache;
  }
  const file = path.join(DATA_DIR, "deployment.json");
  if (!fs.existsSync(file)) {
    throw new Error("No deployment found. Run `npm run setup:localnet` (or setup:devnet) first.");
  }
  deploymentCache = JSON.parse(fs.readFileSync(file, "utf8")) as Deployment;
  return deploymentCache;
}

/**
 * The RPC URL browsers may use. The server's own RPC (SOLANA_RPC_URL, or the one
 * in the deployment) often carries a paid API key, so it is never sent to clients:
 * use WUKONG_PUBLIC_RPC_URL (e.g. a domain-restricted key) or the cluster's public endpoint.
 */
export function publicRpcUrl(): string {
  const explicit = process.env.WUKONG_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (explicit) return explicit;
  const dep = deployment();
  if (dep.cluster === "localnet") return dep.rpcUrl;
  return dep.cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
}

export function hasDeployment(): boolean {
  try {
    deployment();
    return true;
  } catch {
    return false;
  }
}

function parseSecret(raw: string): Keypair {
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw.trim())));
  } catch {
    // Never echo any of the value: JSON.parse errors quote the input.
    throw new Error("A server key is misconfigured (expected a JSON array of 64 numbers)");
  }
}

const keyCache = new Map<string, Keypair>();

/** Load a server key by role. Env var WUKONG_<ROLE>_SECRET (JSON array) wins over .data/keys. */
export function loadKey(role: string): Keypair {
  const cached = keyCache.get(role);
  if (cached) return cached;
  const env = process.env[`WUKONG_${role.toUpperCase()}_SECRET`];
  let kp: Keypair;
  if (env) kp = parseSecret(env);
  else {
    const file = path.join(KEYS_DIR, `${role}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing key ${file}. Run setup first.`);
    kp = parseSecret(fs.readFileSync(file, "utf8"));
  }
  keyCache.set(role, kp);
  return kp;
}

/**
 * A named demo key (simulated crowd workers, seeded creators). A key file in
 * .data/keys wins; otherwise the key is derived from WUKONG_SIM_SEED (or the
 * judge key), so every server instance agrees on it without writing to disk.
 */
export function loadOrDeriveKey(role: string): Keypair {
  const cached = keyCache.get(role);
  if (cached) return cached;
  if (fs.existsSync(path.join(KEYS_DIR, `${role}.json`))) return loadKey(role);
  const seed = process.env.WUKONG_SIM_SEED ?? Buffer.from(loadKey("judge").secretKey).toString("hex");
  const kp = Keypair.fromSeed(createHash("sha256").update(`wukong/sim-key/v1/${role}/${seed}`).digest());
  keyCache.set(role, kp);
  return kp;
}

let connCache: Connection | null = null;
let programCache: WukongProgram | null = null;

export function connection(): Connection {
  if (!connCache) {
    const url = process.env.SOLANA_RPC_URL ?? deployment().rpcUrl;
    connCache = new Connection(url, "confirmed");
  }
  return connCache;
}

export function program(): WukongProgram {
  if (!programCache) programCache = getProgram(connection());
  return programCache;
}

export function mint(): PublicKey {
  return new PublicKey(deployment().mint);
}
