import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { accountError, profileLabel, writerFor } from "@/lib/server/accounts";
import { HttpError, rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({
  task: z.string().min(32).max(44),
  worker: z.string().min(32).max(44),
  content: z.string().min(1).max(8000),
  workerName: z.string().max(60).optional(),
});

/**
 * Store work off-chain first; the worker then commits its hash on-chain. With
 * accounts on, only a signed-in freelancer may store work, for their own wallet,
 * under their profile name; the judge treats entries with no stored work as missing.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    await rateLimit(req, "submissions", 20, 60_000);
    body = Body.parse(await readJson(req, 48 * 1024));
  } catch (err) {
    return fail(err);
  }
  try {
    const profile = await writerFor(req, "worker");
    if (profile && body.worker !== profile.wallet) throw new HttpError(403, "You can only submit as your own account");
    const hash = sha256Hex(body.content);
    const workerName = profile ? profileLabel(profile) : body.workerName?.slice(0, 40);
    await store.putSubmission({ hash, task: body.task, worker: body.worker, content: body.content, workerName, createdAt: Date.now() });
    if (profile) await store.setName(profile.wallet, profileLabel(profile));
    else if (workerName) await store.setNameOnce(body.worker, workerName);
    return ok({ hash });
  } catch (err) {
    return accountError(err);
  }
}
