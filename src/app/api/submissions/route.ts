import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({
  task: z.string().min(32).max(44),
  worker: z.string().min(32).max(44),
  content: z.string().min(1).max(8000),
  workerName: z.string().max(60).optional(),
});

/** Store work off-chain first; the worker then commits its hash on-chain. */
export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const hash = sha256Hex(body.content);
    store.putSubmission({ hash, ...body, createdAt: Date.now() });
    if (body.workerName) store.setName(body.worker, body.workerName);
    return ok({ hash });
  } catch (err) {
    return fail(err);
  }
}
