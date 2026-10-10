// Give the demo faucet its own key, so the admin key (program upgrade + config
// authority + mint authority) never has to live on the web host.
//   npx tsx scripts/faucet-key.ts [--sol 2]
// Creates .data/keys/faucet.json if needed, sends it SOL from the admin wallet,
// and makes it the demo USDC mint's authority. Then `npm run export:env` writes
// WUKONG_FAUCET_SECRET instead of WUKONG_ADMIN_SECRET.
import fs from "node:fs";
import path from "node:path";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { AuthorityType, createSetAuthorityInstruction, getMint } from "@solana/spl-token";
import { keypairSigner, sendIxs } from "../src/lib/wukong";
import { connection, deployment, KEYS_DIR, loadKey, mint } from "../src/lib/server/env";

const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  const dep = deployment();
  if (dep.cluster === "mainnet-beta") throw new Error("No faucet on mainnet");
  const conn = connection();
  const admin = loadKey("admin");
  const file = path.join(KEYS_DIR, "faucet.json");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(Array.from(Keypair.generate().secretKey)), { mode: 0o600 });
  }
  const faucet = loadKey("faucet");
  console.log(`faucet ${faucet.publicKey.toBase58()}`);

  const ixs = [];
  const sol = Number(arg("sol") ?? (dep.cluster === "localnet" ? 50 : 2));
  if ((await conn.getBalance(faucet.publicKey)) < (sol / 2) * LAMPORTS_PER_SOL) {
    ixs.push(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: faucet.publicKey, lamports: Math.round(sol * LAMPORTS_PER_SOL) }));
  }
  const m = await getMint(conn, mint());
  if (m.mintAuthority?.equals(admin.publicKey)) {
    ixs.push(createSetAuthorityInstruction(mint(), admin.publicKey, AuthorityType.MintTokens, faucet.publicKey));
  } else if (!m.mintAuthority?.equals(faucet.publicKey)) {
    throw new Error(`The mint's authority is ${m.mintAuthority?.toBase58() ?? "none"}, not the admin: can't hand it to the faucet`);
  }
  if (ixs.length) await sendIxs(conn, keypairSigner(admin), ixs);
  console.log(`✅ faucet funded and holds the demo mint authority. Now: npm run export:env (it uses the faucet key, not the admin).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
