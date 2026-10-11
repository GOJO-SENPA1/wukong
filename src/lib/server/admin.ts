// Internal diagnostics (the /status page, /api/health/auth, /api/version) are
// hidden on a public deployment: they answer only to WUKONG_STATUS_KEY, sent as
// the x-status-key header (or ?key= to open the page). Without that variable
// they simply don't exist (404). Local development keeps them open.
// No other imports, so the routes that use this stay light.

import { timingSafeEqual } from "node:crypto";

const isPublic = () => process.env.NODE_ENV === "production" || !!process.env.VERCEL;

export function statusKeyOk(provided: string | null | undefined): boolean {
  if (!isPublic()) return true;
  const key = process.env.WUKONG_STATUS_KEY?.trim();
  if (!key || key.length < 16 || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** What a hidden route answers: the same 404 as a route that doesn't exist. */
export const hidden = () => Response.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "no-store" } });
