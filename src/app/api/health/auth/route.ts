import { privyCredentialsWork } from "@/lib/server/auth";
import { hasDatabase, privyConfig, resendConfig } from "@/lib/server/config";
import { db } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/guard";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Is sign-in wired up on this deployment? Yes/no checks only, never values:
 * Privy's keys, the accounts database and its schema, and result emails.
 * Open /api/health/auth after a deploy, or when sign-in misbehaves.
 */
export async function GET(req: Request) {
  try {
    await rateLimit(req, "health-auth", 6, 60_000);
  } catch (err) {
    return fail(err);
  }
  const checks: Record<string, boolean | null> = {
    privyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privySecret: !!process.env.PRIVY_APP_SECRET,
    privyKeysAccepted: null,
    database: hasDatabase(),
    databaseReachable: null,
    schemaUpToDate: null,
    resultEmails: !!resendConfig(),
  };
  if (privyConfig()) checks.privyKeysAccepted = await privyCredentialsWork();
  if (hasDatabase()) {
    try {
      await db().$queryRaw`SELECT 1`;
      checks.databaseReachable = true;
      // The newest parts of the schema: if these answer, the build's schema sync has run.
      await db().profile.findFirst({ select: { handle: true, onboardedAt: true } });
      await db().companyInvite.count();
      checks.schemaUpToDate = true;
    } catch {
      if (checks.databaseReachable === null) checks.databaseReachable = false;
      checks.schemaUpToDate = false;
    }
  }
  const ok = Object.entries(checks).every(([k, v]) => v !== false || k === "resultEmails");
  return Response.json({ ok, checks }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
