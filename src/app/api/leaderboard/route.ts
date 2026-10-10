import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/guard";
import { leaderboardView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await rateLimit(req, "leaderboard", 30, 60_000);
    return ok({ workers: await leaderboardView() });
  } catch (err) {
    return fail(err, 502);
  }
}
