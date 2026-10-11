// Read models for the API: chain state joined with off-chain content.

import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { categoryById } from "../categories";
import {
  fetchConfig,
  fetchReputation,
  fetchReputations,
  fetchSubmissions,
  fetchSubmissionsByWorker,
  fetchTask,
  fetchTasks,
  pda,
  type ReputationView,
  type SubmissionView,
  type TaskView,
} from "../wukong";
import { demoContent, demoMode, connection, deployment, demoWallets, isDemoCreator, program, publicRpcUrl } from "./env";
import { judgeEngine } from "./judge";
import { store, type BriefRecord, type ReportRecord, type TaskMeta, type TxRecord } from "./store";
import { profileByWallet, publicProfile } from "./accounts";

export interface TaskCard extends TaskView {
  creatorName?: string;
  origin: BriefRecord["origin"] | "unknown";
  agent?: BriefRecord["agent"];
  template?: string;
  categoryLabel: string;
  /** Posted by a seeded demo company: on a demo deployment anyone may close it early */
  demoCreator: boolean;
}

/** A seeded demo company's task. Shown only on a demo deployment, never where real accounts exist. */
function hidden(t: TaskCard): boolean {
  return !demoContent() && (t.origin === "seed" || demoWallets().has(t.creator));
}

/** Join tasks with their off-chain metadata (three store round trips, however many tasks). */
async function cards(tasks: TaskView[], names?: Record<string, string>): Promise<TaskCard[]> {
  const [metas, briefs, allNames] = await Promise.all([
    store.taskMetas(tasks.map((t) => t.pubkey)),
    store.briefs(tasks.map((t) => t.briefHash)),
    names ?? store.names(),
  ]);
  return tasks.map((t, i) => card(t, metas[i] ?? briefs[i], allNames));
}

function card(t: TaskView, meta: TaskMeta | BriefRecord | undefined, names: Record<string, string>): TaskCard {
  return {
    ...t,
    creatorName: meta?.creatorName ?? names[t.creator],
    origin: meta?.origin ?? "unknown",
    agent: meta?.agent,
    template: meta?.template,
    categoryLabel: categoryById(t.category).label,
    demoCreator: demoContent() && isDemoCreator(t.creator),
  };
}

export async function stateView() {
  const dep = deployment();
  const prog = program();
  const [config, tasks] = await Promise.all([fetchConfig(prog), fetchTasks(prog)]);
  const list = (await cards(tasks)).filter((t) => !hidden(t));
  return {
    deployment: {
      cluster: dep.cluster,
      rpcUrl: publicRpcUrl(),
      programId: dep.programId,
      mint: dep.mint,
      judge: dep.judge,
    },
    judge: judgeEngine(),
    // Demo features in the UI (crowd, closing early, the test-funds button).
    demoMode: demoContent(),
    // The app quietly keeps a signed-in account's wallet topped up with the network's test funds.
    autoFund: demoMode(),
    config,
    tasks: list,
    stats: {
      tasks: list.length,
      open: list.filter((t) => t.status === "open").length,
      escrowed: config?.totalEscrowed ?? 0,
      paid: config?.totalPaid ?? 0,
      submissions: list.reduce((a, t) => a + t.submissionCount, 0),
    },
  };
}

export interface SubmissionDetail extends SubmissionView {
  content?: string;
  contentVerified: boolean;
  workerName?: string;
  report?: ReportRecord;
}

export async function taskView(taskKey: string) {
  const prog = program();
  const taskPk = new PublicKey(taskKey);
  const task = await fetchTask(prog, taskPk);
  if (!task) return null;
  const subs = await fetchSubmissions(prog, taskPk);
  const [names, brief, recs, reports, txs] = await Promise.all([
    store.names(),
    store.brief(task.briefHash),
    store.submissions(subs.map((s) => s.contentHash)),
    store.reports(subs.map((s) => s.pubkey)),
    store.txs(taskKey),
  ]);

  let vaultBalance = 0;
  try {
    vaultBalance = Number((await getAccount(connection(), pda.vault(taskPk))).amount);
  } catch {
    vaultBalance = 0;
  }

  // Entries stay sealed while the task is open so nobody can copy them.
  const sealed = task.status === "open";
  const submissions: SubmissionDetail[] = subs.map((s, i) => {
    const rec = recs[i];
    return {
      ...s,
      content: sealed ? undefined : rec?.content,
      contentVerified: !!rec,
      workerName: rec?.workerName ?? names[s.worker],
      report: reports[i],
    };
  });

  const card = (await cards([task], names))[0];
  if (hidden(card)) return null;
  return {
    task: card,
    brief: brief ? { text: brief.brief, verified: true } : null,
    vaultBalance,
    submissions,
    txs: txs.sort((a: TxRecord, b: TxRecord) => a.at - b.at),
    names,
  };
}

export async function workerView(worker: string) {
  const prog = program();
  const pk = new PublicKey(worker);
  const [rep, subs, tasks] = await Promise.all([
    fetchReputation(prog, pk),
    fetchSubmissionsByWorker(prog, pk),
    fetchTasks(prog),
  ]);
  const byKey = new Map(tasks.map((t) => [t.pubkey, t]));
  let usdc = 0;
  try {
    usdc = Number(
      (await getAccount(connection(), getAssociatedTokenAddressSync(new PublicKey(deployment().mint), pk, true)))
        .amount,
    );
  } catch {
    usdc = 0;
  }
  // Names and reports are extras: a store hiccup shouldn't take the whole profile down.
  const [names, reports, profile] = await Promise.all([
    store.names().catch(() => ({}) as Record<string, string>),
    store.reports(subs.map((s) => s.pubkey)).catch(() => subs.map(() => undefined)),
    profileByWallet(worker).catch(() => null),
  ]);
  return {
    worker,
    name: names[worker],
    profile: profile?.onboardedAt ? publicProfile(profile) : null,
    usdc,
    reputation: rep,
    reputationAccount: pda.reputation(pk).toBase58(),
    history: subs.map((s, i) => {
      const t = byKey.get(s.task);
      const report = reports[i];
      return {
        ...s,
        taskTitle: t?.title ?? "Unknown task",
        taskStatus: t?.status,
        category: t ? categoryById(t.category).label : "",
        summary: report?.report.summary,
      };
    }),
  };
}

export async function leaderboardView(): Promise<(ReputationView & { name?: string })[]> {
  const [reps, names] = await Promise.all([fetchReputations(program()), store.names()]);
  // The simulated crowd only ranks on a demo deployment.
  const shown = demoContent() ? reps : reps.filter((r) => !demoWallets().has(r.worker));
  return shown.map((r) => ({ ...r, name: names[r.worker] }));
}
