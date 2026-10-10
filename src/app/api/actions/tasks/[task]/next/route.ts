// Action chaining: after the wallet confirms, verify the entry transaction
// on-chain, record it, and show a completed card.
import { z } from "zod";
import { fetchTask, pda } from "@/lib/wukong";
import { actionError, actionJson, originOf, parseKey, preflight } from "@/lib/server/blinks";
import { connection, program } from "@/lib/server/env";
import { store } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** The signature must be a successful transaction that created this wallet's entry. */
async function verifyEntry(signature: string, task: string, account: string): Promise<boolean> {
  const taskKey = parseKey(task);
  const worker = parseKey(account);
  if (!taskKey || !worker) return false;
  const submission = pda.submission(taskKey, worker).toBase58();
  for (let attempt = 0; attempt < 5; attempt++) {
    const tx = await connection()
      .getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 })
      .catch(() => null);
    if (tx) {
      const keys = tx.transaction.message.getAccountKeys().staticAccountKeys.map((k) => k.toBase58());
      return !tx.meta?.err && keys.includes(submission) && keys.includes(worker.toBase58());
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

export async function POST(req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task: key } = await ctx.params;
  const parsed = z
    .object({ account: z.string().min(32).max(44), signature: z.string().min(64).max(100) })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return actionError("Expected account and signature");
  const taskKey = parseKey(key);
  const task = taskKey ? await fetchTask(program(), taskKey).catch(() => null) : null;
  if (!task) return actionError("Task not found", 404);
  if (!(await verifyEntry(parsed.data.signature, key, parsed.data.account))) {
    return actionError("Could not find a confirmed entry transaction for this wallet");
  }
  store.addTx(key, { sig: parsed.data.signature, kind: "submit", label: "Entry via Blink", at: Date.now() });
  return actionJson({
    type: "completed",
    icon: `${originOf(req)}/api/actions/tasks/${key}/image`,
    title: "You're in the arena",
    description: `Your entry to "${task.title}" is committed on-chain and sealed. When submissions close, the AI judge scores every entry in public and escrow pays the best.`,
    label: "Entered",
  });
}

export const OPTIONS = preflight;
