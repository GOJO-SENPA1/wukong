import { z } from "zod";
import { rateLimit, readJson } from "@/lib/server/guard";
import { fail, ndjson } from "@/lib/server/http";
import { judgeTask } from "@/lib/server/judge";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    await rateLimit(req, "judge", 6, 60_000);
    const { task } = z.object({ task: z.string().min(32).max(44) }).parse(await readJson(req, 1024));
    return ndjson(judgeTask(task));
  } catch (err) {
    return fail(err);
  }
}
