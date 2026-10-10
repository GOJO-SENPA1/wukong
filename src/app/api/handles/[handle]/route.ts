import { accountError, accountsEnabled, handleProblem, normalizeHandle, profileByHandle } from "@/lib/server/accounts";
import { rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** Is this handle free? Used by onboarding as you type. */
export async function GET(req: Request, ctx: { params: Promise<{ handle: string }> }) {
  try {
    await rateLimit(req, "handles", 60, 60_000);
  } catch (err) {
    return accountError(err);
  }
  if (!accountsEnabled()) return Response.json({ available: false, reason: "Accounts are off" }, { status: 503 });
  const handle = normalizeHandle((await ctx.params).handle);
  const problem = handleProblem(handle);
  if (problem) return Response.json({ handle, available: false, reason: problem });
  const taken = !!(await profileByHandle(handle));
  return Response.json({ handle, available: !taken, reason: taken ? "That handle is taken" : null });
}
