import { z } from "zod";
import { demoMode } from "@/lib/server/env";
import { rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({ names: z.record(z.string().min(32).max(44), z.string().min(1).max(40)) });

/**
 * Demo personas announce their display names. Demo only, a few at a time, and
 * only for wallets that have no name yet: nobody can rename someone else.
 * Real accounts get their names from their verified profile.
 */
export async function POST(req: Request) {
  if (!demoMode()) return fail("Demo-only endpoint", 403);
  try {
    await rateLimit(req, "names", 10, 60_000);
    const { names } = Body.parse(await readJson(req, 4096));
    const entries = Object.entries(names).slice(0, 8);
    for (const [k, v] of entries) await store.setNameOnce(k, v);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
