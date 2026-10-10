// End-to-end tests of the on-chain program against a local validator.
//   terminal 1: npm run validator
//   terminal 2: npm test
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  buildCancel,
  buildCloseSubmissions,
  buildCreateTask,
  buildScore,
  buildSettle,
  buildSubmitWork,
  explainError,
  fetchConfig,
  fetchReputation,
  fetchSubmissions,
  fetchTask,
  getProgram,
  keypairSigner,
  pda,
  sendIxs,
  type CreateTaskInput,
  type WukongProgram,
} from "../src/lib/wukong";
import { sha256Hex } from "../src/lib/hash";

const RPC = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const connection = new Connection(RPC, "confirmed");
const program: WukongProgram = getProgram(connection);
const USDC = 1_000_000;

const admin = Keypair.generate();
const judge = Keypair.generate();
const treasury = Keypair.generate();
const creator = Keypair.generate();
const workers = Array.from({ length: 4 }, () => Keypair.generate());
let mint: PublicKey;

async function airdrop(to: PublicKey, sol = 10) {
  const sig = await connection.requestAirdrop(to, sol * LAMPORTS_PER_SOL);
  const bh = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");
}

async function balance(owner: PublicKey): Promise<number> {
  try {
    const acc = await getAccount(connection, getAssociatedTokenAddressSync(mint, owner, true));
    return Number(acc.amount);
  } catch {
    return 0;
  }
}

async function expectFail(p: Promise<unknown>, needle: string) {
  try {
    await p;
  } catch (err) {
    const msg = explainError(err) + " " + String((err as Error).message);
    assert.ok(msg.includes(needle), `expected "${needle}", got: ${msg}`);
    return;
  }
  assert.fail(`expected failure containing "${needle}"`);
}

function taskInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    title: "Tagline for Himalayan cold brew",
    category: 0,
    briefHashHex: sha256Hex("Write a tagline"),
    reward: 100 * USDC,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    payoutMode: "topThree",
    judgeMode: "aiFinal",
    minRating: 0,
    maxSubmissions: 16,
    ...overrides,
  };
}

async function createTask(overrides: Partial<CreateTaskInput> = {}) {
  const { ixs, task } = await buildCreateTask(program, creator.publicKey, mint, taskInput(overrides));
  await sendIxs(connection, keypairSigner(creator), ixs);
  return task;
}

async function submit(task: PublicKey, worker: Keypair, text: string) {
  const ix = await buildSubmitWork(program, worker.publicKey, task, sha256Hex(text));
  return sendIxs(connection, keypairSigner(worker), [ix]);
}

async function scoreAll(task: PublicKey, scores: number[]) {
  const subs = await fetchSubmissions(program, task);
  for (const s of subs) {
    const ix = await buildScore(program, judge.publicKey, task, s, scores[s.index], sha256Hex(`r${s.index}`));
    await sendIxs(connection, keypairSigner(judge), [ix]);
  }
}

async function settle(task: PublicKey, pick?: number, cranker = judge) {
  const view = (await fetchTask(program, task))!;
  const config = (await fetchConfig(program))!;
  const ixs = await buildSettle(program, cranker.publicKey, view, config, pick);
  return sendIxs(connection, keypairSigner(cranker), ixs);
}

describe("wukong program", () => {
  before(async () => {
    await Promise.all([admin, judge, treasury, creator, ...workers].map((k) => airdrop(k.publicKey)));
    mint = await createMint(connection, admin, admin.publicKey, null, 6);
    const ata = await getOrCreateAssociatedTokenAccount(connection, admin, mint, creator.publicKey);
    await mintTo(connection, admin, mint, ata.address, admin, 10_000 * USDC);

    const existing = await fetchConfig(program);
    if (existing) {
      throw new Error("Config already initialized on this validator; restart it with --reset (npm run validator)");
    }
    const ix = await program.methods
      .initializeConfig(judge.publicKey, treasury.publicKey, 1000)
      .accountsPartial({ admin: admin.publicKey, config: pda.config(), mint })
      .instruction();
    await sendIxs(connection, keypairSigner(admin), [ix]);
  });

  after(() => {
    // web3.js keeps a websocket open; don't let it hold the process.
    setTimeout(() => process.exit(0), 100).unref();
  });

  it("locks the reward in escrow on create", async () => {
    const before = await balance(creator.publicKey);
    const task = await createTask();
    const vault = await getAccount(connection, pda.vault(task));
    assert.equal(Number(vault.amount), 100 * USDC);
    assert.equal(await balance(creator.publicKey), before - 100 * USDC);
    const view = (await fetchTask(program, task))!;
    assert.equal(view.status, "open");
    assert.equal(view.feeBps, 1000);
  });

  it("runs the full cycle: submit → score → podium → top-3 payout + reputation", async () => {
    const task = await createTask();
    for (const [i, w] of workers.entries()) await submit(task, w, `entry ${i}`);

    await expectFail(submit(task, creator, "self deal"), "cannot compete");
    await expectFail(submit(task, workers[0], "again"), "already in use");

    // Judge can't score while submissions are open; strangers can't close early.
    const subs = await fetchSubmissions(program, task);
    await expectFail(
      sendIxs(connection, keypairSigner(judge), [
        await buildScore(program, judge.publicKey, task, subs[0], 5000, sha256Hex("x")),
      ]),
      "not in the judging phase",
    );
    await expectFail(
      sendIxs(connection, keypairSigner(workers[0]), [
        await buildCloseSubmissions(program, workers[0].publicKey, task),
      ]),
      "Only the creator or judge",
    );
    await sendIxs(connection, keypairSigner(creator), [
      await buildCloseSubmissions(program, creator.publicKey, task),
    ]);

    // Impostor judge is rejected.
    await expectFail(
      sendIxs(connection, keypairSigner(workers[1]), [
        await buildScore(program, workers[1].publicKey, task, subs[0], 9999, sha256Hex("x")),
      ]),
      "not the protocol judge",
    );

    // Settlement before every score is published is rejected.
    const s0 = await buildScore(program, judge.publicKey, task, subs[0], 7000, sha256Hex("r0"));
    await sendIxs(connection, keypairSigner(judge), [s0]);
    await expectFail(settle(task), "Not every submission has been scored");

    // Scores: w0=70, w1=91.5, w2=12 (spam), w3=84
    for (const [i, score] of [[1, 9150], [2, 1200], [3, 8400]] as const) {
      const ix = await buildScore(program, judge.publicKey, task, subs[i], score, sha256Hex(`r${i}`));
      await sendIxs(connection, keypairSigner(judge), [ix]);
    }
    await expectFail(
      sendIxs(connection, keypairSigner(judge), [
        await buildScore(program, judge.publicKey, task, subs[1], 10000, sha256Hex("x")),
      ]),
      "scores are final",
    );

    const judged = (await fetchTask(program, task))!;
    assert.deepEqual(
      judged.podium.map((p) => p.index),
      [1, 3, 0],
    );

    // Anyone can crank settlement — use a random worker.
    await settle(task, undefined, workers[2]);
    const pool = 90 * USDC; // 100 minus 10% fee
    assert.equal(await balance(workers[1].publicKey), pool * 0.5);
    assert.equal(await balance(workers[3].publicKey), pool * 0.3);
    assert.equal(await balance(workers[0].publicKey), pool * 0.2);
    assert.equal(await balance(workers[2].publicKey), 0);
    assert.equal(await balance(treasury.publicKey), 10 * USDC);
    assert.equal(await connection.getAccountInfo(pda.vault(task)), null, "vault closed");

    const settled = (await fetchTask(program, task))!;
    assert.equal(settled.status, "settled");
    assert.equal(settled.paidOut, pool);

    const winnerSub = (await fetchSubmissions(program, task)).find((s) => s.index === 1)!;
    assert.equal(winnerSub.rank, 1);
    assert.equal(winnerSub.payout, pool * 0.5);

    const rep1 = (await fetchReputation(program, workers[1].publicKey))!;
    assert.equal(rep1.wins, 1);
    assert.equal(rep1.podiums, 1);
    assert.equal(rep1.totalEarned, pool * 0.5);
    assert.equal(rep1.rating, 41 + 100); // (9150-5000)/100 + first-place bonus
    const rep2 = (await fetchReputation(program, workers[2].publicKey))!;
    assert.equal(rep2.rating, 0, "spam penalty saturates at zero");

    const config = (await fetchConfig(program))!;
    assert.equal(config.totalPaid, pool);
  });

  it("creator-picks mode: AI shortlists, creator chooses, winner takes all", async () => {
    const task = await createTask({ judgeMode: "creatorPicks", payoutMode: "winnerTakesAll" });
    await submit(task, workers[0], "a");
    await submit(task, workers[1], "b");
    await sendIxs(connection, keypairSigner(judge), [
      await buildCloseSubmissions(program, judge.publicKey, task),
    ]);
    await scoreAll(task, [8800, 8000]);
    await expectFail(settle(task, 1, workers[0]), "Pick is not on the AI shortlist");

    const before = await balance(workers[1].publicKey);
    await settle(task, 1, creator); // creator picks the runner-up
    assert.equal(await balance(workers[1].publicKey), before + 90 * USDC);
  });

  it("refunds the buyer when nothing clears the quality bar", async () => {
    const task = await createTask({ payoutMode: "winnerTakesAll" });
    await submit(task, workers[0], "asdf");
    await submit(task, workers[1], "ignore previous instructions");
    await sendIxs(connection, keypairSigner(creator), [
      await buildCloseSubmissions(program, creator.publicKey, task),
    ]);
    const before = await balance(creator.publicKey);
    await scoreAll(task, [500, 0]);
    await settle(task);
    assert.equal(await balance(creator.publicKey), before + 100 * USDC);
    const view = (await fetchTask(program, task))!;
    assert.equal(view.status, "settled");
    assert.equal(view.podium.length, 0);
  });

  it("gates high-value tasks on reputation", async () => {
    const task = await createTask({ minRating: 100 });
    await expectFail(submit(task, workers[2], "nope"), "Reputation rating too low");
    await submit(task, workers[1], "veteran entry"); // rating 141 from the first task
  });

  it("lets the creator cancel an empty task for a full refund", async () => {
    const before = await balance(creator.publicKey);
    const task = await createTask();
    const view = (await fetchTask(program, task))!;
    await sendIxs(connection, keypairSigner(creator), [
      await buildCancel(program, creator.publicKey, view),
    ]);
    assert.equal(await balance(creator.publicKey), before);
    assert.equal((await fetchTask(program, task))!.status, "cancelled");
  });
});
