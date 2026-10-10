import { z } from "zod";
import { fail, ndjson } from "@/lib/server/http";
import { judgeTask } from "@/lib/server/judge";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { task } = z.object({ task: z.string().min(32).max(44) }).parse(await req.json());
    return ndjson(judgeTask(task));
  } catch (err) {
    return fail(err);
  }
}
