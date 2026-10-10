// Solana Actions (Blinks): any Blink client can render a Wukong task and let
// a worker enter it from wherever the link was posted.
import { PublicKey } from "@solana/web3.js";
import { connection, deployment } from "./env";

export const ACTION_VERSION = "2.4";

const KNOWN_GENESIS: Record<string, string> = {
  devnet: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  "mainnet-beta": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
};

let chainId: string | null = null;

/** CAIP-2 id of the cluster the app is deployed on. */
export async function blockchainId(): Promise<string> {
  if (chainId) return chainId;
  const cluster = deployment().cluster;
  const genesis = KNOWN_GENESIS[cluster] ?? (await connection().getGenesisHash()).slice(0, 32);
  chainId = `solana:${genesis}`;
  return chainId;
}

export async function actionHeaders(): Promise<Record<string, string>> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Action-Version, X-Blockchain-Ids",
    "Access-Control-Expose-Headers": "X-Action-Version, X-Blockchain-Ids",
    "X-Action-Version": ACTION_VERSION,
    "X-Blockchain-Ids": await blockchainId(),
    "Content-Type": "application/json",
  };
}

export async function actionJson(body: unknown, status = 200): Promise<Response> {
  return new Response(JSON.stringify(body), { status, headers: await actionHeaders() });
}

export async function actionError(message: string, status = 400): Promise<Response> {
  return actionJson({ message }, status);
}

export async function preflight(): Promise<Response> {
  return new Response(null, { status: 204, headers: await actionHeaders() });
}

/** Absolute origin as the client reached us (works behind proxy chains). */
export function originOf(req: Request): string {
  const url = new URL(req.url);
  const first = (h: string | null) => h?.split(",")[0]?.trim() || null;
  const host = first(req.headers.get("x-forwarded-host")) ?? req.headers.get("host") ?? url.host;
  const proto = first(req.headers.get("x-forwarded-proto")) ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function parseKey(s: string): PublicKey | null {
  try {
    return new PublicKey(s);
  } catch {
    return null;
  }
}

/**
 * Blink entries travel URL-encoded in the action href, so keep them well under
 * common 16 KB request-line limits (Devanagari is ~9 bytes per character).
 * Longer work goes through the app.
 */
export const BLINK_MAX_CHARS = 1500;
