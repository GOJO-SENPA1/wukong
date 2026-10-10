// One command for the whole local demo:
//   npm run demo
// Starts a fresh local validator (program preloaded), sets up USDC + config,
// seeds history, then runs the web app. Ctrl-C stops everything.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RPC = "http://127.0.0.1:8899";
const DATA = path.join(process.cwd(), ".data");
let validator: ChildProcess | null = null;

async function rpcUp(): Promise<boolean> {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
    });
    return (await res.json()).result === "ok";
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) {
    stop();
    process.exit(r.status ?? 1);
  }
}

function stop() {
  if (validator && !validator.killed) validator.kill("SIGINT");
}

async function main() {
  let fresh = false;
  if (!(await rpcUp())) {
    console.log("🐒 starting a fresh local validator (logs: .anchor/validator.log)…");
    fs.mkdirSync(".anchor", { recursive: true });
    const log = fs.openSync(".anchor/validator.log", "w");
    validator = spawn("bash", ["scripts/validator.sh"], { stdio: ["ignore", log, log] });
    for (let i = 0; i < 60 && !(await rpcUp()); i++) await new Promise((r) => setTimeout(r, 1000));
    if (!(await rpcUp())) throw new Error("validator did not start; see .anchor/validator.log");
    // New chain: forget off-chain state from any previous chain.
    for (const f of ["store.json", "deployment.json"]) fs.rmSync(path.join(DATA, f), { force: true });
    fresh = true;
  } else {
    console.log("🐒 using the validator already running on :8899");
  }

  run("npx", ["tsx", "scripts/setup.ts", "--cluster", "localnet"]);
  if (fresh || process.argv.includes("--seed")) run("npx", ["tsx", "scripts/seed.ts"]);

  const web = spawn("npx", ["next", "dev", "-p", process.env.PORT ?? "3000"], { stdio: "inherit" });
  const shutdown = () => {
    web.kill("SIGINT");
    stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  web.on("exit", shutdown);
}

main().catch((err) => {
  console.error(`❌ ${err.message ?? err}`);
  stop();
  process.exit(1);
});
