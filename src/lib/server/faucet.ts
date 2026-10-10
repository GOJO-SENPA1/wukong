// Demo faucet: gas + demo USDC for burner personas and simulated workers.
// On localnet SOL comes from airdrops; on devnet from the admin wallet.

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { keypairSigner, sendIxs } from "../wukong";
import { connection, deployment, loadKey, mint } from "./env";

const recent = new Map<string, number>();

export async function fund(
  address: string,
  opts: { sol?: number; usdc?: number; minSol?: number } = {},
): Promise<{ sol: number; usdc: number; sig?: string }> {
  const to = new PublicKey(address);
  const conn = connection();
  const dep = deployment();
  const admin = loadKey("admin");
  const wantSol = opts.sol ?? 0;
  const wantUsdc = opts.usdc ?? 0;

  const last = recent.get(address) ?? 0;
  if (Date.now() - last < 3_000) throw new Error("Slow down: faucet is rate limited");
  recent.set(address, Date.now());

  const ixs: TransactionInstruction[] = [];
  let solSent = 0;
  if (wantSol > 0) {
    const balance = await conn.getBalance(to);
    const floor = (opts.minSol ?? wantSol / 2) * LAMPORTS_PER_SOL;
    if (balance < floor) {
      const lamports = Math.round(wantSol * LAMPORTS_PER_SOL);
      if (dep.cluster === "localnet") {
        const sig = await conn.requestAirdrop(to, lamports);
        const bh = await conn.getLatestBlockhash();
        await conn.confirmTransaction({ signature: sig, ...bh }, "confirmed");
      } else {
        ixs.push(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: to, lamports }));
      }
      solSent = wantSol;
    }
  }
  if (wantUsdc > 0) {
    const m = mint();
    const ata = getAssociatedTokenAddressSync(m, to, true);
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, ata, to, m),
      createMintToInstruction(m, ata, admin.publicKey, Math.round(wantUsdc * 1_000_000)),
    );
  }
  let sig: string | undefined;
  if (ixs.length) sig = await sendIxs(conn, keypairSigner(admin), ixs);
  return { sol: solSent, usdc: wantUsdc, sig };
}

export async function ensureGas(address: PublicKey, minSol = 0.02) {
  const balance = await connection().getBalance(address);
  if (balance < minSol * LAMPORTS_PER_SOL) {
    recent.delete(address.toBase58());
    await fund(address.toBase58(), { sol: deployment().cluster === "localnet" ? 2 : 0.04, minSol });
  }
}
