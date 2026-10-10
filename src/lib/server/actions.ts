// Server-built transactions (the Solana Actions pattern): the server turns an
// intent into an unsigned transaction, any wallet signs it, the server relays
// it. Keeps every Anchor detail out of the browser bundle.

import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import { z } from "zod";
import {
  buildCancel,
  buildCloseSubmissions,
  buildCreateTask,
  buildSettle,
  buildSubmitForTask,
  fetchConfig,
  fetchTask,
  newNonce,
} from "../wukong";
import { connection, mint, program } from "./env";

const pubkey = z.string().refine((s) => {
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}, "invalid public key");
const hex32 = z.string().regex(/^[0-9a-f]{64}$/);

export const ActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_task"),
    signer: pubkey,
    title: z.string().min(1).max(64),
    category: z.number().int().min(0).max(255),
    briefHash: hex32,
    rewardUsdc: z.number().positive().max(1_000_000),
    hours: z.number().positive().max(24 * 90),
    payoutMode: z.enum(["winnerTakesAll", "topThree"]),
    judgeMode: z.enum(["aiFinal", "creatorPicks"]),
    minRating: z.number().int().min(0).max(1_000_000),
    maxSubmissions: z.number().int().min(1).max(256),
    entryStakeUsdc: z.number().min(0).max(1_000_000).default(0),
  }),
  z.object({ kind: z.literal("submit"), signer: pubkey, task: pubkey, contentHash: hex32 }),
  z.object({ kind: z.literal("close"), signer: pubkey, task: pubkey }),
  z.object({ kind: z.literal("settle_pick"), signer: pubkey, task: pubkey, pick: z.number().int().min(0).max(2) }),
  z.object({ kind: z.literal("cancel"), signer: pubkey, task: pubkey }),
]);
export type Action = z.infer<typeof ActionSchema>;

export async function buildAction(
  action: Action,
): Promise<{ tx: string; task?: string; label: string }> {
  const prog = program();
  const signer = new PublicKey(action.signer);
  let ixs: TransactionInstruction[];
  let task: string | undefined;
  let label: string;

  switch (action.kind) {
    case "create_task": {
      const built = await buildCreateTask(
        prog,
        signer,
        mint(),
        {
          title: action.title,
          category: action.category,
          briefHashHex: action.briefHash,
          reward: Math.round(action.rewardUsdc * 1_000_000),
          deadline: Math.floor(Date.now() / 1000 + action.hours * 3600),
          payoutMode: action.payoutMode,
          judgeMode: action.judgeMode,
          minRating: action.minRating,
          maxSubmissions: action.maxSubmissions,
          entryStake: Math.round(action.entryStakeUsdc * 1_000_000),
        },
        newNonce() as BN,
      );
      ixs = built.ixs;
      task = built.task.toBase58();
      label = `Task posted, ${action.rewardUsdc} USDC locked in escrow`;
      break;
    }
    case "submit": {
      const view = await fetchTask(prog, new PublicKey(action.task));
      if (!view) throw new Error("Task not found");
      ixs = [await buildSubmitForTask(prog, signer, view, action.contentHash)];
      task = action.task;
      label = view.entryStake > 0 ? `Work submitted, ${view.entryStake / 1e6} USDC staked` : "Work submitted";
      break;
    }
    case "close":
      ixs = [await buildCloseSubmissions(prog, signer, new PublicKey(action.task))];
      task = action.task;
      label = "Submissions closed";
      break;
    case "settle_pick": {
      const view = await fetchTask(prog, new PublicKey(action.task));
      const config = await fetchConfig(prog);
      if (!view || !config) throw new Error("Task or config not found");
      ixs = await buildSettle(prog, signer, view, config, action.pick);
      task = action.task;
      label = `Creator picked #${action.pick + 1} from the AI shortlist`;
      break;
    }
    case "cancel": {
      const view = await fetchTask(prog, new PublicKey(action.task));
      if (!view) throw new Error("Task not found");
      ixs = [await buildCancel(prog, signer, view)];
      task = action.task;
      label = "Task cancelled, escrow refunded";
      break;
    }
  }

  const { blockhash, lastValidBlockHeight } = await connection().getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: signer, blockhash, lastValidBlockHeight }).add(...ixs);
  return {
    tx: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
    task,
    label,
  };
}

export async function relay(txBase64: string): Promise<string> {
  const conn = connection();
  const tx = Transaction.from(Buffer.from(txBase64, "base64"));
  if (!tx.verifySignatures()) throw new Error("Transaction is not fully signed");
  const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  const bh = await conn.getLatestBlockhash("confirmed");
  const res = await conn.confirmTransaction(
    { signature: sig, blockhash: tx.recentBlockhash!, lastValidBlockHeight: bh.lastValidBlockHeight },
    "confirmed",
  );
  if (res.value.err) throw new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`);
  return sig;
}
