import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./env";
import type { JudgeReport } from "./judge/types";

// Off-chain content store. The chain holds sha256 commitments; this holds the
// bytes. Anyone can re-hash what we serve and compare it to the chain.

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

export interface TxRecord {
  sig: string;
  kind: "create" | "submit" | "close" | "score" | "settle" | "cancel" | "x402";
  label: string;
  at: number;
}

interface StoreShape {
  briefs: Record<string, BriefRecord>;
  submissions: Record<string, SubmissionRecord>;
  reports: Record<string, ReportRecord>;
  taskTxs: Record<string, TxRecord[]>;
  names: Record<string, string>;
}

const FILE = path.join(DATA_DIR, "store.json");
const empty = (): StoreShape => ({ briefs: {}, submissions: {}, reports: {}, taskTxs: {}, names: {} });

let cache: StoreShape | null = null;
let cacheMtime = 0;

function load(): StoreShape {
  try {
    const stat = fs.statSync(FILE);
    if (cache && stat.mtimeMs === cacheMtime) return cache;
    cache = { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) } as StoreShape;
    cacheMtime = stat.mtimeMs;
    return cache;
  } catch {
    cache = cache ?? empty();
    return cache;
  }
}

function save(s: StoreShape) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 1));
  fs.renameSync(tmp, FILE);
  cache = s;
  cacheMtime = fs.statSync(FILE).mtimeMs;
}

function mutate(fn: (s: StoreShape) => void) {
  const s = load();
  fn(s);
  save(s);
}

export const store = {
  brief: (hash: string): BriefRecord | undefined => load().briefs[hash],
  putBrief(rec: BriefRecord) {
    mutate((s) => {
      s.briefs[rec.hash] = { ...s.briefs[rec.hash], ...rec };
    });
  },

  submission: (hash: string): SubmissionRecord | undefined => load().submissions[hash],
  putSubmission(rec: SubmissionRecord) {
    mutate((s) => {
      s.submissions[rec.hash] = rec;
    });
  },

  report: (submission: string): ReportRecord | undefined => load().reports[submission],
  putReport(rec: ReportRecord) {
    mutate((s) => {
      s.reports[rec.submission] = rec;
    });
  },

  txs: (task: string): TxRecord[] => load().taskTxs[task] ?? [],
  addTx(task: string, tx: TxRecord) {
    mutate((s) => {
      const list = s.taskTxs[task] ?? [];
      if (!list.some((t) => t.sig === tx.sig)) list.push(tx);
      s.taskTxs[task] = list;
    });
  },

  names: (): Record<string, string> => load().names,
  setName(pubkey: string, name: string) {
    mutate((s) => {
      s.names[pubkey] = name.slice(0, 40);
    });
  },
};
