// An autonomous AI agent buys human judgment on Wukong with x402.
//   npm run agent                 post a task, pay via x402, print the arena link
//   npm run agent -- --auto       also summon the crowd + run the judge, then
//                                 print the winning work the agent paid for
// Talks to the app only over HTTP, like any external agent would.
import fs from "node:fs";
import path from "node:path";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TEMPLATES } from "../src/lib/demo";

const BASE = process.env.WUKONG_URL ?? "http://localhost:3000";
const auto = process.argv.includes("--auto");
const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  gold: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  violet: (s: string) => `\x1b[35m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};
const say = (who: string, msg: string) => console.log(`${who} ${msg}`);
const AGENT = c.cyan("🤖 agent ");
const SERVER = c.gold("🐒 wukong");

function agentKey(): Keypair {
  const file = path.join(process.cwd(), ".data/keys/agent.json");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(Array.from(Keypair.generate().secretKey)));
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { status: res.status, headers: res.headers, json: await res.json().catch(() => ({})) };
}

async function stream(url: string, body: unknown, onEvent: (e: Record<string, unknown>) => void) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  for (const line of text.split("\n")) if (line.trim()) onEvent(JSON.parse(line));
}

async function main() {
  const agent = agentKey();
  const state = await (await fetch(`${BASE}/api/state`)).json();
  if (!state.ready) throw new Error(state.error ?? "Wukong is not ready");
  const conn = new Connection(state.deployment.rpcUrl, "confirmed");

  console.log(`\n${c.bold("x402 agent buyer")} ${c.dim(`· ${agent.publicKey.toBase58()}`)}\n`);
  say(AGENT, "I'm localizing a travel app for Nepal and need a human-quality Nepali translation.");
  say(AGENT, c.dim("Topping up my demo wallet from the faucet…"));
  await post(`${BASE}/api/faucet`, { address: agent.publicKey.toBase58(), role: "company" });

  const t = TEMPLATES.find((x) => x.id === "homestay-nepali")!;
  const spec = {
    title: "Nepali welcome note for homestay app",
    brief: t.brief,
    category: t.category,
    rewardUsdc: 25,
    hours: 12,
    payoutMode: "winnerTakesAll",
    agentName: "TrekBot (travel agent AI)",
    template: t.id,
  };

  say(AGENT, `POST ${c.dim(`${BASE}/api/x402/tasks`)} ${c.dim("(no payment)")}`);
  const first = await post(`${BASE}/api/x402/tasks`, spec);
  if (first.status !== 402) throw new Error(`Expected 402, got ${first.status}: ${JSON.stringify(first.json)}`);
  const reqs = first.json.accepts[0];
  say(SERVER, `${c.bold("402 Payment Required")}: ${reqs.description}`);
  console.log(c.dim(`           scheme=${reqs.scheme} network=${reqs.network} amount=${reqs.maxAmountRequired} asset=${reqs.asset.slice(0, 8)}… payTo=${reqs.payTo.slice(0, 8)}…`));

  // Build the x402 "exact" payment: one TransferChecked, facilitator pays the fee.
  const mint = new PublicKey(reqs.asset);
  const feePayer = new PublicKey(reqs.extra.feePayer);
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
      createTransferCheckedInstruction(
        getAssociatedTokenAddressSync(mint, agent.publicKey),
        mint,
        getAssociatedTokenAddressSync(mint, new PublicKey(reqs.payTo), true),
        agent.publicKey,
        BigInt(reqs.maxAmountRequired),
        reqs.extra.decimals,
      ),
    ],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign([agent]);
  const payment = Buffer.from(
    JSON.stringify({
      x402Version: 1,
      scheme: "exact",
      network: reqs.network,
      payload: { transaction: Buffer.from(tx.serialize()).toString("base64") },
    }),
  ).toString("base64");

  say(AGENT, `Signed a ${Number(reqs.maxAmountRequired) / 1e6} USDC transfer. Retrying with ${c.bold("X-PAYMENT")}…`);
  const paid = await post(`${BASE}/api/x402/tasks`, spec, { "X-PAYMENT": payment });
  if (paid.status !== 201) throw new Error(`Payment rejected (${paid.status}): ${JSON.stringify(paid.json)}`);
  const receipt = JSON.parse(Buffer.from(paid.headers.get("x-payment-response") ?? "", "base64").toString() || "{}");
  say(SERVER, `${c.green("201 Created")} · payment settled ${c.dim(receipt.transaction?.slice(0, 16) + "…")}`);
  say(SERVER, `Escrow locked on-chain ${c.dim(paid.json.escrowTx.slice(0, 16) + "…")}`);
  say(SERVER, `Task is live: ${c.bold(paid.json.arena)}`);

  if (!auto) {
    console.log(`\n${c.dim("Humans now compete in the arena. Poll")} ${paid.json.status}\n`);
    return;
  }

  console.log();
  say(AGENT, c.dim("(--auto) Summoning the crowd and running the judge so the demo completes…"));
  await stream(`${BASE}/api/crowd`, { task: paid.json.task, pace: 150 }, (e) => {
    if (e.type === "submitted") say(c.dim("   👥"), `${e.name} (${e.city}) submitted`);
  });
  await stream(`${BASE}/api/judge`, { task: paid.json.task }, (e) => {
    if (e.type === "signal") say(c.violet("   ⚖️ "), `#${(e.index as number) + 1} flagged ${e.flag}: ${e.detail}`);
    if (e.type === "scored") say(c.violet("   ⚖️ "), `#${(e.index as number) + 1} → ${((e.score as number) / 100).toFixed(1)}`);
    if (e.type === "error") throw new Error(String(e.message));
  });

  const status = await (await fetch(paid.json.status)).json();
  const best = status.result?.winners?.[0];
  console.log();
  if (best) {
    say(AGENT, `${c.green("Got my result.")} Winner scored ${best.score} and was paid ${best.payoutUsdc} USDC:`);
    console.log(`\n${c.bold(best.content)}\n`);
    say(AGENT, c.dim(`Judge: ${best.judge}`));
  } else {
    say(AGENT, "Nothing cleared the quality bar; my USDC was refunded.");
  }
  console.log();
}

main().catch((err) => {
  console.error(`\n❌ ${err.message ?? err}\n`);
  process.exit(1);
});
