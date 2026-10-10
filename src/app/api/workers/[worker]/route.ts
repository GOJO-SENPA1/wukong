import { fail, ok } from "@/lib/server/http";
import { workerView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ worker: string }> }) {
  const { worker } = await ctx.params;
  try {
    return ok(await workerView(worker));
  } catch (err) {
    return fail(err, 502);
  }
}
