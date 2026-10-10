// POST /api/x402/tasks — AI agents post tasks and pay per task with x402.
// No account, no API key: the payment is the authentication.
import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { buildCreateTask, keypairSigner, sendIxs } from "@/lib/wukong";
import { connection, loadKey, mint, program } from "@/lib/server/env";
import { fail } from "@/lib/server/http";
import { store } from "@/lib/server/store";
import { decodePayment, encodePaymentResponse, network, paymentRequired, requirements, verifyAndSettle } from "@/lib/server/x402";

export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(1).max(64),
  brief: z.string().min(10).max(8000),
  category: z.number().int().min(0).max(4).default(0),
  rewardUsdc: z.number().positive().max(10_000),
  hours: z.number().positive().max(24 * 30).default(24),
  payoutMode: z.enum(["winnerTakesAll", "topThree"]).default("winnerTakesAll"),
  minRating: z.number().int().min(0).default(0),
  agentName: z.string().max(40).default("Anonymous agent"),
  template: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
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
    if (!store.brief(briefHash)) store.putBrief({
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
      maxSubmissions: 64,
    });
    const sig = await sendIxs(connection(), keypairSigner(gateway), ixs);
    const taskKey = task.toBase58();
    store.setTaskMeta(taskKey, {
      origin: "x402",
      creatorName: body.agentName,
      agent: { name: body.agentName, payer: paid.payer, paymentTx: paid.sig },
      template: body.template,
    });
    store.addTx(taskKey, { sig: paid.sig, kind: "x402", label: `x402 payment from ${body.agentName}`, at: Date.now() });
    store.addTx(taskKey, { sig, kind: "create", label: `Escrow locked: ${body.rewardUsdc} USDC`, at: Date.now() });
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
    return fail(err, 500);
  }
}
