// Isomorphic client for the Wukong program: PDAs, account decoding and
// instruction builders. Used by the browser, the API routes and the scripts.

import { AnchorProvider, BN, Program, type Wallet } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type Commitment,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idl from "./idl/wukong.json";
import type { Wukong } from "./idl/wukong";
import { fromHex, toHex } from "./format";

export const PROGRAM_ID = new PublicKey(idl.address);
export type WukongProgram = Program<Wukong>;

const seed = (s: string) => Buffer.from(s, "utf8");

export const pda = {
  config: () => PublicKey.findProgramAddressSync([seed("config")], PROGRAM_ID)[0],
  task: (creator: PublicKey, nonce: BN) =>
    PublicKey.findProgramAddressSync(
      [seed("task"), creator.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID,
    )[0],
  vault: (task: PublicKey) =>
    PublicKey.findProgramAddressSync([seed("vault"), task.toBuffer()], PROGRAM_ID)[0],
  submission: (task: PublicKey, worker: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [seed("submission"), task.toBuffer(), worker.toBuffer()],
      PROGRAM_ID,
    )[0],
  reputation: (worker: PublicKey) =>
    PublicKey.findProgramAddressSync([seed("reputation"), worker.toBuffer()], PROGRAM_ID)[0],
};

/** Anything that can sign: a burner Keypair, a wallet-adapter wallet, a server key. */
export interface Signer {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
}

export function keypairSigner(kp: Keypair): Signer {
  return {
    publicKey: kp.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof VersionedTransaction) tx.sign([kp]);
      else tx.partialSign(kp);
      return tx;
    },
  };
}

class ReadonlyWallet implements Wallet {
  publicKey = Keypair.generate().publicKey;
  payer = Keypair.generate();
  async signTransaction<T extends Transaction | VersionedTransaction>(): Promise<T> {
    throw new Error("read-only wallet");
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(): Promise<T[]> {
    throw new Error("read-only wallet");
  }
}

export function getProgram(connection: Connection): WukongProgram {
  const provider = new AnchorProvider(connection, new ReadonlyWallet(), {
    commitment: "confirmed",
  });
  return new Program<Wukong>(idl as Wukong, provider);
}

// ---------------------------------------------------------------------------
// Views: plain JSON-friendly shapes for UI + API.

export type TaskStatus = "open" | "judging" | "settled" | "cancelled";
export type PayoutMode = "winnerTakesAll" | "topThree";
export type JudgeMode = "aiFinal" | "creatorPicks";

export interface PodiumView {
  worker: string;
  submission: string;
  score: number;
  index: number;
}

export interface TaskView {
  pubkey: string;
  creator: string;
  nonce: string;
  mint: string;
  vault: string;
  title: string;
  category: number;
  briefHash: string;
  reward: number;
  feeBps: number;
  createdAt: number;
  deadline: number;
  status: TaskStatus;
  payoutMode: PayoutMode;
  judgeMode: JudgeMode;
  minRating: number;
  maxSubmissions: number;
  entryStake: number;
  stakesOutstanding: number;
  pickGraceSecs: number;
  closedAt: number;
  submissionCount: number;
  scoredCount: number;
  podium: PodiumView[];
  paidOut: number;
  feePaid: number;
  settledAt: number;
}

export interface SubmissionView {
  pubkey: string;
  task: string;
  worker: string;
  index: number;
  contentHash: string;
  submittedAt: number;
  score: number;
  scored: boolean;
  reportHash: string;
  rank: number;
  payout: number;
  stake: number;
  stakeSettled: boolean;
}

export interface ReputationView {
  pubkey: string;
  worker: string;
  submissions: number;
  scored: number;
  scoreSum: number;
  avgScore: number;
  bestScore: number;
  wins: number;
  podiums: number;
  totalEarned: number;
  rating: number;
  lastActive: number;
}

export interface ConfigView {
  pubkey: string;
  admin: string;
  judge: string;
  treasury: string;
  mint: string;
  feeBps: number;
  taskCount: number;
  totalEscrowed: number;
  totalPaid: number;
}

const enumKey = <T extends string>(v: object): T => Object.keys(v)[0] as T;
const num = (v: BN | number) => (typeof v === "number" ? v : v.toNumber());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export function toTaskView(pubkey: PublicKey, a: Raw): TaskView {
  return {
    pubkey: pubkey.toBase58(),
    creator: a.creator.toBase58(),
    nonce: a.nonce.toString(),
    mint: a.mint.toBase58(),
    vault: a.vault.toBase58(),
    title: a.title,
    category: a.category,
    briefHash: toHex(a.briefHash),
    reward: num(a.reward),
    feeBps: a.feeBps,
    createdAt: num(a.createdAt),
    deadline: num(a.deadline),
    status: enumKey<TaskStatus>(a.status),
    payoutMode: enumKey<PayoutMode>(a.payoutMode),
    judgeMode: enumKey<JudgeMode>(a.judgeMode),
    minRating: a.minRating,
    maxSubmissions: a.maxSubmissions,
    entryStake: num(a.entryStake),
    stakesOutstanding: a.stakesOutstanding,
    pickGraceSecs: a.pickGraceSecs,
    closedAt: num(a.closedAt),
    submissionCount: a.submissionCount,
    scoredCount: a.scoredCount,
    podium: (a.podium as Raw[])
      .filter((p) => p.filled)
      .map((p) => ({
        worker: p.worker.toBase58(),
        submission: p.submission.toBase58(),
        score: p.score,
        index: p.index,
      })),
    paidOut: num(a.paidOut),
    feePaid: num(a.feePaid),
    settledAt: num(a.settledAt),
  };
}

export function toSubmissionView(pubkey: PublicKey, a: Raw): SubmissionView {
  return {
    pubkey: pubkey.toBase58(),
    task: a.task.toBase58(),
    worker: a.worker.toBase58(),
    index: a.index,
    contentHash: toHex(a.contentHash),
    submittedAt: num(a.submittedAt),
    score: a.score,
    scored: a.scored,
    reportHash: toHex(a.reportHash),
    rank: a.rank,
    payout: num(a.payout),
    stake: num(a.stake),
    stakeSettled: a.stakeSettled,
  };
}

export function toReputationView(pubkey: PublicKey, a: Raw): ReputationView {
  const scoreSum = num(a.scoreSum);
  return {
    pubkey: pubkey.toBase58(),
    worker: a.worker.toBase58(),
    submissions: a.submissions,
    scored: a.scored,
    scoreSum,
    avgScore: a.scored > 0 ? Math.round(scoreSum / a.scored) : 0,
    bestScore: a.bestScore,
    wins: a.wins,
    podiums: a.podiums,
    totalEarned: num(a.totalEarned),
    rating: a.rating,
    lastActive: num(a.lastActive),
  };
}

export async function fetchConfig(program: WukongProgram): Promise<ConfigView | null> {
  const key = pda.config();
  const a = await program.account.config.fetchNullable(key);
  if (!a) return null;
  return {
    pubkey: key.toBase58(),
    admin: a.admin.toBase58(),
    judge: a.judge.toBase58(),
    treasury: a.treasury.toBase58(),
    mint: a.mint.toBase58(),
    feeBps: a.feeBps,
    taskCount: num(a.taskCount),
    totalEscrowed: num(a.totalEscrowed),
    totalPaid: num(a.totalPaid),
  };
}

export async function fetchTasks(program: WukongProgram): Promise<TaskView[]> {
  const all = await program.account.task.all();
  return all
    .map((t) => toTaskView(t.publicKey, t.account))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchTask(program: WukongProgram, task: PublicKey): Promise<TaskView | null> {
  const a = await program.account.task.fetchNullable(task);
  return a ? toTaskView(task, a) : null;
}

export async function fetchSubmissions(
  program: WukongProgram,
  task: PublicKey,
): Promise<SubmissionView[]> {
  const all = await program.account.submission.all([
    { memcmp: { offset: 8, bytes: task.toBase58() } },
  ]);
  return all
    .map((s) => toSubmissionView(s.publicKey, s.account))
    .sort((a, b) => a.index - b.index);
}

export async function fetchSubmissionsByWorker(
  program: WukongProgram,
  worker: PublicKey,
): Promise<SubmissionView[]> {
  const all = await program.account.submission.all([
    { memcmp: { offset: 8 + 32, bytes: worker.toBase58() } },
  ]);
  return all
    .map((s) => toSubmissionView(s.publicKey, s.account))
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export async function fetchReputation(
  program: WukongProgram,
  worker: PublicKey,
): Promise<ReputationView | null> {
  const key = pda.reputation(worker);
  const a = await program.account.reputation.fetchNullable(key);
  return a ? toReputationView(key, a) : null;
}

export async function fetchReputations(program: WukongProgram): Promise<ReputationView[]> {
  const all = await program.account.reputation.all();
  return all
    .map((r) => toReputationView(r.publicKey, r.account))
    .sort((a, b) => b.rating - a.rating || b.totalEarned - a.totalEarned);
}

// ---------------------------------------------------------------------------
// Instruction builders.

export interface CreateTaskInput {
  title: string;
  category: number;
  briefHashHex: string;
  reward: number; // base units
  deadline: number; // unix seconds
  payoutMode: PayoutMode;
  judgeMode: JudgeMode;
  minRating: number;
  maxSubmissions: number;
  /** Refundable per-entry stake, base units (default 0). */
  entryStake?: number;
  /** Creator-picks mode: seconds after closing before the AI's pick wins (default 72h). */
  pickGraceSecs?: number;
}

export const DEFAULT_PICK_GRACE_SECS = 72 * 3600;

export function newNonce(): BN {
  // Millisecond timestamp + entropy: unique per creator without a global counter.
  return new BN(Date.now()).muln(1000).addn(Math.floor(Math.random() * 1000));
}

export async function buildCreateTask(
  program: WukongProgram,
  creator: PublicKey,
  mint: PublicKey,
  input: CreateTaskInput,
  nonce: BN = newNonce(),
): Promise<{ ixs: TransactionInstruction[]; task: PublicKey }> {
  const task = pda.task(creator, nonce);
  const ix = await program.methods
    .createTask(nonce, {
      title: input.title,
      category: input.category,
      briefHash: fromHex(input.briefHashHex),
      reward: new BN(input.reward),
      deadline: new BN(input.deadline),
      payoutMode: { [input.payoutMode]: {} } as never,
      judgeMode: { [input.judgeMode]: {} } as never,
      minRating: input.minRating,
      maxSubmissions: input.maxSubmissions,
      entryStake: new BN(input.entryStake ?? 0),
      pickGraceSecs: input.pickGraceSecs ?? DEFAULT_PICK_GRACE_SECS,
    })
    .accountsPartial({
      creator,
      config: pda.config(),
      task,
      mint,
      vault: pda.vault(task),
      creatorToken: getAssociatedTokenAddressSync(mint, creator),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  return { ixs: [ix], task };
}

/** Pass `stake` (the task's mint) when the task has an entry stake. */
export async function buildSubmitWork(
  program: WukongProgram,
  worker: PublicKey,
  task: PublicKey,
  contentHashHex: string,
  stake?: { mint: PublicKey } | null,
): Promise<TransactionInstruction> {
  return program.methods
    .submitWork(fromHex(contentHashHex))
    .accountsPartial({
      worker,
      task,
      submission: pda.submission(task, worker),
      reputation: pda.reputation(worker),
      mint: stake ? stake.mint : null,
      vault: stake ? pda.vault(task) : null,
      workerToken: stake ? getAssociatedTokenAddressSync(stake.mint, worker, true) : null,
      tokenProgram: stake ? TOKEN_PROGRAM_ID : null,
    })
    .instruction();
}

/** Submit instruction for a task view, adding stake accounts when needed. */
export function buildSubmitForTask(
  program: WukongProgram,
  worker: PublicKey,
  task: TaskView,
  contentHashHex: string,
): Promise<TransactionInstruction> {
  return buildSubmitWork(
    program,
    worker,
    new PublicKey(task.pubkey),
    contentHashHex,
    task.entryStake > 0 ? { mint: new PublicKey(task.mint) } : null,
  );
}

export async function buildCloseSubmissions(
  program: WukongProgram,
  authority: PublicKey,
  task: PublicKey,
): Promise<TransactionInstruction> {
  return program.methods
    .closeSubmissions()
    .accountsPartial({ authority, config: pda.config(), task })
    .instruction();
}

export async function buildScore(
  program: WukongProgram,
  judge: PublicKey,
  task: PublicKey,
  submission: SubmissionView,
  score: number,
  reportHashHex: string,
): Promise<TransactionInstruction> {
  const worker = new PublicKey(submission.worker);
  return program.methods
    .scoreSubmission(score, fromHex(reportHashHex))
    .accountsPartial({
      judge,
      config: pda.config(),
      task,
      submission: new PublicKey(submission.pubkey),
      reputation: pda.reputation(worker),
    })
    .instruction();
}

/** Podium places that will be paid for this task, in order. */
export function payablePodium(task: TaskView, pick?: number): PodiumView[] {
  if (task.judgeMode === "creatorPicks") {
    // No pick = the creator's window lapsed and the AI's top entry wins.
    if (pick === undefined) return task.podium.slice(0, 1);
    return task.podium[pick] ? [task.podium[pick]] : [];
  }
  return task.payoutMode === "winnerTakesAll" ? task.podium.slice(0, 1) : task.podium.slice(0, 3);
}

export async function buildSettle(
  program: WukongProgram,
  cranker: PublicKey,
  task: TaskView,
  config: ConfigView,
  pick?: number,
): Promise<TransactionInstruction[]> {
  const mint = new PublicKey(task.mint);
  const taskKey = new PublicKey(task.pubkey);
  const creator = new PublicKey(task.creator);
  const treasury = new PublicKey(config.treasury);
  const treasuryToken = getAssociatedTokenAddressSync(mint, treasury, true);
  const creatorToken = getAssociatedTokenAddressSync(mint, creator, true);
  const winners = payablePodium(task, pick);

  const ixs: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    createAssociatedTokenAccountIdempotentInstruction(cranker, treasuryToken, treasury, mint),
    createAssociatedTokenAccountIdempotentInstruction(cranker, creatorToken, creator, mint),
  ];
  const remaining = [];
  for (const w of winners) {
    const worker = new PublicKey(w.worker);
    const ata = getAssociatedTokenAddressSync(mint, worker, true);
    ixs.push(createAssociatedTokenAccountIdempotentInstruction(cranker, ata, worker, mint));
    remaining.push(
      { pubkey: new PublicKey(w.submission), isSigner: false, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: pda.reputation(worker), isSigner: false, isWritable: true },
    );
  }

  const accounts = {
    cranker,
    config: pda.config(),
    task: taskKey,
    vault: pda.vault(taskKey),
    mint,
    treasuryToken,
    creatorToken,
    creator,
    tokenProgram: TOKEN_PROGRAM_ID,
  };
  const builder = pick !== undefined ? program.methods.settlePick(pick) : program.methods.settle();
  ixs.push(await builder.accountsPartial(accounts).remainingAccounts(remaining).instruction());
  return ixs;
}

/** claim_stake for every unsettled staked entry, grouped a few per transaction. */
export async function buildClaimStakes(
  program: WukongProgram,
  cranker: PublicKey,
  task: TaskView,
  config: ConfigView,
  subs: SubmissionView[],
  perTx = 3,
): Promise<TransactionInstruction[][]> {
  const mint = new PublicKey(task.mint);
  const taskKey = new PublicKey(task.pubkey);
  const treasury = new PublicKey(config.treasury);
  const treasuryToken = getAssociatedTokenAddressSync(mint, treasury, true);
  const pending = subs.filter((s) => s.stake > 0 && !s.stakeSettled);
  const groups: TransactionInstruction[][] = [];
  for (let i = 0; i < pending.length; i += perTx) {
    const ixs: TransactionInstruction[] = [
      createAssociatedTokenAccountIdempotentInstruction(cranker, treasuryToken, treasury, mint),
    ];
    for (const s of pending.slice(i, i + perTx)) {
      const worker = new PublicKey(s.worker);
      ixs.push(
        await program.methods
          .claimStake()
          .accountsPartial({
            cranker,
            config: pda.config(),
            task: taskKey,
            submission: new PublicKey(s.pubkey),
            vault: pda.vault(taskKey),
            mint,
            workerToken: getAssociatedTokenAddressSync(mint, worker, true),
            treasuryToken,
            creator: new PublicKey(task.creator),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction(),
      );
    }
    groups.push(ixs);
  }
  return groups;
}

export async function buildCancel(
  program: WukongProgram,
  creator: PublicKey,
  task: TaskView,
): Promise<TransactionInstruction> {
  const mint = new PublicKey(task.mint);
  const taskKey = new PublicKey(task.pubkey);
  return program.methods
    .cancelTask()
    .accountsPartial({
      creator,
      config: pda.config(),
      task: taskKey,
      vault: pda.vault(taskKey),
      mint,
      creatorToken: getAssociatedTokenAddressSync(mint, creator, true),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}

// ---------------------------------------------------------------------------
// Sending.

export async function sendIxs(
  connection: Connection,
  signer: Signer,
  ixs: TransactionInstruction[],
  opts: { commitment?: Commitment; extraSigners?: Keypair[] } = {},
): Promise<string> {
  const commitment = opts.commitment ?? "confirmed";
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment);
  const tx = new Transaction({ feePayer: signer.publicKey, blockhash, lastValidBlockHeight });
  tx.add(...ixs);
  if (opts.extraSigners?.length) tx.partialSign(...opts.extraSigners);
  const signed = await signer.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: commitment,
  });
  const res = await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    commitment,
  );
  if (res.value.err) throw new Error(`Transaction ${sig} failed: ${JSON.stringify(res.value.err)}`);
  return sig;
}

/** Pull the human-readable Anchor error out of a failed send, if there is one. */
export function explainError(err: unknown): string {
  const e = err as { logs?: string[]; message?: string; transactionLogs?: string[] };
  const logs = e?.logs ?? e?.transactionLogs ?? [];
  const anchorLine = logs.find((l) => l.includes("Error Message:"));
  if (anchorLine) return anchorLine.split("Error Message:")[1].trim();
  const msg = e?.message ?? String(err);
  const m = msg.match(/Error Message: ([^.]+\.?)/);
  return m ? m[1] : msg;
}
