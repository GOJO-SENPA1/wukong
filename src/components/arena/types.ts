import type { JudgeEvent, JudgeFlag } from "@/lib/server/judge/types";
import type { SubmissionDetail, TaskCard } from "@/lib/server/views";
import type { TxRecord } from "@/lib/server/store";

export interface TaskPayload {
  task: TaskCard;
  brief: { text: string; verified: boolean } | null;
  vaultBalance: number;
  submissions: SubmissionDetail[];
  txs: TxRecord[];
  names: Record<string, string>;
}

export type CrowdEvent =
  | { type: "start"; count: number }
  | { type: "submitted"; name: string; city: string; worker: string; sig: string; preview: string }
  | { type: "skipped"; name: string; reason: string }
  | { type: "done"; submitted: number }
  | { type: "error"; message: string };

export interface LiveState {
  scoring: Set<string>;
  scored: Map<string, number>;
  signals: Map<string, { flag: JudgeFlag; detail: string }[]>;
  verified: Map<string, boolean>;
}

export interface LogLine {
  id: number;
  at: number;
  tone: "info" | "good" | "warn" | "bad" | "ai" | "money";
  text: string;
  sig?: string;
}

export type { JudgeEvent, JudgeFlag, SubmissionDetail };
