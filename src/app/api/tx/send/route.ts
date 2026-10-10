import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { fetchTask } from "@/lib/wukong";
import { program } from "@/lib/server/env";
import { relay } from "@/lib/server/actions";
import { fail, ok } from "@/lib/server/http";
import { store, type TxRecord } from "@/lib/server/store";

const Body = z.object({
  tx: z.string().max(4000),
  task: z.string().optional(),
  kind: z.enum(["create", "submit", "close", "settle", "cancel"]).optional(),
  label: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const sig = await relay(body.tx);
    if (body.task && body.kind) {
      store.addTx(body.task, { sig, kind: body.kind as TxRecord["kind"], label: body.label ?? body.kind, at: Date.now() });
    }
    if (body.task && body.kind === "create") {
      // Snapshot who posted this task, so tasks that share a brief don't share an author.
      const task = await fetchTask(program(), new PublicKey(body.task));
      const brief = task && store.brief(task.briefHash);
      if (brief) store.setTaskMeta(body.task, { origin: "web", creatorName: brief.creatorName, template: brief.template });
    }
    return ok({ sig });
  } catch (err) {
    return fail(err);
  }
}
