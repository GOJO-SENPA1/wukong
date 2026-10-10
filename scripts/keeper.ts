// Keeper: the liveness loop. Nobody has to click "judge" in production.
//   npm run keeper                 (every 30s)
//   npm run keeper -- --once       (single pass, e.g. from cron)
// For each task it:
//   - open, past deadline, with entries      → closes + judges + settles
//   - judging with unscored entries          → resumes judging
//   - judging, all scored, AI-final          → settles
//   - creator-picks past the pick grace      → settles on the AI's top pick
//   - settled with stakes outstanding        → refunds / slashes the stakes
import { buildSettle, fetchConfig, fetchTasks, keypairSigner, sendIxs, type TaskView } from "../src/lib/wukong";
import { connection, loadKey, program } from "../src/lib/server/env";
import { judgeTask } from "../src/lib/server/judge";
import { store } from "../src/lib/server/store";

const once = process.argv.includes("--once");
const INTERVAL = Number(process.env.KEEPER_INTERVAL_MS ?? 30_000);
const log = (msg: string) => console.log(`${new Date().toISOString().slice(11, 19)} ${msg}`);

function due(t: TaskView, now: number): "judge" | "pick-timeout" | null {
  if (t.status === "settled") return t.stakesOutstanding > 0 ? "judge" : null; // stakes to settle
  if (t.status === "open") return now > t.deadline && t.submissionCount > 0 ? "judge" : null;
  if (t.status !== "judging") return null;
  if (t.scoredCount < t.submissionCount) return "judge";
  if (t.judgeMode === "aiFinal") return "judge";
  if (t.closedAt > 0 && now > t.closedAt + t.pickGraceSecs) return "pick-timeout";
  return null;
}

async function pass() {
  const prog = program();
  const now = Math.floor(Date.now() / 1000);
  const tasks = await fetchTasks(prog);
  for (const t of tasks) {
    const action = due(t, now);
    if (!action) continue;
    log(`${action}: ${t.title} (${t.pubkey.slice(0, 8)}…)`);
    try {
      if (action === "judge") {
        for await (const e of judgeTask(t.pubkey)) {
          if (e.type === "scored") log(`  #${e.index + 1} → ${(e.score / 100).toFixed(1)}`);
          if (e.type === "settled") log(`  settled, ${e.payouts.length} paid`);
          if (e.type === "error") log(`  ! ${e.message}`);
        }
      } else {
        // The creator never picked: the AI's top entry wins (permissionless).
        const judge = loadKey("judge");
        const config = (await fetchConfig(prog))!;
        const sig = await sendIxs(connection(), keypairSigner(judge), await buildSettle(prog, judge.publicKey, t, config));
        store.addTx(t.pubkey, { sig, kind: "settle", label: "Creator never picked: AI top pick paid", at: Date.now() });
        log(`  settled on the AI's top pick ${sig.slice(0, 12)}…`);
        if (t.entryStake > 0) for await (const e of judgeTask(t.pubkey)) if (e.type === "error") log(`  ! ${e.message}`);
      }
    } catch (err) {
      log(`  ! ${(err as Error).message}`);
    }
  }
}

async function main() {
  log(`keeper up${once ? " (single pass)" : `, every ${INTERVAL / 1000}s`}`);
  do {
    await pass().catch((err) => log(`pass failed: ${(err as Error).message}`));
    if (!once) await new Promise((r) => setTimeout(r, INTERVAL));
  } while (!once);
  process.exit(0);
}

main();
