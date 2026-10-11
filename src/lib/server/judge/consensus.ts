// How an AI verdict is reached, whatever the model: several independent samples,
// every quoted piece of evidence checked against the entry by code, a verdict
// that quotes text the entry doesn't contain sent back once to be redone, then
// the median score per criterion and the flags most samples agree on. When the
// samples disagree badly, more are drawn before anything is decided.

import { categoryById } from "../../categories";
import { JudgeRefusal, judgeRequest, quoteStatus, repairRequest, toOutput, type Verdict } from "./prompt";
import type { Consensus, JudgeFlag, ScoringInput, ScoringOutput } from "./types";

export type Turn = { role: "user" | "assistant"; content: string };
/** One call to a model: the conversation so far, and which sample this is (engines vary temperature by it). */
export type Ask = (turns: Turn[], sample: number) => Promise<{ verdict: Verdict; model: string }>;

type Status = ReturnType<typeof quoteStatus>;
interface Sample {
  verdict: Verdict;
  model: string;
  status: Status[];
  repaired: boolean;
  hallucinatedBefore: number;
}

export interface ConsensusOptions {
  samples: number;
  /** Draw up to this many when samples disagree by more than DISAGREE points on a criterion */
  maxSamples: number;
  /** Send back a verdict with invented quotes once (on by default) */
  repair?: boolean;
}

const DISAGREE = 25;

/** Samples per entry: WUKONG_JUDGE_SAMPLES, else 3 for OpenAI-compatible models and 1 for Claude. */
export function samplesFor(engine: "claude" | "openai-compatible"): ConsensusOptions {
  const set = Number(process.env.WUKONG_JUDGE_SAMPLES);
  const samples = Number.isInteger(set) && set >= 1 && set <= 7 ? set : engine === "openai-compatible" ? 3 : 1;
  return { samples, maxSamples: samples >= 3 ? samples + 2 : samples };
}

/** The verdict's criteria in rubric order (by key, else by position), so samples line up. */
function aligned(input: ScoringInput, v: Verdict): Verdict["criteria"] {
  const cat = categoryById(input.category);
  const byKey = new Map(v.criteria.map((c) => [c.key, c]));
  return cat.criteria.map((c, i) => {
    const got = byKey.get(c.key) ?? v.criteria[i];
    return { key: c.key, evidence: got?.evidence ?? "", comment: got?.comment ?? "", score: Math.max(0, Math.min(100, Math.round(got?.score ?? 0))) };
  });
}

async function draw(input: ScoringInput, ask: Ask, request: string, sample: number, repair: boolean): Promise<Sample> {
  const first = await ask([{ role: "user", content: request }], sample);
  let verdict = { ...first.verdict, criteria: aligned(input, first.verdict) };
  let model = first.model;
  let status = verdict.criteria.map((c) => quoteStatus(c.evidence, input.content));
  const hallucinatedBefore = status.filter((s) => s === "hallucinated").length;
  let repaired = false;
  if (hallucinatedBefore && repair) {
    const bad = verdict.criteria.filter((_, i) => status[i] === "hallucinated");
    try {
      const again = await ask(
        [
          { role: "user", content: request },
          { role: "assistant", content: JSON.stringify(first.verdict) },
          { role: "user", content: repairRequest(bad) },
        ],
        sample,
      );
      verdict = { ...again.verdict, criteria: aligned(input, again.verdict) };
      model = again.model;
      status = verdict.criteria.map((c) => quoteStatus(c.evidence, input.content));
      repaired = true;
    } catch (err) {
      if (err instanceof JudgeRefusal) throw err; // keep the first verdict; its invented quotes are set aside below
    }
  }
  return { verdict, model, status, repaired, hallucinatedBefore };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** Score one entry with a model: sampled, quote-checked, repaired, and agreed. */
export async function judgeWithModel(input: ScoringInput, ask: Ask, opts: ConsensusOptions): Promise<ScoringOutput> {
  const request = judgeRequest(input);
  const repair = opts.repair !== false;
  const samples: Sample[] = [];
  const failures: unknown[] = [];
  const drawMany = async (from: number, to: number) => {
    const got = await Promise.allSettled(Array.from({ length: to - from }, (_, i) => draw(input, ask, request, from + i, repair)));
    for (const r of got) {
      if (r.status === "fulfilled") samples.push(r.value);
      else failures.push(r.reason);
    }
  };
  await drawMany(0, opts.samples);

  const refusals = failures.filter((f) => f instanceof JudgeRefusal).length;
  if (refusals * 2 > opts.samples) throw failures.find((f) => f instanceof JudgeRefusal);
  if (!samples.length) throw failures[0] ?? new Error("The judge returned nothing");

  const n = categoryById(input.category).criteria.length;
  const usable = (i: number) => {
    const ok = samples.filter((s) => s.status[i] !== "hallucinated");
    return ok.length ? ok : samples; // nothing verifiable: fall back to every sample, but keep no quote
  };
  const spread = () => Math.max(0, ...Array.from({ length: n }, (_, i) => {
    const xs = usable(i).map((s) => s.verdict.criteria[i].score);
    return Math.max(...xs) - Math.min(...xs);
  }));
  if (samples.length < opts.maxSamples && spread() > DISAGREE) await drawMany(opts.samples, opts.maxSamples);

  // Per criterion: the median of the samples with verifiable quotes, explained by the one closest to it.
  const scores: number[] = [];
  const criteria = Array.from({ length: n }, (_, i) => {
    const pool = usable(i);
    const m = median(pool.map((s) => s.verdict.criteria[i].score));
    scores.push(m);
    const rep = pool.reduce((a, b) => (Math.abs(b.verdict.criteria[i].score - m) < Math.abs(a.verdict.criteria[i].score - m) ? b : a));
    const grounded = rep.status[i] !== "hallucinated";
    return { ...rep.verdict.criteria[i], score: m, evidence: grounded ? rep.verdict.criteria[i].evidence : "" };
  });

  // Flags most samples raised; the summary and coaching from the sample closest to the agreed scores.
  const counts = new Map<string, number>();
  for (const s of samples) for (const f of new Set(s.verdict.flags)) counts.set(f, (counts.get(f) ?? 0) + 1);
  const flags = [...counts].filter(([, c]) => c * 2 > samples.length).map(([f]) => f) as Verdict["flags"];
  const closest = samples.reduce((a, b) => {
    const d = (s: Sample) => s.verdict.criteria.reduce((sum, c, i) => sum + Math.abs(c.score - scores[i]), 0);
    return d(b) < d(a) ? b : a;
  });

  const consensus: Consensus = {
    samples: samples.length,
    repaired: samples.filter((s) => s.repaired).length,
    hallucinatedQuotes: {
      before: samples.reduce((a, s) => a + s.hallucinatedBefore, 0),
      after: samples.reduce((a, s) => a + s.status.filter((x) => x === "hallucinated").length, 0),
    },
    grounded: criteria.filter((c) => quoteStatus(c.evidence, input.content) === "grounded").length,
    criteria: n,
    spread: spread(),
  };
  const out = toOutput(input, { ...closest.verdict, criteria, flags }, closest.model);
  return { ...out, flags: [...new Set(out.flags)] as JudgeFlag[], consensus };
}
