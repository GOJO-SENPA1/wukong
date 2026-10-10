// Turn a local setup (.data/) into environment variables for a hosted deploy.
//   npm run export:env                → writes .data/deploy.env (gitignored)
//   fly secrets import < .data/deploy.env
// The admin key is included because the demo faucet mints demo USDC with
// it; pass --no-admin for a production deploy without the faucet.
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), ".data");
const withAdmin = !process.argv.includes("--no-admin");
const read = (f: string) => fs.readFileSync(path.join(DATA, f), "utf8").trim();

const deployment = JSON.parse(read("deployment.json"));
const lines = [
  `WUKONG_DEPLOYMENT=${JSON.stringify(deployment)}`,
  `WUKONG_JUDGE_SECRET=${JSON.stringify(JSON.parse(read("keys/judge.json")))}`,
  `WUKONG_GATEWAY_SECRET=${JSON.stringify(JSON.parse(read("keys/gateway.json")))}`,
];
if (withAdmin) lines.push(`WUKONG_ADMIN_SECRET=${JSON.stringify(JSON.parse(read("keys/admin.json")))}`);

const out = path.join(DATA, "deploy.env");
fs.writeFileSync(out, lines.join("\n") + "\n", { mode: 0o600 });
console.log(`Wrote ${path.relative(process.cwd(), out)} (${lines.length} secrets, ${deployment.cluster}).`);
console.log("These are private keys: import them as secrets, never commit or paste them in chat.");
