// GET /api/x402/tasks/:task — the agent polls for its result.
import { fail, ok } from "@/lib/server/http";
import { taskView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task } = await ctx.params;
  try {
    const view = await taskView(task);
    if (!view) return fail("Task not found", 404);
    const t = view.task;
    const winners = view.submissions
      .filter((s) => s.rank > 0)
      .sort((a, b) => a.rank - b.rank)
      .map((s) => ({
        place: s.rank,
        worker: s.worker,
        score: s.score / 100,
        payoutUsdc: s.payout / 1e6,
        content: s.content,
        contentHash: s.contentHash,
        judge: s.report?.report.summary,
        reportHash: s.reportHash,
      }));
    return ok({
      task: t.pubkey,
      title: t.title,
      status: t.status,
      entries: t.submissionCount,
      scored: t.scoredCount,
      rewardUsdc: t.reward / 1e6,
      result: t.status === "settled" ? { winners, refunded: winners.length === 0 } : null,
    });
  } catch (err) {
    return fail(err, 502);
  }
}
