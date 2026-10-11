// Judge orchestrator: verify → integrity checks → score (in parallel) →
// publish each score on-chain → crank settlement. Streams every step.

import { PublicKey } from "@solana/web3.js";
import { categoryById, RUBRIC_VERSION } from "../../categories";
import { canonicalJson, sha256Hex } from "../../hash";
import {
  buildClaimStakes,
  buildCloseSubmissions,
  buildScore,
  buildSettle,
  explainError,
  fetchConfig,
  fetchSubmissions,
  fetchTask,
  keypairSigner,
  sendIxs,
  stakeRefunded,
  type SubmissionView,
  type TaskView,
} from "../../wukong";
import { connection, demoContent, isDemoCreator, loadKey, program } from "../env";
import { kv } from "../kv";
import { store } from "../store";
import { claudeAvailable, JUDGE_MODEL, scoreWithClaude } from "./claude";
import { compatibleConfig, scoreWithCompatible } from "./compatible";
import { JudgeRefusal } from "./prompt";
import { factLines, type Fact } from "./constraints";
import { type PriorEntry, type Signal } from "./detect";
import { precheck } from "./precheck";
import { scoreHeuristic } from "./heuristic";
import { finalizeScore } from "./score";
import type { JudgeEngine, JudgeEvent, JudgeReport, ScoringInput, ScoringOutput } from "./types";
import { notifyTaskSafe } from "../notify";

const CONCURRENCY = Number(process.env.WUKONG_JUDGE_CONCURRENCY ?? 8);
const running = new Set<string>();

/**
 * The judge this deployment uses: an OpenAI-compatible API when one is configured
 * (WUKONG_JUDGE_BASE_URL + _API_KEY + _MODEL), else Claude when there's an Anthropic
 * key, else the offline heuristics. WUKONG_JUDGE_ENGINE=heuristic forces offline.
 */
export function judgeEngine(): { engine: JudgeEngine; model: string } {
  const offline = { engine: "heuristic" as const, model: "wukong-heuristic-v1" };
  if (process.env.WUKONG_JUDGE_ENGINE === "heuristic") return offline;
  const compatible = compatibleConfig();
  if (compatible) return { engine: "openai-compatible", model: compatible.model };
  if (claudeAvailable()) return { engine: "claude", model: JUDGE_MODEL };
  return offline;
}

/** Async-iterable event stream backed by a push queue. */
class EventStream<T> implements AsyncIterable<T> {
  private items: T[] = [];
  private waiters: ((r: IteratorResult<T>) => void)[] = [];
  private closed = false;
  push(item: T) {
    const w = this.waiters.shift();
    if (w) w({ value: item, done: false });
    else this.items.push(item);
  }
  close() {
    this.closed = true;
    for (const w of this.waiters.splice(0)) w({ value: undefined as never, done: true });
  }
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        const item = this.items.shift();
        if (item !== undefined) return Promise.resolve({ value: item, done: false });
        if (this.closed) return Promise.resolve({ value: undefined as never, done: true });
        return new Promise((resolve) => this.waiters.push(resolve));
      },
    };
  }
}

export function judgeTask(taskKey: string): AsyncIterable<JudgeEvent> {
  const stream = new EventStream<JudgeEvent>();
  run(taskKey, (e) => stream.push(e))
    .catch((err) => stream.push({ type: "error", message: explainError(err) }))
    // Result emails go out before the stream ends, so serverless hosts keep the function alive for them.
    .then(() => notifyTaskSafe(taskKey))
    .finally(() => stream.close());
  return stream;
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
  });
  await Promise.all(workers);
}

interface Prepared {
  sub: SubmissionView;
  content: string;
  signals: Signal[];
  facts: Fact[];
  peers: string[];
}

// Long enough for a 256-entry run on a container host; a crashed holder frees it after this.
const LOCK_TTL_MS = 45 * 60 * 1000;

async function run(taskKey: string, emit: (e: JudgeEvent) => void) {
  if (running.has(taskKey)) throw new Error("The judge is already working on this task");
  // Cross-process: the keeper, cron and web requests can all reach the judge.
  const release = await kv().lock(`judge:${taskKey}`, LOCK_TTL_MS);
  if (!release) throw new Error("The judge is already working on this task (another process)");
  running.add(taskKey);
  try {
    const conn = connection();
    const prog = program();
    const judgeKey = loadKey("judge");
    const signer = keypairSigner(judgeKey);
    const taskPk = new PublicKey(taskKey);

    let task = await fetchTask(prog, taskPk);
    if (!task) throw new Error("Task not found on-chain");
    if (task.status === "settled" && task.stakesOutstanding > 0) {
      // Settled (e.g. by the creator's pick): only the entry stakes are left.
      await settleStakes(task, emit);
      emit({ type: "done" });
      return;
    }
    if (task.status === "settled" || task.status === "cancelled") {
      throw new Error(`Task is already ${task.status}`);
    }
    if (task.submissionCount === 0) throw new Error("No submissions to judge yet");

    const { engine, model } = judgeEngine();
    emit({ type: "start", task: taskKey, count: task.submissionCount, engine, model });

    // Before the deadline only the creator closes submissions (on-chain, with their own signature).
    // The one exception: on a demo deployment, the seeded demo companies' tasks, so visitors can watch the judge.
    if (task.status === "open" && Date.now() / 1000 <= task.deadline && !(demoContent() && isDemoCreator(task.creator))) {
      throw new Error("Submissions are still open: the creator closes them on-chain, or the deadline does");
    }
    if (task.status === "open") {
      const sig = await sendIxs(conn, signer, [
        await buildCloseSubmissions(prog, judgeKey.publicKey, taskPk),
      ]);
      await store.addTx(taskKey, { sig, kind: "close", label: "Submissions closed", at: Date.now() });
      emit({ type: "tx", kind: "close", sig, label: "Submissions closed on-chain" });
    }

    const brief = await store.brief(task.briefHash);
    const briefText = brief?.brief ?? "";
    if (!brief || sha256Hex(briefText) !== task.briefHash) {
      emit({ type: "log", message: "Warning: brief text missing or does not match its on-chain hash" });
    } else {
      emit({ type: "log", message: `Brief verified against on-chain hash ${task.briefHash.slice(0, 10)}…` });
    }

    // 1. Verify every submission against its on-chain commitment, then run
    //    deterministic integrity checks in submission order (earliest wins).
    const subs = await fetchSubmissions(prog, taskPk);
    const earlier: PriorEntry[] = [];
    const prepared: Prepared[] = [];
    const recs = await store.submissions(subs.map((s) => s.contentHash));
    for (const [i, sub] of subs.entries()) {
      const rec = recs[i];
      const ok = !!rec && sha256Hex(rec.content) === sub.contentHash;
      emit({
        type: "verify",
        submission: sub.pubkey,
        index: sub.index,
        ok,
        detail: ok ? `sha256 ${sub.contentHash.slice(0, 10)}… matches chain` : "content missing or hash mismatch",
      });
      const checked = ok ? precheck(rec!.content, earlier, { brief: briefText, category: task.category }) : null;
      const signals: Signal[] = checked?.signals ?? [{ flag: "content_missing", detail: "no content matching the on-chain hash" }];
      for (const s of signals) {
        emit({ type: "signal", submission: sub.pubkey, index: sub.index, flag: s.flag, detail: s.detail });
      }
      if (ok) earlier.push({ index: sub.index, submittedAt: sub.submittedAt, content: rec!.content });
      prepared.push({ sub, content: ok ? rec!.content : "", signals, facts: checked?.facts ?? [], peers: [] });
    }
    // Peers let the offline judge measure consensus on labeling tasks.
    for (const p of prepared) {
      p.peers = prepared.filter((q) => q !== p && q.content).map((q) => q.content);
    }

    // 2. Score in parallel; publish each score on-chain in arrival order.
    let txChain: Promise<void> = Promise.resolve();
    const todo = prepared.filter((p) => !p.sub.scored);
    await pool(todo, CONCURRENCY, async (p) => {
      emit({ type: "scoring", submission: p.sub.pubkey, index: p.sub.index });
      // A report computed on an earlier pass (but not yet published) is reused, not recomputed.
      const prior = await store.report(p.sub.pubkey);
      const report =
        prior && !prior.txSig && prior.report.contentHash === p.sub.contentHash && prior.report.briefHash === task!.briefHash
          ? prior.report
          : await scoreOne(task!, briefText, p, engine);
      const reportHash = sha256Hex(canonicalJson(report));
      // Never replace a report whose hash is already on-chain.
      if ((await store.report(p.sub.pubkey))?.txSig) return;
      await store.putReport({ submission: p.sub.pubkey, hash: reportHash, report });
      emit({
        type: "scored",
        submission: p.sub.pubkey,
        index: p.sub.index,
        worker: p.sub.worker,
        score: report.onchainScore,
        reportHash,
        report,
      });
      txChain = txChain.then(async () => {
        const ix = await buildScore(prog, judgeKey.publicKey, taskPk, p.sub, report.onchainScore, reportHash);
        const sig = await sendIxs(conn, signer, [ix]);
        await store.putReport({ submission: p.sub.pubkey, hash: reportHash, report, txSig: sig });
        await store.addTx(taskKey, {
          sig,
          kind: "score",
          label: `Score #${p.sub.index + 1}: ${(report.onchainScore / 100).toFixed(1)}`,
          at: Date.now(),
        });
        emit({
          type: "tx",
          kind: "score",
          sig,
          label: `Score for #${p.sub.index + 1} published`,
          submission: p.sub.pubkey,
        });
      });
      await txChain;
    });
    await txChain;

    task = (await fetchTask(prog, taskPk))!;
    emit({ type: "podium", podium: task.podium });

    // 3. Settlement. AI-final tasks settle immediately (anyone could crank it;
    //    the judge does it as a courtesy). Creator-picks tasks wait.
    if (task.judgeMode === "creatorPicks" && task.podium.length > 0) {
      emit({ type: "awaiting_pick", podium: task.podium });
    } else {
      const config = (await fetchConfig(prog))!;
      const sig = await sendIxs(conn, signer, await buildSettle(prog, judgeKey.publicKey, task, config));
      await store.addTx(taskKey, { sig, kind: "settle", label: "Escrow released", at: Date.now() });
      const settled = (await fetchTask(prog, taskPk))!;
      const paid = (await fetchSubmissions(prog, taskPk)).filter((s) => s.rank > 0);
      emit({
        type: "settled",
        sig,
        payouts: paid
          .sort((a, b) => a.rank - b.rank)
          .map((s) => ({ worker: s.worker, amount: s.payout, place: s.rank })),
        fee: settled.feePaid,
        refunded: settled.podium.length === 0 ? settled.reward : 0,
      });
      if (settled.stakesOutstanding > 0) await settleStakes(settled, emit);
    }
    emit({ type: "done" });
  } finally {
    running.delete(taskKey);
    await release();
  }
}

/**
 * Refund honest entrants' stakes and slash spammers'. One claim per
 * transaction so a single bad entry can't block anyone else's refund; a
 * failed claim is logged and retried on the keeper's next pass.
 */
async function settleStakes(task: TaskView, emit: (e: JudgeEvent) => void) {
  const prog = program();
  const judgeKey = loadKey("judge");
  const subs = await fetchSubmissions(prog, new PublicKey(task.pubkey));
  const config = (await fetchConfig(prog))!;
  const pending = subs.filter((s) => s.stake > 0 && !s.stakeSettled);
  for (const s of pending) {
    try {
      const [ixs] = await buildClaimStakes(prog, judgeKey.publicKey, task, config, [s]);
      const sig = await sendIxs(connection(), keypairSigner(judgeKey), ixs);
      const ok = stakeRefunded(s);
      await store.addTx(task.pubkey, { sig, kind: "settle", label: `Stake #${s.index + 1} ${ok ? "refunded" : "slashed"}`, at: Date.now() });
      emit({ type: "stake", submission: s.pubkey, index: s.index, worker: s.worker, amount: s.stake, refunded: ok, sig });
    } catch (err) {
      emit({ type: "log", message: `Stake for #${s.index + 1} not settled yet: ${explainError(err)}` });
    }
  }
}

/** The judged part of a report: everything except the on-chain identifiers. */
export type EntryVerdict = Pick<
  JudgeReport,
  "engine" | "model" | "rubric" | "criteria" | "flags" | "signals" | "summary" | "strengths" | "improvements" | "consensus" | "rawScore" | "finalScore"
>;

/**
 * Judge one entry: the engine's verdict (sampled and quote-checked for AI engines),
 * then the deterministic penalties and caps. Production judging and the benchmark
 * both run exactly this. `scorer` replaces the engine's scorer (the benchmark's raw-model baseline).
 */
export async function scoreEntry(
  task: { title: string; brief: string; category: number },
  entry: { content: string; index: number; signals: Signal[]; facts: Fact[]; peers?: string[] },
  engine: JudgeEngine,
  scorer?: (input: ScoringInput) => Promise<ScoringOutput>,
): Promise<EntryVerdict> {
  const cat = categoryById(task.category);
  const input: ScoringInput = {
    brief: task.brief,
    title: task.title,
    category: task.category,
    content: entry.content,
    index: entry.index,
    signals: entry.signals.map((s) => `${s.flag}: ${s.detail}`),
    facts: factLines(entry.facts),
    peers: entry.peers,
  };
  const signals = [...input.signals];

  let out: ScoringOutput;
  if (!entry.content) {
    out = {
      criteria: cat.criteria.map((c) => ({ key: c.key, score: 0, comment: "Content unavailable." })),
      flags: [],
      summary: "Could not verify this submission's content against the chain.",
      strengths: [],
      improvements: ["Resubmit through Wukong so the content matches the on-chain hash."],
      model: "none",
    };
  } else if (engine !== "heuristic") {
    // Never mix engines within a task: a transient failure leaves the entry
    // unscored (the keeper retries), and a firm refusal scores it as unsafe.
    const score = scorer ?? (engine === "claude" ? scoreWithClaude : scoreWithCompatible);
    try {
      out = await score(input).catch(async (err) => {
        if (err instanceof JudgeRefusal) throw err;
        console.error(`judge (${engine}):`, (err as Error).message);
        await new Promise((r) => setTimeout(r, 2000));
        return score(input);
      });
    } catch (err) {
      if (!(err instanceof JudgeRefusal)) throw new Error(`The AI judge is unavailable right now; entry #${entry.index + 1} will be scored on the next pass`);
      out = {
        criteria: cat.criteria.map((c) => ({ key: c.key, score: 0, comment: "The judge declined to evaluate this content." })),
        flags: ["unsafe"],
        summary: "The judge declined to score this entry; it was flagged for review.",
        strengths: [],
        improvements: ["Keep entries within the brief and the platform's content rules."],
        model: judgeEngine().model,
      };
      signals.push(`judge_refusal: ${(err as JudgeRefusal).category}`);
    }
  } else {
    out = scoreHeuristic(input);
  }

  const { flags, criteria, raw, final } = finalizeScore(task.category, out, entry.signals.map((s) => s.flag));
  return {
    engine,
    model: out.model,
    rubric: `${cat.slug}@${RUBRIC_VERSION}`,
    criteria,
    flags,
    signals,
    summary: engine === "heuristic" ? (penaltySummary(flags) ?? out.summary) : out.summary,
    strengths: out.strengths,
    improvements: out.improvements,
    ...(out.consensus ? { consensus: out.consensus } : {}),
    rawScore: Math.round(raw * 100) / 100,
    finalScore: final,
  };
}

async function scoreOne(task: TaskView, brief: string, p: Prepared, engine: JudgeEngine): Promise<JudgeReport> {
  const verdict = await scoreEntry(
    { title: task.title, brief, category: task.category },
    { content: p.content, index: p.sub.index, signals: p.signals, facts: p.facts, peers: p.peers },
    engine,
  );
  return {
    version: 1,
    task: task.pubkey,
    submission: p.sub.pubkey,
    worker: p.sub.worker,
    contentHash: p.sub.contentHash,
    briefHash: task.briefHash,
    ...verdict,
    onchainScore: Math.round(verdict.finalScore * 100),
    judgedAt: Math.floor(Date.now() / 1000),
  };
}

function penaltySummary(flags: string[]): string | null {
  if (flags.includes("prompt_injection")) return "Disqualified: the entry tries to instruct the judge instead of doing the task.";
  if (flags.includes("duplicate")) return "Disqualified: near-copy of an earlier entry. First to commit keeps the credit.";
  if (flags.includes("content_missing")) return "Content could not be verified against its on-chain hash.";
  if (flags.includes("low_effort")) return "Too thin to evaluate: reads as spam or a placeholder.";
  if (flags.includes("wrong_language")) return "Misses the language requirement, so it can't be used as delivered.";
  return null;
}
