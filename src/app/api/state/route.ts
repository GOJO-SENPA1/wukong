import { hasDeployment } from "@/lib/server/env";
import { rateLimit } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { stateView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

// Every open tab polls this, and each call scans the chain: share one result
// per instance for a few seconds, and cap callers per IP.
let cached: { at: number; data: Promise<Awaited<ReturnType<typeof stateView>>> } | null = null;
const TTL_MS = 3000;

export async function GET(req: Request) {
  if (!hasDeployment()) {
    return ok({ ready: false, error: "No deployment yet. Run `npm run setup:localnet` (or setup:devnet)." }, { status: 503 });
  }
  try {
    await rateLimit(req, "state", 120, 60_000);
    if (!cached || Date.now() - cached.at > TTL_MS) {
      const data = stateView();
      cached = { at: Date.now(), data };
      data.catch(() => {
        if (cached?.data === data) cached = null;
      });
    }
    return ok({ ready: true, ...(await cached.data) });
  } catch (err) {
    return fail(err, 502);
  }
}
