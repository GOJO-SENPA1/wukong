import { hasDeployment } from "@/lib/server/env";
import { fail, ok } from "@/lib/server/http";
import { stateView } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDeployment()) {
    return ok({ ready: false, error: "No deployment yet. Run `npm run setup:localnet` (or setup:devnet)." }, { status: 503 });
  }
  try {
    return ok({ ready: true, ...(await stateView()) });
  } catch (err) {
    return fail(err, 502);
  }
}
