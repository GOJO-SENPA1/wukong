import { accountError, profileByHandle, publicProfile } from "@/lib/server/accounts";
import { rateLimit } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** A public profile by handle (no email, no user id). */
export async function GET(req: Request, ctx: { params: Promise<{ handle: string }> }) {
  try {
    await rateLimit(req, "profiles", 60, 60_000);
  } catch (err) {
    return accountError(err);
  }
  const p = await profileByHandle((await ctx.params).handle).catch(() => null);
  if (!p?.onboardedAt) return Response.json({ error: "No such profile" }, { status: 404 });
  return Response.json({ profile: publicProfile(p) });
}
