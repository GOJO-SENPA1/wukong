import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/guard";
import { workerView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ worker: string }> }) {
  const { worker } = await ctx.params;
  try {
    await rateLimit(req, "workers", 60, 60_000);
    return ok(await workerView(worker));
  } catch (err) {
    return fail(err, 502);
  }
}
