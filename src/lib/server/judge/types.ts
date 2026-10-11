/** Which judge scored: Claude, an OpenAI-compatible API (DeepSeek and others), or the offline heuristics. */
export type JudgeEngine = "claude" | "openai-compatible" | "heuristic";

export type JudgeFlag =
  | "prompt_injection"
  | "duplicate"
  | "plagiarism_suspected"
  | "off_topic"
  | "low_effort"
  | "wrong_language"
  | "constraint_violation"
  | "unsafe"
  | "content_missing";

export interface CriterionScore {
  key: string;
  label: string;
  weight: number;
  score: number; // 0..100
  comment: string;
  /** The verbatim quote from the entry the score rests on, verified by code ("" when the point is something missing) */
  evidence?: string;
}

/** How a model's verdict was reached: samples drawn, quotes checked, agreement. */
export interface Consensus {
  samples: number;
  /** Samples sent back once because they quoted text that isn't in the entry */
  repaired: number;
  /** Quotes not found in the entry, before and after repair */
  hallucinatedQuotes: { before: number; after: number };
  /** Criteria with a verified quote in the final verdict, of all criteria */
  grounded: number;
  criteria: number;
  /** Largest disagreement between samples on any criterion, in points */
  spread: number;
}

/** The full written verdict for one submission. Its sha256 goes on-chain. */
export interface JudgeReport {
  version: 1;
  task: string;
  submission: string;
  worker: string;
  contentHash: string;
  briefHash: string;
  engine: JudgeEngine;
  model: string;
  rubric: string;
  criteria: CriterionScore[];
  flags: JudgeFlag[];
  signals: string[];
  summary: string;
  strengths: string[];
  improvements: string[];
  /** Present for AI engines: how the verdict was reached */
  consensus?: Consensus;
  rawScore: number; // weighted criteria, 0..100
  finalScore: number; // after integrity penalties, 0..100
  onchainScore: number; // finalScore * 100, 0..10000
  judgedAt: number;
}

export interface ScoringInput {
  brief: string;
  title: string;
  category: number;
  content: string;
  index: number;
  signals: string[];
  /** The brief's hard requirements checked by code, as "PASS/FAIL: rule (measurement)" lines */
  facts?: string[];
  /** Other entries' content; used only for consensus checks offline. */
  peers?: string[];
}

export interface ScoringOutput {
  criteria: { key: string; score: number; comment: string; evidence?: string }[];
  flags: JudgeFlag[];
  summary: string;
  strengths: string[];
  improvements: string[];
  model: string;
  consensus?: Consensus;
}

export type JudgeEvent =
  // Public stream: the kind of judge only, never the model or provider.
  | { type: "start"; task: string; count: number; engine: "ai" | "heuristic" }
  | { type: "tx"; kind: "close" | "score" | "settle"; sig: string; label: string; submission?: string }
  | { type: "verify"; submission: string; index: number; ok: boolean; detail: string }
  | { type: "signal"; submission: string; index: number; flag: JudgeFlag; detail: string }
  | { type: "scoring"; submission: string; index: number }
  | {
      type: "scored";
      submission: string;
      index: number;
      worker: string;
      score: number;
      reportHash: string;
      report: JudgeReport;
    }
  | { type: "podium"; podium: { worker: string; submission: string; score: number; index: number }[] }
  | {
      type: "settled";
      sig: string;
      payouts: { worker: string; amount: number; place: number }[];
      fee: number;
      refunded: number;
    }
  | {
      type: "stake";
      submission: string;
      index: number;
      worker: string;
      amount: number;
      refunded: boolean;
      sig: string;
    }
  | { type: "awaiting_pick"; podium: { worker: string; submission: string; score: number; index: number }[] }
  | { type: "log"; message: string }
  | { type: "done" }
  | { type: "error"; message: string };
