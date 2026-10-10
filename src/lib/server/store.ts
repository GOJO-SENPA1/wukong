import { kv } from "./kv";
import type { JudgeReport } from "./judge/types";

// Off-chain content store. The chain holds sha256 commitments; this holds the
// bytes. Anyone can re-hash what we serve and compare it to the chain.
// Backed by Redis on serverless hosts, a JSON file otherwise (see kv.ts).

export interface BriefRecord {
  hash: string;
  title: string;
  category: number;
  brief: string;
  createdAt: number;
  origin: "web" | "x402" | "seed";
  creatorName?: string;
  agent?: { name: string; payer: string; paymentTx: string };
  template?: string;
}

export interface SubmissionRecord {
  hash: string;
  content: string;
  worker: string;
  workerName?: string;
  task: string;
  createdAt: number;
}

export interface ReportRecord {
  submission: string;
  hash: string;
  report: JudgeReport;
  txSig?: string;
}

/** Who/what posted a specific task. Briefs are keyed by hash and can be shared. */
export interface TaskMeta {
  origin: BriefRecord["origin"];
  creatorName?: string;
  agent?: BriefRecord["agent"];
  template?: string;
}

export interface TxRecord {
  sig: string;
  kind: "create" | "submit" | "close" | "score" | "settle" | "cancel" | "x402";
  label: string;
  at: number;
}

export const store = {
  brief: (hash: string) => kv().get<BriefRecord>("briefs", hash),
  briefs: (hashes: string[]) => kv().many<BriefRecord>("briefs", hashes),
  async putBrief(rec: BriefRecord) {
    const prev = await kv().get<BriefRecord>("briefs", rec.hash);
    await kv().set("briefs", rec.hash, { ...prev, ...rec });
  },

  taskMeta: (task: string) => kv().get<TaskMeta>("taskMeta", task),
  taskMetas: (tasks: string[]) => kv().many<TaskMeta>("taskMeta", tasks),
  setTaskMeta: (task: string, meta: TaskMeta) => kv().set("taskMeta", task, meta),

  submission: (hash: string) => kv().get<SubmissionRecord>("submissions", hash),
  submissions: (hashes: string[]) => kv().many<SubmissionRecord>("submissions", hashes),
  putSubmission: (rec: SubmissionRecord) => kv().set("submissions", rec.hash, rec),

  report: (submission: string) => kv().get<ReportRecord>("reports", submission),
  reports: (submissions: string[]) => kv().many<ReportRecord>("reports", submissions),
  putReport: (rec: ReportRecord) => kv().set("reports", rec.submission, rec),

  async txs(task: string): Promise<TxRecord[]> {
    const seen = new Set<string>();
    return (await kv().list<TxRecord>("taskTxs", task)).filter((t) => !seen.has(t.sig) && !!seen.add(t.sig));
  },
  async addTx(task: string, tx: TxRecord) {
    if ((await kv().list<TxRecord>("taskTxs", task)).some((t) => t.sig === tx.sig)) return;
    await kv().push("taskTxs", task, tx);
  },

  names: () => kv().all<string>("names"),
  setName: (pubkey: string, name: string) => kv().set("names", pubkey, name.slice(0, 40)),
};
