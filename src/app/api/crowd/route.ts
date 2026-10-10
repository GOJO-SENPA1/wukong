import { z } from "zod";
import { summonCrowd } from "@/lib/server/crowd";
import { demoMode } from "@/lib/server/env";
import { HttpError, rateLimit, readJson } from "@/lib/server/guard";
import { fail, ndjson } from "@/lib/server/http";
import { kv } from "@/lib/server/kv";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Demo only: a scripted crowd enters a demo-template task. Once per task, and
// rate limited, because every bot submission costs the faucet rent and fees.
export async function POST(req: Request) {
  if (!demoMode()) return fail("Demo-only endpoint (WUKONG_DEMO_MODE is off)", 403);
  try {
    const { task, pace } = z
      .object({ task: z.string().min(32).max(44), pace: z.number().int().min(0).max(5000).optional() })
      .parse(await readJson(req, 1024));
    await rateLimit(req, "crowd-ip", 4, 3600_000);
    await rateLimit(req, "crowd-day", 40, 24 * 3600_000, "all");
    if (!(await kv().lock(`crowd:${task}`, 30 * 24 * 3600_000))) throw new HttpError(409, "The crowd has already been summoned for this task");
    return ndjson(summonCrowd(task, pace ?? 700));
  } catch (err) {
    return fail(err);
  }
}
