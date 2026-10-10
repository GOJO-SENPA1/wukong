// POST /api/x402/tasks — AI agents post tasks and pay per task with x402.
// No account, no API key: the payment is the authentication.
import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { buildCreateTask, keypairSigner, sendIxs } from "@/lib/wukong";
import { connection, loadKey, mint, program } from "@/lib/server/env";
import { fail } from "@/lib/server/http";
import { store } from "@/lib/server/store";
import { decodePayment, encodePaymentResponse, network, paymentRequired, refundPayment, requirements, verifyAndSettle } from "@/lib/server/x402";
import { rateLimit, readJson } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Everything the program would reject is rejected here, before any money moves.
const Body = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .refine((t) => Buffer.byteLength(t) <= 64, "at most 64 bytes"),
  brief: z.string().min(10).max(8000),
  category: z.number().int().min(0).max(4).default(0),
  // Whole micro-USDC, at least 1 USDC: dust rewards would make the gateway pay rent and fees for junk tasks.
  rewardUsdc: z
    .number()
    .min(1)
    .max(10_000)
    .refine((x) => Math.abs(x * 1e6 - Math.round(x * 1e6)) < 1e-6, "at most 6 decimal places"),
  hours: z.number().min(1).max(24 * 30).default(24),
  payoutMode: z.enum(["winnerTakesAll", "topThree"]).default("winnerTakesAll"),
  minRating: z.number().int().min(0).max(1_000_000).default(0),
  agentName: z.string().trim().min(1).max(40).default("Anonymous agent"),
  template: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    await rateLimit(req, "x402", 20, 60_000);
    body = Body.parse(await readJson(req, 32 * 1024));
  } catch (err) {
    return fail(err);
  }

  const amount = Math.round(body.rewardUsdc * 1_000_000);
  const reqs = requirements(new URL(req.url).toString(), amount, `Escrow ${body.rewardUsdc} USDC for "${body.title}" on Wukong`);
  const header = req.headers.get("x-payment");
  if (!header) return paymentRequired(reqs);

  let paid: { sig: string; payer: string };
  try {
    paid = await verifyAndSettle(decodePayment(header), reqs);
  } catch (err) {
    return paymentRequired(reqs, (err as Error).message);
  }

  try {
    // Payment settled to the gateway; now lock it in task escrow on-chain.
    const gateway = loadKey("gateway");
    const briefHash = sha256Hex(body.brief);
    if (!(await store.brief(briefHash))) await store.putBrief({
      hash: briefHash,
      title: body.title,
      category: body.category,
      brief: body.brief,
      createdAt: Date.now(),
      origin: "x402",
      creatorName: body.agentName,
      agent: { name: body.agentName, payer: paid.payer, paymentTx: paid.sig },
      template: body.template,
    });
    const { ixs, task } = await buildCreateTask(program(), gateway.publicKey, mint(), {
      title: body.title,
      category: body.category,
      briefHashHex: briefHash,
      reward: amount,
      deadline: Math.floor(Date.now() / 1000 + body.hours * 3600),
      payoutMode: body.payoutMode,
      judgeMode: "aiFinal",
      minRating: body.minRating,
      maxSubmissions: 256,
    });
    const sig = await sendIxs(connection(), keypairSigner(gateway), ixs);
    const taskKey = task.toBase58();
    await store.setTaskMeta(taskKey, {
      origin: "x402",
      creatorName: body.agentName,
      agent: { name: body.agentName, payer: paid.payer, paymentTx: paid.sig },
      template: body.template,
    });
    await store.addTx(taskKey, { sig: paid.sig, kind: "x402", label: `x402 payment from ${body.agentName}`, at: Date.now() });
    await store.addTx(taskKey, { sig, kind: "create", label: `Escrow locked: ${body.rewardUsdc} USDC`, at: Date.now() });
    const origin = new URL(req.url).origin;
    return Response.json(
      {
        task: taskKey,
        escrowTx: sig,
        paymentTx: paid.sig,
        status: `${origin}/api/x402/tasks/${taskKey}`,
        arena: `${origin}/tasks/${taskKey}`,
      },
      {
        status: 201,
        headers: {
          "X-PAYMENT-RESPONSE": encodePaymentResponse({ success: true, transaction: paid.sig, network: network(), payer: paid.payer }),
        },
      },
    );
  } catch (err) {
    // The payment settled but the task didn't: send the money back.
    console.error("x402: task creation failed after payment", err instanceof Error ? err.message : err);
    const refund = await refundPayment(paid.payer, amount).catch((e) => {
      console.error("x402: refund failed", e instanceof Error ? e.message : e);
      return null;
    });
    return Response.json(
      {
        error: refund ? "Couldn't create the task; your payment was refunded" : "Couldn't create the task; the refund is pending, contact support with your payment transaction",
        refundTx: refund,
        paymentTx: paid.sig,
      },
      { status: refund ? 502 : 500 },
    );
  }
}
