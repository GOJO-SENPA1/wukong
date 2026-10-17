import { z } from "zod";
import { EVENT_NAMES, EVENT_PROPS } from "@/lib/events";
import { hidden, statusKeyOk } from "@/lib/server/admin";
import { rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { kv } from "@/lib/server/kv";

export const dynamic = "force-dynamic";

// Anonymous, consent-gated product events, counted per day. Nothing that identifies
// a person is stored: no IP, cookie, account or wallet, only the event, the page
// type (ids collapsed, see normalizePath) and a few short labels.

const KEEP_DAYS = 400;
const label = z.string().max(40).regex(/^[\w .&-]+$/);
const Body = z.object({
  event: z.enum(EVENT_NAMES),
  path: z.string().max(80).regex(/^\/[\w/[\]@.-]*$/),
  props: z.partialRecord(z.enum(EVENT_PROPS), label).optional(),
});

const day = (d = new Date()) => d.toISOString().slice(0, 10);

export async function POST(req: Request) {
  // The browser's own "don't track me" signal wins, whatever the page sent.
  if (req.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  try {
    await rateLimit(req, "events", 120, 60_000);
    const { event, path, props } = Body.parse(await readJson(req, 2048));
    const fields = [`event:${event}`, `page:${event}:${path}`, ...Object.entries(props ?? {}).map(([k, v]) => `prop:${event}:${k}=${v}`)];
    await kv().tally(`events:${day()}`, fields, KEEP_DAYS);
    return new Response(null, { status: 204 });
  } catch (err) {
    return fail(err);
  }
}

/**
 * Daily totals for the operators: GET /api/events?key=<WUKONG_STATUS_KEY>&days=30.
 * A 404 to everyone else, like the status page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!statusKeyOk(url.searchParams.get("key"))) return hidden();
  try {
    await rateLimit(req, "events-read", 30, 60_000);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));
    const dates = Array.from({ length: days }, (_, i) => day(new Date(Date.now() - i * 86_400_000)));
    const rows = await Promise.all(dates.map(async (d) => ({ day: d, counts: await kv().tallies(`events:${d}`) })));
    const totals: Record<string, number> = {};
    for (const r of rows) for (const [f, n] of Object.entries(r.counts)) if (f.startsWith("event:")) totals[f.slice(6)] = (totals[f.slice(6)] ?? 0) + n;
    return ok({ days, totals, byDay: rows.filter((r) => Object.keys(r.counts).length) }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return fail(err, 502);
  }
}
