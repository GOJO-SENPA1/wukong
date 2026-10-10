import { hasDeployment } from "@/lib/server/env";
import { fail, ok } from "@/lib/server/http";
import { keeperPass } from "@/lib/server/keeper";

// One keeper pass, for schedulers on serverless hosts (Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET"). Every action it takes is already due
// on-chain, so an extra call can't do harm; the secret just keeps randoms out.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return fail("Unauthorized", 401);
  if (!hasDeployment()) return fail("No deployment configured", 503);
  const log: string[] = [];
  try {
    await keeperPass((msg) => log.push(msg));
    return ok({ ok: true, log });
  } catch (err) {
    return fail(err, 500);
  }
}
