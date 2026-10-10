// Action chaining: after the wallet confirms, record the transaction and show
// a completed card.
import { z } from "zod";
import { fetchTask } from "@/lib/wukong";
import { PublicKey } from "@solana/web3.js";
import { actionError, actionJson, originOf, preflight } from "@/lib/server/blinks";
import { program } from "@/lib/server/env";
import { store } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task: key } = await ctx.params;
  const parsed = z.object({ account: z.string(), signature: z.string().min(32).max(100) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return actionError("Expected account and signature");
  const task = await fetchTask(program(), new PublicKey(key)).catch(() => null);
  if (!task) return actionError("Task not found", 404);
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
