import { z } from "zod";
import { summonCrowd } from "@/lib/server/crowd";
import { fail, ndjson } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { task, pace } = z
      .object({ task: z.string().min(32).max(44), pace: z.number().int().min(0).max(5000).optional() })
      .parse(await req.json());
    return ndjson(summonCrowd(task, pace ?? 700));
  } catch (err) {
    return fail(err);
  }
}
