import { fail, ok } from "@/lib/server/http";
import { leaderboardView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ workers: await leaderboardView() });
  } catch (err) {
    return fail(err, 502);
  }
}
