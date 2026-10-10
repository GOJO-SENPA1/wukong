// Judge orchestrator: verify → integrity checks → score (in parallel) →
// publish each score on-chain → crank settlement. Streams every step.

import { PublicKey } from "@solana/web3.js";
import { categoryById } from "../../categories";
import { canonicalJson, sha256Hex } from "../../hash";
import {
  buildCloseSubmissions,
  buildScore,
  buildSettle,
  explainError,
  fetchConfig,
  fetchSubmissions,
  fetchTask,
  keypairSigner,
  sendIxs,
  type SubmissionView,
  type TaskView,
} from "../../wukong";
import { connection, loadKey, program } from "../env";
import { store } from "../store";
import { claudeAvailable, JUDGE_MODEL, scoreWithClaude } from "./claude";
import { integritySignals, type PriorEntry, type Signal } from "./detect";
import { scoreHeuristic } from "./heuristic";
import { finalizeScore } from "./score";
import type { JudgeEvent, JudgeReport, ScoringOutput } from "./types";

const CONCURRENCY = Number(process.env.WUKONG_JUDGE_CONCURRENCY ?? 8);
const running = new Set<string>();

export function judgeEngine(): { engine: "claude" | "heuristic"; model: string } {
  return claudeAvailable()
    ? { engine: "claude", model: JUDGE_MODEL }
    : { engine: "heuristic", model: "wukong-heuristic-v1" };
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
  peers: string[];
}

async function run(taskKey: string, emit: (e: JudgeEvent) => void) {
  if (running.has(taskKey)) throw new Error("The judge is already working on this task");
  running.add(taskKey);
  try {
    const conn = connection();
    const prog = program();
    const judgeKey = loadKey("judge");
    const signer = keypairSigner(judgeKey);
    const taskPk = new PublicKey(taskKey);

    let task = await fetchTask(prog, taskPk);
    if (!task) throw new Error("Task not found on-chain");
    if (task.status === "settled" || task.status === "cancelled") {
      throw new Error(`Task is already ${task.status}`);
    }
    if (task.submissionCount === 0) throw new Error("No submissions to judge yet");

    const { engine, model } = judgeEngine();
    emit({ type: "start", task: taskKey, count: task.submissionCount, engine, model });

    if (task.status === "open") {
      const sig = await sendIxs(conn, signer, [
        await buildCloseSubmissions(prog, judgeKey.publicKey, taskPk),
      ]);
      store.addTx(taskKey, { sig, kind: "close", label: "Submissions closed", at: Date.now() });
      emit({ type: "tx", kind: "close", sig, label: "Submissions closed on-chain" });
    }

    const brief = store.brief(task.briefHash);
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
    for (const sub of subs) {
      const rec = store.submission(sub.contentHash);
      const ok = !!rec && sha256Hex(rec.content) === sub.contentHash;
      emit({
        type: "verify",
        submission: sub.pubkey,
        index: sub.index,
        ok,
        detail: ok ? `sha256 ${sub.contentHash.slice(0, 10)}… matches chain` : "content missing or hash mismatch",
      });
      const signals: Signal[] = ok
        ? integritySignals(rec!.content, earlier, { headline: task.category === 0 })
        : [{ flag: "content_missing", detail: "no content matching the on-chain hash" }];
      for (const s of signals) {
        emit({ type: "signal", submission: sub.pubkey, index: sub.index, flag: s.flag, detail: s.detail });
      }
      if (ok) earlier.push({ index: sub.index, submittedAt: sub.submittedAt, content: rec!.content });
      prepared.push({ sub, content: ok ? rec!.content : "", signals, peers: [] });
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
      const report = await scoreOne(task!, briefText, p, engine);
      const reportHash = sha256Hex(canonicalJson(report));
      store.putReport({ submission: p.sub.pubkey, hash: reportHash, report });
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
        store.putReport({ submission: p.sub.pubkey, hash: reportHash, report, txSig: sig });
        store.addTx(taskKey, {
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
    if (task.judgeMode === "creatorPicks") {
      emit({ type: "awaiting_pick", podium: task.podium });
    } else {
      const config = (await fetchConfig(prog))!;
      const sig = await sendIxs(conn, signer, await buildSettle(prog, judgeKey.publicKey, task, config));
      store.addTx(taskKey, { sig, kind: "settle", label: "Escrow released", at: Date.now() });
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
    }
    emit({ type: "done" });
  } finally {
    running.delete(taskKey);
  }
}

async function scoreOne(
  task: TaskView,
  brief: string,
  p: Prepared,
  engine: "claude" | "heuristic",
): Promise<JudgeReport> {
  const cat = categoryById(task.category);
  const input = {
    brief,
    title: task.title,
    category: task.category,
    content: p.content,
    index: p.sub.index,
    signals: p.signals.map((s) => `${s.flag}: ${s.detail}`),
    peers: p.peers,
  };
  const signals = [...input.signals];

  let out: ScoringOutput;
  let used = engine;
  if (!p.content) {
    out = {
      criteria: cat.criteria.map((c) => ({ key: c.key, score: 0, comment: "Content unavailable." })),
      flags: [],
      summary: "Could not verify this submission's content against the chain.",
      strengths: [],
      improvements: ["Resubmit through Wukong so the content matches the on-chain hash."],
      model: "none",
    };
  } else if (engine === "claude") {
    try {
      out = await scoreWithClaude(input);
    } catch (err) {
      used = "heuristic";
      signals.push(`claude_unavailable: ${explainError(err).slice(0, 160)}`);
      out = scoreHeuristic(input);
    }
  } else {
    out = scoreHeuristic(input);
  }

  const { flags, criteria, raw, final } = finalizeScore(task.category, out, p.signals.map((s) => s.flag));
  const summary = used === "heuristic" ? penaltySummary(flags) ?? out.summary : out.summary;

  return {
    version: 1,
    task: task.pubkey,
    submission: p.sub.pubkey,
    worker: p.sub.worker,
    contentHash: p.sub.contentHash,
    briefHash: task.briefHash,
    engine: used,
    model: out.model,
    rubric: `${cat.slug}@v1`,
    criteria,
    flags,
    signals,
    summary,
    strengths: out.strengths,
    improvements: out.improvements,
    rawScore: Math.round(raw * 100) / 100,
    finalScore: final,
    onchainScore: Math.round(final * 100),
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
