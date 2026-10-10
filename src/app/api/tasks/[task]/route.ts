import { after } from "next/server";
import { rateLimit } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { nudge } from "@/lib/server/keeper";
import { taskView } from "@/lib/server/views";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // room for keeper work after the response (see nudge)

export async function GET(req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task } = await ctx.params;
  try {
    await rateLimit(req, "task", 120, 60_000);
    const view = await taskView(task);
    if (!view) return fail("Task not found", 404);
    nudge(view.task, after);
    return ok(view);
  } catch (err) {
    return fail(err, 502);
  }
}
