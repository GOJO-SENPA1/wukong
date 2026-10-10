import { timingSafeEqual } from "node:crypto";
import { hasDeployment } from "@/lib/server/env";
import { isProduction } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { keeperPass } from "@/lib/server/keeper";

// One keeper pass, for schedulers on serverless hosts (Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET"). In production the secret is required:
// without it the route refuses, rather than letting anyone trigger RPC and judge work.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return !isProduction();
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  if (!authorized(req)) return fail("Unauthorized", 401);
  if (!hasDeployment()) return fail("No deployment configured", 503);
  const log: string[] = [];
  try {
    await keeperPass((msg) => log.push(msg));
    return ok({ ok: true, log });
  } catch (err) {
    return fail(err, 500);
  }
}
