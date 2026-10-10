import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getProgram, type WukongProgram } from "../wukong";

// turbopackIgnore: keep the dev bundler from tracing (and watching) the whole
// project through process.cwd(); otherwise every ledger/store write reloads the page.
export const DATA_DIR =
  process.env.WUKONG_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".data");
export const KEYS_DIR = path.join(DATA_DIR, "keys");

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

export function deployment(): Deployment {
  if (deploymentCache) return deploymentCache;
  const file = path.join(DATA_DIR, "deployment.json");
  if (!fs.existsSync(file)) {
    throw new Error("No deployment found. Run `npm run setup:localnet` (or setup:devnet) first.");
  }
  deploymentCache = JSON.parse(fs.readFileSync(file, "utf8")) as Deployment;
  return deploymentCache;
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
  const trimmed = raw.trim();
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed)));
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

/** Load or lazily create a named key (used for simulated crowd workers). */
export function loadOrCreateKey(role: string): Keypair {
  const file = path.join(KEYS_DIR, `${role}.json`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(Array.from(Keypair.generate().secretKey)));
  }
  return loadKey(role);
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
