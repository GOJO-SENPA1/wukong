// GET: the Blink card for a task. POST {account}: a transaction that enters it.
import { PublicKey, Transaction } from "@solana/web3.js";
import { fmtUsdc, timeLeft } from "@/lib/format";
import { categoryById } from "@/lib/categories";
import { sha256Hex } from "@/lib/hash";
import { buildSubmitForTask, explainError, fetchTask, pda } from "@/lib/wukong";
import { actionError, actionJson, originOf, preflight } from "@/lib/server/blinks";
import { connection, program } from "@/lib/server/env";
import { store } from "@/lib/server/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ task: string }> };

async function loadTask(key: string) {
  try {
    return await fetchTask(program(), new PublicKey(key));
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: Ctx) {
  const { task: key } = await ctx.params;
  const task = await loadTask(key);
  if (!task) return actionError("Task not found", 404);
  const origin = originOf(req);
  const brief = store.brief(task.briefHash)?.brief ?? "";
  const reward = `${fmtUsdc(task.reward)} USDC`;
  const payout = task.payoutMode === "topThree" ? "top 3 paid 50/30/20" : "winner takes all";
  const stake = task.entryStake > 0 ? ` Entry stake ${fmtUsdc(task.entryStake)} USDC, refunded unless spam.` : "";
  const open = task.status === "open" && Date.now() / 1000 <= task.deadline;
  const label = task.entryStake > 0 ? `Stake ${fmtUsdc(task.entryStake)} USDC & submit` : "Submit entry";

  return actionJson({
    type: "action",
    icon: `${origin}/api/actions/tasks/${key}/image`,
    title: `${task.title} · ${reward}`,
    description: `${categoryById(task.category).label} on Wukong: ${reward} already locked in escrow, ${payout}, AI-judged on-chain. ${task.submissionCount} entries, ${timeLeft(task.deadline)}.${stake}\n\n${brief.slice(0, 600)}`,
    label,
    disabled: !open,
    ...(open ? {} : { error: { message: `This task is ${task.status === "open" ? "past its deadline" : task.status}.` } }),
    links: {
      actions: [
        {
          type: "transaction",
          label,
          href: `${origin}/api/actions/tasks/${key}?content={content}`,
          parameters: [{ type: "textarea", name: "content", label: "Your entry (sealed until judging)", required: true }],
        },
      ],
    },
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { task: key } = await ctx.params;
  try {
    const task = await loadTask(key);
    if (!task) return actionError("Task not found", 404);
    if (task.status !== "open" || Date.now() / 1000 > task.deadline) return actionError("Task is not open for entries");

    const body = (await req.json().catch(() => ({}))) as { account?: string; data?: { content?: string } };
    const content = (new URL(req.url).searchParams.get("content") ?? body.data?.content ?? "").trim();
    if (!content) return actionError("Write your entry first");
    if (content.length > 8000) return actionError("Entry is too long (8000 characters max)");
    let worker: PublicKey;
    try {
      worker = new PublicKey(body.account ?? "");
    } catch {
      return actionError("Invalid account");
    }
    if (await connection().getAccountInfo(pda.submission(new PublicKey(key), worker))) {
      return actionError("This wallet already entered this task");
    }

    // Store the work off-chain first; the transaction commits its hash.
    const hash = sha256Hex(content);
    store.putSubmission({ hash, content, worker: worker.toBase58(), task: key, createdAt: Date.now() });

    const ix = await buildSubmitForTask(program(), worker, task, hash);
    const { blockhash, lastValidBlockHeight } = await connection().getLatestBlockhash("confirmed");
    const tx = new Transaction({ feePayer: worker, blockhash, lastValidBlockHeight }).add(ix);
    const origin = originOf(req);
    return actionJson({
      type: "transaction",
      transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
      message: `Entry committed as sha256 ${hash.slice(0, 12)}… and sealed until judging.`,
      links: { next: { type: "post", href: `${origin}/api/actions/tasks/${key}/next` } },
    });
  } catch (err) {
    return actionError(explainError(err), 500);
  }
}

export const OPTIONS = preflight;
