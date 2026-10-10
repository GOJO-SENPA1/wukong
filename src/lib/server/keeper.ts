// Keeper: the liveness rules. Nobody has to click "judge" in production.
// Run by scripts/keeper.ts (a loop, on a container host), by /api/cron/keeper
// (a scheduler, on serverless hosts), and opportunistically when a task that
// is due gets viewed. The judge's lock keeps those from colliding. For a task:
//   - open, past deadline, with entries      → closes + judges + settles
//   - judging with unscored entries          → resumes judging
//   - judging, all scored, AI-final          → settles
//   - creator-picks past the pick grace      → settles on the AI's top pick
//   - settled with stakes outstanding        → refunds / slashes the stakes
import { buildSettle, fetchConfig, fetchTasks, keypairSigner, sendIxs, type TaskView } from "../wukong";
import { connection, loadKey, program } from "./env";
import { judgeTask } from "./judge";
import { store } from "./store";

export type KeeperAction = "judge" | "pick-timeout";

export function due(t: TaskView, now = Math.floor(Date.now() / 1000)): KeeperAction | null {
  if (t.status === "settled") return t.stakesOutstanding > 0 ? "judge" : null; // stakes to settle
  if (t.status === "open") return now > t.deadline && t.submissionCount > 0 ? "judge" : null;
  if (t.status !== "judging") return null;
  if (t.scoredCount < t.submissionCount) return "judge";
  if (t.judgeMode === "aiFinal") return "judge";
  if (t.closedAt > 0 && now > t.closedAt + t.pickGraceSecs) return "pick-timeout";
  return null;
}

export async function keepTask(t: TaskView, log: (msg: string) => void = () => {}) {
  const action = due(t);
  if (!action) return;
  log(`${action}: ${t.title} (${t.pubkey.slice(0, 8)}…)`);
  if (action === "judge") {
    for await (const e of judgeTask(t.pubkey)) {
      if (e.type === "scored") log(`  #${e.index + 1} → ${(e.score / 100).toFixed(1)}`);
      if (e.type === "settled") log(`  settled, ${e.payouts.length} paid`);
      if (e.type === "error") log(`  ! ${e.message}`);
    }
    return;
  }
  // The creator never picked: the AI's top entry wins (permissionless).
  const prog = program();
  const judge = loadKey("judge");
  const config = (await fetchConfig(prog))!;
  const sig = await sendIxs(connection(), keypairSigner(judge), await buildSettle(prog, judge.publicKey, t, config));
  await store.addTx(t.pubkey, { sig, kind: "settle", label: "Creator never picked: AI top pick paid", at: Date.now() });
  log(`  settled on the AI's top pick ${sig.slice(0, 12)}…`);
  if (t.entryStake > 0) for await (const e of judgeTask(t.pubkey)) if (e.type === "error") log(`  ! ${e.message}`);
}

/** One pass over every task. */
export async function keeperPass(log: (msg: string) => void = () => {}) {
  const tasks = await fetchTasks(program());
  for (const t of tasks) {
    try {
      await keepTask(t, log);
    } catch (err) {
      log(`  ! ${(err as Error).message}`);
    }
  }
}

const nudged = new Map<string, number>();

/**
 * Called after serving a task view: if the task is due, do its keeper work
 * once the response has gone out (at most every 30s per task per instance).
 * Lets a serverless deploy stay live between scheduled keeper runs.
 */
export function nudge(t: TaskView, schedule: (work: () => Promise<void>) => void) {
  if (!due(t) || Date.now() - (nudged.get(t.pubkey) ?? 0) < 30_000) return;
  nudged.set(t.pubkey, Date.now());
  schedule(() => keepTask(t).catch(() => {}));
}
