import { privyCredentialsWork } from "@/lib/server/auth";
import { hasDatabase, privyConfig, resendConfig } from "@/lib/server/config";
import { db } from "@/lib/server/db";
import { kv, redisUrl } from "@/lib/server/kv";
import { rateLimit } from "@/lib/server/guard";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Each check gets this long; they run side by side, so the page always answers within seconds.
const CHECK_MS = 6_000;

/** True if the check finishes in time without throwing. */
async function passes(check: () => Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), CHECK_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Is sign-in wired up on this deployment? Yes/no checks only, never values:
 * Privy's keys, the accounts database and its schema, the Redis store and
 * result emails. Open /api/health/auth after a deploy, or when sign-in misbehaves.
 */
export async function GET(req: Request) {
  try {
    await rateLimit(req, "health-auth", 6, 60_000);
  } catch (err) {
    return fail(err);
  }
  const [privyKeysAccepted, databaseReachable, schemaUpToDate, storeReachable] = await Promise.all([
    privyConfig() ? privyCredentialsWork().then((ok) => ok === true) : Promise.resolve(null),
    hasDatabase() ? passes(() => db().$queryRaw`SELECT 1`) : Promise.resolve(null),
    // The newest parts of the schema: if these answer, the build's schema sync has run.
    hasDatabase()
      ? passes(() => Promise.all([db().profile.findFirst({ select: { handle: true, onboardedAt: true } }), db().companyInvite.count()]))
      : Promise.resolve(null),
    passes(() => kv().get("names", "__health__")),
  ]);
  const checks: Record<string, boolean | null> = {
    privyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privySecret: !!process.env.PRIVY_APP_SECRET,
    privyKeysAccepted,
    database: hasDatabase(),
    databaseReachable,
    schemaUpToDate,
    storeConfigured: !!redisUrl() || !process.env.VERCEL,
    storeReachable,
    resultEmails: !!resendConfig(),
  };
  const ok = Object.entries(checks).every(([k, v]) => v !== false || k === "resultEmails");
  return Response.json(
    { ok, checks, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
