// Headless end-to-end run of the hero demo through the public HTTP API, the
// same path the browser takes: server builds tx → local key signs → relay.
//   npm run demo:e2e        (app must be running on :3000)
import assert from "node:assert/strict";
import { Keypair, Transaction } from "@solana/web3.js";
import { templateById } from "../src/lib/demo";

const BASE = process.env.WUKONG_URL ?? "http://localhost:3000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${data.error ?? res.status}`);
  return data as T;
}

async function events(path: string, body: unknown): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.text())
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function act(kp: Keypair, action: Record<string, unknown>) {
  const built = await post<{ tx: string; task?: string; label: string }>("/api/tx/build", {
    ...action,
    signer: kp.publicKey.toBase58(),
  });
  const tx = Transaction.from(Buffer.from(built.tx, "base64"));
  tx.partialSign(kp);
  const kind = { create_task: "create", submit: "submit", close: "close", settle_pick: "settle", cancel: "cancel" }[
    action.kind as string
  ];
  const { sig } = await post<{ sig: string }>("/api/tx/send", {
    tx: tx.serialize().toString("base64"),
    task: built.task,
    kind,
    label: built.label,
  });
  return { sig, task: built.task };
}

async function main() {
  const t = templateById("cold-brew-tagline")!;
  const company = Keypair.generate();
  const worker = Keypair.generate();
  await post("/api/faucet", { address: company.publicKey.toBase58(), role: "company" });
  await post("/api/faucet", { address: worker.publicKey.toBase58(), role: "worker" });
  console.log("✓ personas funded");

  const { hash } = await post<{ hash: string }>("/api/briefs", {
    title: t.title,
    category: t.category,
    brief: t.brief,
    creatorName: "E2E Coffee Co",
    template: t.id,
  });
  const { task } = await act(company, {
    kind: "create_task",
    title: t.title,
    category: t.category,
    briefHash: hash,
    rewardUsdc: t.rewardUsdc,
    hours: 1,
    payoutMode: t.payoutMode,
    judgeMode: t.judgeMode,
    minRating: 0,
    maxSubmissions: 32,
  });
  assert.ok(task);
  console.log(`✓ task posted + escrowed: ${task}`);

  const sub = await post<{ hash: string }>("/api/submissions", {
    task,
    worker: worker.publicKey.toBase58(),
    content: t.sample,
    workerName: "E2E Worker",
  });
  await act(worker, { kind: "submit", task, contentHash: sub.hash });
  console.log("✓ human worker submitted");

  const sealed = await (await fetch(`${BASE}/api/tasks/${task}`)).json();
  assert.equal(sealed.submissions[0].content, undefined, "entries are sealed while open");

  const crowd = await events("/api/crowd", { task, pace: 0 });
  const submitted = crowd.filter((e) => e.type === "submitted").length;
  console.log(`✓ crowd submitted ${submitted} entries`);

  const judge = await events("/api/judge", { task });
  const err = judge.find((e) => e.type === "error");
  if (err) throw new Error(`judge: ${err.message}`);
  const flags = judge.filter((e) => e.type === "signal").map((e) => `${(e.index as number) + 1}:${e.flag}`);
  console.log(`✓ judge flagged ${flags.join(", ")}`);
  const settled = judge.find((e) => e.type === "settled") as { payouts: { worker: string; amount: number; place: number }[] };
  assert.ok(settled, "settled event");
  console.log(`✓ settled: ${settled.payouts.map((p) => `#${p.place} ${(p.amount / 1e6).toFixed(2)}`).join(", ")} USDC`);

  const view = await (await fetch(`${BASE}/api/tasks/${task}`)).json();
  assert.equal(view.task.status, "settled");
  const byFlag = (flag: string) => view.submissions.find((s: { report?: { report: { flags: string[] } } }) => s.report?.report.flags.includes(flag));
  assert.equal(byFlag("prompt_injection")?.score, 0, "injection scored 0");
  assert.ok(byFlag("duplicate")?.score <= 1000, "copycat capped at 10");
  assert.ok(view.submissions.every((s: { scored: boolean }) => s.scored), "all scored on-chain");
  const paid = view.submissions.filter((s: { rank: number }) => s.rank > 0).reduce((a: number, s: { payout: number }) => a + s.payout, 0);
  assert.equal(paid + view.task.feePaid, t.rewardUsdc * 1e6, "escrow fully distributed");
  console.log("\n✅ E2E passed: post → escrow → submit → crowd → judge → on-chain scores → payout\n");
}

main().catch((err) => {
  console.error(`\n❌ ${err.message ?? err}\n`);
  process.exit(1);
});
