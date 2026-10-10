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
}

/** The full written verdict for one submission. Its sha256 goes on-chain. */
export interface JudgeReport {
  version: 1;
  task: string;
  submission: string;
  worker: string;
  contentHash: string;
  briefHash: string;
  engine: "claude" | "heuristic";
  model: string;
  rubric: string;
  criteria: CriterionScore[];
  flags: JudgeFlag[];
  signals: string[];
  summary: string;
  strengths: string[];
  improvements: string[];
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
  /** Other entries' content; used only for consensus checks offline. */
  peers?: string[];
}

export interface ScoringOutput {
  criteria: { key: string; score: number; comment: string }[];
  flags: JudgeFlag[];
  summary: string;
  strengths: string[];
  improvements: string[];
  model: string;
}

export type JudgeEvent =
  | { type: "start"; task: string; count: number; engine: "claude" | "heuristic"; model: string }
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
  | { type: "awaiting_pick"; podium: { worker: string; submission: string; score: number; index: number }[] }
  | { type: "log"; message: string }
  | { type: "done" }
  | { type: "error"; message: string };
