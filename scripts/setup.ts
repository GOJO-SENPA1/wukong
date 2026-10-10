// One-shot environment setup for localnet or devnet.
//   npm run setup:localnet       (validator must be running: npm run validator)
//   npm run setup:devnet         (deploys with ~/.config/solana/id.json if needed)
// Options: --rpc <url>  --admin <keypair.json>  --fee-bps <n>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import idl from "../src/lib/idl/wukong.json";
import { fetchConfig, getProgram, keypairSigner, pda, sendIxs } from "../src/lib/wukong";

const args = process.argv.slice(2);
const arg = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const cluster = (arg("cluster", "localnet") as "localnet" | "devnet");
const rpcUrl =
  arg("rpc") ??
  process.env.SOLANA_RPC_URL ??
  (cluster === "localnet" ? "http://127.0.0.1:8899" : "https://api.devnet.solana.com");
const feeBps = Number(arg("fee-bps", "1000"));
const DATA = path.join(process.cwd(), ".data");
const KEYS = path.join(DATA, "keys");
const PROGRAM_ID = new PublicKey(idl.address);

const log = (msg: string) => console.log(`  ${msg}`);

function keyFile(role: string, fromPath?: string): Keypair {
  fs.mkdirSync(KEYS, { recursive: true });
  const file = path.join(KEYS, `${role}.json`);
  if (fromPath) {
    fs.copyFileSync(fromPath, file);
  } else if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(Array.from(Keypair.generate().secretKey)));
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
}

async function airdrop(conn: Connection, to: PublicKey, sol: number) {
  const sig = await conn.requestAirdrop(to, sol * LAMPORTS_PER_SOL);
  const bh = await conn.getLatestBlockhash();
  await conn.confirmTransaction({ signature: sig, ...bh }, "confirmed");
}

async function topUp(conn: Connection, admin: Keypair, to: PublicKey, sol: number) {
  const balance = await conn.getBalance(to);
  if (balance >= (sol / 2) * LAMPORTS_PER_SOL) return;
  if (cluster === "localnet") return airdrop(conn, to, sol);
  await sendIxs(conn, keypairSigner(admin), [
    SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: to, lamports: sol * LAMPORTS_PER_SOL }),
  ]);
}

async function main() {
  console.log(`\n🐒 Wukong setup → ${cluster} (${rpcUrl})\n`);
  const conn = new Connection(rpcUrl, "confirmed");
  await conn.getVersion().catch(() => {
    throw new Error(
      cluster === "localnet"
        ? "Local validator not reachable. Start it with `npm run validator` in another terminal."
        : `RPC ${rpcUrl} not reachable.`,
    );
  });

  const defaultWallet = path.join(os.homedir(), ".config/solana/id.json");
  const adminPath = arg("admin") ?? (cluster === "devnet" ? defaultWallet : undefined);
  const admin = keyFile("admin", adminPath);
  const judge = keyFile("judge");
  const treasury = keyFile("treasury");
  const gateway = keyFile("gateway");
  log(`admin     ${admin.publicKey.toBase58()}`);
  log(`judge     ${judge.publicKey.toBase58()}`);
  log(`treasury  ${treasury.publicKey.toBase58()}`);
  log(`gateway   ${gateway.publicKey.toBase58()} (x402 agent gateway)`);

  if (cluster === "localnet") {
    await airdrop(conn, admin.publicKey, 100);
  } else {
    const bal = (await conn.getBalance(admin.publicKey)) / LAMPORTS_PER_SOL;
    log(`admin balance ${bal.toFixed(3)} SOL`);
    if (bal < 0.5) {
      throw new Error(
        `Admin wallet needs devnet SOL. Get some at https://faucet.solana.com for ${admin.publicKey.toBase58()}`,
      );
    }
  }

  // Program
  const programInfo = await conn.getAccountInfo(PROGRAM_ID);
  if (!programInfo?.executable) {
    if (cluster === "localnet") {
      throw new Error("Program not loaded. Restart the validator with `npm run validator` (it preloads target/deploy/wukong.so).");
    }
    if (!fs.existsSync("target/deploy/wukong-keypair.json")) {
      throw new Error(
        "No program keypair. Run `anchor keys sync && npm run program:build` to create your own program id, then rerun.",
      );
    }
    log("deploying program (this takes a minute)…");
    execFileSync(
      "solana",
      [
        "program",
        "deploy",
        "target/deploy/wukong.so",
        "--program-id",
        "target/deploy/wukong-keypair.json",
        "--keypair",
        path.join(KEYS, "admin.json"),
        "--url",
        rpcUrl,
      ],
      { stdio: "inherit" },
    );
  }
  log(`program   ${PROGRAM_ID.toBase58()} ✓`);

  await Promise.all([judge, gateway].map((k) => topUp(conn, admin, k.publicKey, cluster === "localnet" ? 10 : 0.3)));
  await topUp(conn, admin, treasury.publicKey, cluster === "localnet" ? 1 : 0.02);

  const program = getProgram(conn);
  let config = await fetchConfig(program);
  let mint: PublicKey;
  if (config) {
    mint = new PublicKey(config.mint);
    log(`config    exists (mint ${config.mint})`);
    if (config.admin !== admin.publicKey.toBase58()) {
      log("⚠️  config admin is a different key; leaving judge/treasury unchanged");
    } else if (config.judge !== judge.publicKey.toBase58() || config.treasury !== treasury.publicKey.toBase58()) {
      const ix = await program.methods
        .updateConfig(judge.publicKey, treasury.publicKey, feeBps)
        .accountsPartial({ admin: admin.publicKey, config: pda.config() })
        .instruction();
      await sendIxs(conn, keypairSigner(admin), [ix]);
      log("config    judge/treasury rotated to local keys");
    }
  } else {
    mint = await createMint(conn, admin, admin.publicKey, null, 6);
    log(`mint      ${mint.toBase58()} (demo USDC, 6 decimals, admin is mint authority)`);
    const ix = await program.methods
      .initializeConfig(judge.publicKey, treasury.publicKey, feeBps)
      .accountsPartial({ admin: admin.publicKey, config: pda.config(), mint })
      .instruction();
    await sendIxs(conn, keypairSigner(admin), [ix]);
    log(`config    initialized (fee ${feeBps / 100}%)`);
  }
  const mintInfo = await getMint(conn, mint);
  if (!mintInfo.mintAuthority?.equals(admin.publicKey)) {
    log("⚠️  admin is not the mint authority: the demo faucet can't mint USDC on this deployment");
  }
  config = await fetchConfig(program);

  // Token accounts the protocol pays into must exist up front (x402 payments
  // land in the gateway's; fees in the treasury's).
  await sendIxs(
    conn,
    keypairSigner(admin),
    [gateway.publicKey, treasury.publicKey].map((owner) =>
      createAssociatedTokenAccountIdempotentInstruction(
        admin.publicKey,
        getAssociatedTokenAddressSync(mint, owner, true),
        owner,
        mint,
      ),
    ),
  );
  log("token accounts for gateway + treasury ✓");

  const deployment = {
    cluster,
    rpcUrl,
    programId: PROGRAM_ID.toBase58(),
    mint: mint.toBase58(),
    admin: admin.publicKey.toBase58(),
    judge: config!.judge,
    treasury: config!.treasury,
    gateway: gateway.publicKey.toBase58(),
  };
  fs.writeFileSync(path.join(DATA, "deployment.json"), JSON.stringify(deployment, null, 2));
  console.log(`\n✅ Wrote .data/deployment.json. Next: npm run seed && npm run dev\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message ?? err}\n`);
  process.exit(1);
});
