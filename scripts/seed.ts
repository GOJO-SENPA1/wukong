// Seed the arena with a believable history: a couple of settled tasks (so
// workers have on-chain reputation), an open task full of entries, and a
// reputation-gated task. The hero task is left for the live demo.
//   npm run seed            (add --hero to also pre-create the cold-brew task)
import { TEMPLATES, type TaskTemplate } from "../src/lib/demo";
import { sha256Hex } from "../src/lib/hash";
import { buildCreateTask, keypairSigner, sendIxs } from "../src/lib/wukong";
import { connection, loadOrCreateKey, mint, program } from "../src/lib/server/env";
import { fund } from "../src/lib/server/faucet";
import { store } from "../src/lib/server/store";
import { summonCrowd } from "../src/lib/server/crowd";
import { judgeTask } from "../src/lib/server/judge";

const withHero = process.argv.includes("--hero");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function postTask(t: TaskTemplate): Promise<string> {
  const creator = loadOrCreateKey(`creators/${slug(t.creatorName)}`);
  await fund(creator.publicKey.toBase58(), { sol: 2, usdc: t.rewardUsdc * 3, minSol: 0.5 });
  store.setName(creator.publicKey.toBase58(), t.creatorName);
  const hash = sha256Hex(t.brief);
  if (!store.brief(hash)) store.putBrief({
    hash,
    title: t.title,
    category: t.category,
    brief: t.brief,
    createdAt: Date.now(),
    origin: "seed",
    creatorName: t.creatorName,
    template: t.id,
  });
  const { ixs, task } = await buildCreateTask(program(), creator.publicKey, mint(), {
    title: t.title,
    category: t.category,
    briefHashHex: hash,
    reward: t.rewardUsdc * 1_000_000,
    deadline: Math.floor(Date.now() / 1000) + t.hours * 3600,
    payoutMode: t.payoutMode,
    judgeMode: t.judgeMode,
    minRating: t.minRating,
    maxSubmissions: 32,
  });
  const sig = await sendIxs(connection(), keypairSigner(creator), ixs);
  store.setTaskMeta(task.toBase58(), { origin: "seed", creatorName: t.creatorName, template: t.id });
  store.addTx(task.toBase58(), { sig, kind: "create", label: `Task posted, ${t.rewardUsdc} USDC locked`, at: Date.now() });
  console.log(`  📌 ${t.title} → ${task.toBase58()}`);
  return task.toBase58();
}

async function crowd(task: string) {
  for await (const e of summonCrowd(task, 0)) {
    if (e.type === "submitted") console.log(`     ✍️  ${e.name} (${e.city}): ${e.preview}`);
    if (e.type === "skipped") console.log(`     ⏭  ${e.name}: ${e.reason}`);
    if (e.type === "error") throw new Error(e.message);
  }
}

async function judge(task: string) {
  for await (const e of judgeTask(task)) {
    if (e.type === "start") console.log(`     ⚖️  judging ${e.count} entries with ${e.engine} (${e.model})`);
    if (e.type === "signal") console.log(`     🚩 #${e.index + 1} ${e.flag}: ${e.detail}`);
    if (e.type === "scored") console.log(`     📊 #${e.index + 1} → ${(e.score / 100).toFixed(1)}`);
    if (e.type === "settled") {
      for (const p of e.payouts) console.log(`     💸 place ${p.place}: ${(p.amount / 1e6).toFixed(2)} USDC → ${p.worker.slice(0, 6)}…`);
    }
    if (e.type === "error") throw new Error(e.message);
  }
}

async function main() {
  console.log("\n🐒 Seeding the arena\n");
  const byId = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

  for (const id of ["slugify-ts", "review-sentiment"]) {
    const task = await postTask(byId[id]);
    await crowd(task);
    await judge(task);
  }
  const open = await postTask(byId["homestay-nepali"]);
  await crowd(open);
  await postTask(byId["x402-explainer"]);
  if (withHero) {
    await postTask(byId["cold-brew-tagline"]);
  }
  console.log("\n✅ Seeded. Start the app with `npm run dev`\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message ?? err}\n`);
  process.exit(1);
});

