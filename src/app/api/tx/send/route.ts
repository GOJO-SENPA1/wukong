import { after } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { fetchTask } from "@/lib/wukong";
import { program } from "@/lib/server/env";
import { describeRelayed, relay } from "@/lib/server/actions";
import { profileByWallet } from "@/lib/server/accounts";
import { rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { notifyTaskSafe } from "@/lib/server/notify";
import { store } from "@/lib/server/store";

const pubkey = z.string().refine((s) => {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}, "invalid public key");

const Body = z.object({
  tx: z.string().max(4000),
  task: pubkey.optional(),
});

/**
 * Relay a fully signed transaction (the signer pays its own fee; no server key
 * signs here). What gets recorded against the task (activity row, author) is
 * read from the transaction itself, never taken from the request.
 */
export async function POST(req: Request) {
  try {
    await rateLimit(req, "relay", 60, 60_000);
    const body = Body.parse(await readJson(req, 16 * 1024));
    const what = body.task ? describeRelayed(body.tx, body.task) : null;
    const sig = await relay(body.tx);
    if (body.task && what) {
      await store.addTx(body.task, { sig, kind: what.kind, label: what.label, at: Date.now() });
      if (what.kind === "create" && !(await store.taskMeta(body.task))) {
        // Snapshot who posted this task: their profile name, else the brief's author.
        const task = await fetchTask(program(), new PublicKey(body.task));
        if (task && task.creator === what.creator) {
          const [brief, profile] = await Promise.all([store.brief(task.briefHash), profileByWallet(task.creator).catch(() => null)]);
          const name = profile?.onboardedAt ? profile.company || profile.displayName : brief?.creatorName;
          await store.setTaskMeta(body.task, { origin: "web", creatorName: name, template: brief?.template });
        }
      }
      // A creator's pick settles the task: send the result emails after the response.
      if (what.kind === "settle") after(() => notifyTaskSafe(body.task!));
    }
    return ok({ sig });
  } catch (err) {
    return fail(err);
  }
}
