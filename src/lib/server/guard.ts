// Request guards shared by the API routes: per-IP rate limits (Redis-backed in
// production, so they hold across serverless instances), request size limits,
// and safe error responses that never echo internals.

import { kv } from "./kv";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The caller's IP as the edge proxy saw it (Vercel and Fly set these), else "unknown". */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || req.headers.get("fly-client-ip") || "unknown";
  return ip.slice(0, 64);
}

/** Allow `limit` requests per `windowMs` per IP for this bucket; throws 429 beyond that. */
export async function rateLimit(req: Request, bucket: string, limit: number, windowMs: number, key?: string): Promise<void> {
  const id = key ?? clientIp(req);
  const n = await kv()
    .hit(`${bucket}:${id}`, windowMs)
    .catch(() => 0); // a store outage shouldn't take the site down
  if (n > limit) throw new HttpError(429, "Too many requests. Slow down and try again shortly.");
}

/** Parse a JSON body, refusing anything over maxBytes. */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new HttpError(413, "Request too large");
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, "Request too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}
