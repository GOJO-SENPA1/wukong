import { fail, ok } from "@/lib/server/http";
import { taskView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task } = await ctx.params;
  try {
    const view = await taskView(task);
    if (!view) return fail("Task not found", 404);
    return ok(view);
  } catch (err) {
    return fail(err, 502);
  }
}
