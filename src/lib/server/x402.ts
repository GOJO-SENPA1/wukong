// x402 "exact" scheme on Solana, self-facilitated. An AI agent asks to post a
// task, gets 402 Payment Required with the price, pays with a partially
// signed USDC transfer in the X-PAYMENT header, and the gateway (fee payer +
// facilitator) verifies, co-signs, settles, then escrows the task on-chain.

import {
  ComputeBudgetProgram,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { connection, deployment, loadKey } from "./env";
import { kv } from "./kv";

export const X402_VERSION = 1;

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: { feePayer: string; decimals: number; name: string };
}

export function network(): string {
  const c = deployment().cluster;
  return c === "mainnet-beta" ? "solana" : `solana-${c}`;
}

export function requirements(resource: string, amountBase: number, description: string): PaymentRequirements {
  const dep = deployment();
  return {
    scheme: "exact",
    network: network(),
    maxAmountRequired: String(amountBase),
    resource,
    description,
    mimeType: "application/json",
    payTo: dep.gateway,
    maxTimeoutSeconds: 120,
    asset: dep.mint,
    extra: { feePayer: dep.gateway, decimals: 6, name: "USDC" },
  };
}

export function paymentRequired(req: PaymentRequirements, error = "X-PAYMENT header is required") {
  return Response.json({ x402Version: X402_VERSION, error, accepts: [req] }, { status: 402 });
}

interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: { transaction: string };
}

export function decodePayment(header: string): PaymentPayload {
  const json = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  if (json?.x402Version !== X402_VERSION || json?.scheme !== "exact" || typeof json?.payload?.transaction !== "string") {
    throw new Error("Malformed X-PAYMENT payload");
  }
  return json as PaymentPayload;
}

export function encodePaymentResponse(r: { success: boolean; transaction: string; network: string; payer: string }) {
  return Buffer.from(JSON.stringify(r)).toString("base64");
}

const TRANSFER_CHECKED = 12;
// The facilitator pays the fee, so the payment must be as cheap as possible to
// include: a compute limit is required and capped, the priority fee is capped,
// and nothing but compute-budget settings and one USDC transfer is allowed.
const MAX_MICRO_LAMPORTS = BigInt(100_000);
const MAX_COMPUTE_UNITS = 200_000;
const ALLOWED_PROGRAMS = new Set([ComputeBudgetProgram.programId.toBase58(), TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()]);

/** Verify the payment transaction matches the requirements, co-sign as fee payer, submit. */
export async function verifyAndSettle(
  payment: PaymentPayload,
  req: PaymentRequirements,
): Promise<{ sig: string; payer: string }> {
  if (payment.network !== req.network) throw new Error(`Wrong network: expected ${req.network}`);
  const tx = VersionedTransaction.deserialize(Buffer.from(payment.payload.transaction, "base64"));
  const msg = tx.message;
  const keys = msg.staticAccountKeys;
  const gateway = loadKey("gateway");
  if (!keys[0].equals(gateway.publicKey)) throw new Error("Fee payer must be the facilitator in extra.feePayer");
  // Exactly two signers (facilitator + payer): every extra signature is a fee the facilitator pays.
  if (msg.header.numRequiredSignatures !== 2) throw new Error("Expected exactly two signers: the facilitator and the payer");
  if (msg.addressTableLookups.length > 0) throw new Error("Address lookup tables are not accepted");
  let computeLimit: number | null = null;

  const mint = new PublicKey(req.asset);
  const expectedDest = getAssociatedTokenAddressSync(mint, new PublicKey(req.payTo), true);
  let transfer: { amount: bigint; payer: PublicKey } | null = null;

  for (const ix of msg.compiledInstructions) {
    const programId = keys[ix.programIdIndex];
    if (!ALLOWED_PROGRAMS.has(programId.toBase58())) throw new Error(`Instruction to ${programId.toBase58()} not allowed`);
    // The facilitator only pays the base fee. Its key may not appear in any
    // instruction (no rent funding, no transfers), and priority fees are capped.
    if (ix.accountKeyIndexes.some((i) => keys[i].equals(gateway.publicKey))) {
      throw new Error("Facilitator account may not be used by payment instructions");
    }
    if (programId.equals(ComputeBudgetProgram.programId)) {
      const data = Buffer.from(ix.data);
      if (data[0] === 2) {
        computeLimit = data.readUInt32LE(1);
        if (computeLimit > MAX_COMPUTE_UNITS) throw new Error("Compute limit too high");
      } else if (data[0] === 3) {
        if (data.readBigUInt64LE(1) > MAX_MICRO_LAMPORTS) throw new Error("Priority fee too high");
      } else throw new Error("Only compute unit limit and price instructions are allowed");
      continue;
    }
    const isToken = programId.equals(TOKEN_PROGRAM_ID) || programId.equals(TOKEN_2022_PROGRAM_ID);
    if (!isToken) continue;
    const data = Buffer.from(ix.data);
    if (data[0] !== TRANSFER_CHECKED) throw new Error("Only TransferChecked is allowed");
    if (transfer) throw new Error("Exactly one transfer expected");
    const [source, mintKey, dest, authority] = ix.accountKeyIndexes.map((i) => keys[i]);
    if (!mintKey.equals(mint)) throw new Error("Wrong asset");
    if (!dest.equals(expectedDest)) throw new Error("Transfer must go to payTo's token account");
    if (source.equals(getAssociatedTokenAddressSync(mint, gateway.publicKey, true))) {
      throw new Error("Facilitator funds cannot be used to pay");
    }
    transfer = { amount: data.readBigUInt64LE(1), payer: authority };
  }
  if (computeLimit === null) throw new Error("Set a compute unit limit (at most 200,000)");
  if (!transfer) throw new Error("No USDC transfer found");
  if (transfer.amount !== BigInt(req.maxAmountRequired)) {
    throw new Error(`Amount mismatch: paid ${transfer.amount}, required ${req.maxAmountRequired}`);
  }

  // One payment, one task: claim the payer's signature before co-signing, so a
  // replayed or concurrent duplicate X-PAYMENT can't create a second task.
  const payerSig = tx.signatures[1];
  if (!payerSig || payerSig.every((b) => b === 0)) throw new Error("Payment is not signed by the payer");
  const claimed = await kv().lock(`x402:${Buffer.from(payerSig).toString("base64url")}`, 7 * 24 * 3600 * 1000);
  if (!claimed) throw new Error("This payment was already used");

  tx.sign([gateway]);
  const conn = connection();
  const sim = await conn.simulateTransaction(tx, { sigVerify: true });
  if (sim.value.err) throw new Error(`Payment simulation failed: ${JSON.stringify(sim.value.err)}`);
  const sig = await conn.sendTransaction(tx);
  const bh = await conn.getLatestBlockhash("confirmed");
  const res = await conn.confirmTransaction({ signature: sig, ...bh }, "confirmed");
  if (res.value.err) throw new Error(`Payment failed: ${JSON.stringify(res.value.err)}`);
  return { sig, payer: transfer.payer.toBase58() };
}

/** Send a settled payment back to its payer (the facilitator pays the fee). */
export async function refundPayment(payer: string, amountBase: number): Promise<string> {
  const { createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction } = await import("@solana/spl-token");
  const { keypairSigner, sendIxs } = await import("../wukong");
  const gateway = loadKey("gateway");
  const mint = new PublicKey(deployment().mint);
  const to = new PublicKey(payer);
  const dest = getAssociatedTokenAddressSync(mint, to, true);
  return sendIxs(connection(), keypairSigner(gateway), [
    createAssociatedTokenAccountIdempotentInstruction(gateway.publicKey, dest, to, mint),
    createTransferCheckedInstruction(getAssociatedTokenAddressSync(mint, gateway.publicKey, true), mint, dest, gateway.publicKey, BigInt(amountBase), 6),
  ]);
}
