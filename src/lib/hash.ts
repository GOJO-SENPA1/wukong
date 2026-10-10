import { sha256 } from "@noble/hashes/sha256";
import { toHex } from "./format";

const enc = new TextEncoder();

export function sha256Bytes(text: string): Uint8Array {
  return sha256(enc.encode(text));
}

export function sha256Hex(text: string): string {
  return toHex(sha256Bytes(text));
}

/** Deterministic JSON (sorted keys) so report hashes are reproducible by anyone. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}
