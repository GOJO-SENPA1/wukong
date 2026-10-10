// "Summon the crowd": simulated workers flood a task with real, signed,
// on-chain submissions. Each worker is its own keypair with its own
// reputation account, exactly like a human worker.

import { PublicKey } from "@solana/web3.js";
import { templateById, type CrowdEntry } from "../demo";
import { sha256Hex } from "../hash";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { buildSubmitForTask, explainError, fetchTask, keypairSigner, pda, sendIxs } from "../wukong";
import { connection, loadOrDeriveKey, program } from "./env";
import { ensureGas, fund } from "./faucet";
import { store } from "./store";

export type CrowdEvent =
  | { type: "start"; count: number }
  | { type: "submitted"; name: string; city: string; worker: string; sig: string; preview: string }
  | { type: "skipped"; name: string; reason: string }
  | { type: "done"; submitted: number }
  | { type: "error"; message: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export async function* summonCrowd(taskKey: string, pace = 700): AsyncGenerator<CrowdEvent> {
  try {
    const prog = program();
    const conn = connection();
    const taskPk = new PublicKey(taskKey);
    const task = await fetchTask(prog, taskPk);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("Task is not open for submissions");
    const brief = await store.brief(task.briefHash);
    const template = templateById(brief?.template) ?? templateByTitle(task.title);
    const crowd: CrowdEntry[] = template?.crowd ?? [];
    if (!crowd.length) {
      throw new Error("No simulated crowd is scripted for this task. Use a demo template, or submit as a worker persona.");
    }
    yield { type: "start", count: crowd.length };

    let submitted = 0;
    for (const entry of crowd) {
      const kp = loadOrDeriveKey(`bots/${slug(entry.name)}`);
      const existing = await conn.getAccountInfo(pda.submission(taskPk, kp.publicKey));
      if (existing) {
        yield { type: "skipped", name: entry.name, reason: "already submitted" };
        continue;
      }
      try {
        await ensureGas(kp.publicKey);
        if (task.entryStake > 0) {
          // Simulated workers stake real (demo) USDC like everyone else.
          const ata = getAssociatedTokenAddressSync(new PublicKey(task.mint), kp.publicKey, true);
          const have = await getAccount(conn, ata).then((a) => Number(a.amount)).catch(() => 0);
          if (have < task.entryStake) await fund(kp.publicKey.toBase58(), { usdc: task.entryStake / 1e6 });
        }
        const hash = sha256Hex(entry.content);
        await store.putSubmission({
          hash,
          content: entry.content,
          worker: kp.publicKey.toBase58(),
          workerName: `${entry.name} · ${entry.city}`,
          task: taskKey,
          createdAt: Date.now(),
        });
        await store.setName(kp.publicKey.toBase58(), `${entry.name} · ${entry.city}`);
        const ix = await buildSubmitForTask(prog, kp.publicKey, task, hash);
        const sig = await sendIxs(conn, keypairSigner(kp), [ix]);
        await store.addTx(taskKey, { sig, kind: "submit", label: `${entry.name} submitted`, at: Date.now() });
        submitted++;
        yield {
          type: "submitted",
          name: entry.name,
          city: entry.city,
          worker: kp.publicKey.toBase58(),
          sig,
          preview: entry.content.split("\n")[0].slice(0, 80),
        };
      } catch (err) {
        yield { type: "skipped", name: entry.name, reason: explainError(err) };
      }
      await sleep(pace);
    }
    yield { type: "done", submitted };
  } catch (err) {
    yield { type: "error", message: explainError(err) };
  }
}

function templateByTitle(title: string) {
  // Tasks posted via x402 or the API carry no template id; match on title.
  return [templateById("cold-brew-tagline"), templateById("homestay-nepali"), templateById("slugify-ts"), templateById("review-sentiment")]
    .filter(Boolean)
    .find((t) => t!.title === title);
}
