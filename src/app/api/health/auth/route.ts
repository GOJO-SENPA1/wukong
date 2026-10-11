import { hidden, statusKeyOk } from "@/lib/server/admin";
import { describeError } from "@/lib/server/diagnose";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Each check gets this long; they run side by side, so the page always answers within seconds.
const CHECK_MS = 6_000;

type Check = { ok: boolean | null; reason?: string };

/** Passes if the check finishes in time without throwing; otherwise says why it didn't. */
async function attempt(check: () => Promise<unknown>): Promise<Check> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer within ${CHECK_MS / 1000}s`)), CHECK_MS);
      }),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: describeError(err) };
  } finally {
    clearTimeout(timer);
  }
}

const skipped: Check = { ok: null };
const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const version = () => process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

/**
 * Is sign-in wired up on this deployment? Whether the server code loads, Privy's
 * keys, the accounts database and its schema, the Redis store and result emails:
 * yes/no for each, and for a failure a one-line reason with credentials stripped.
 * Open /status to read it.
 *
 * Each part of the server code is loaded here on its own, rather than imported up
 * top: if one fails to load on the host, this still answers and names it.
 */
export async function GET(req: Request) {
  // Private: it describes how the deployment is configured.
  if (!statusKeyOk(req.headers.get("x-status-key"))) return hidden();
  try {
    const loaded: Record<string, Check> = {};
    const load = async <T,>(key: string, get: () => Promise<T>): Promise<T | null> => {
      try {
        const mod = await get();
        loaded[key] = { ok: true };
        return mod;
      } catch (err) {
        console.error(`health: ${key}:`, err);
        loaded[key] = { ok: false, reason: describeError(err) };
        return null;
      }
    };
    const config = await load("codeConfig", () => import("@/lib/server/config"));
    const store = await load("codeStore", () => import("@/lib/server/kv"));
    const guard = await load("codeGuard", () => import("@/lib/server/guard"));
    if (guard) {
      try {
        await guard.rateLimit(req, "health-auth", 6, 60_000);
      } catch (err) {
        if (err instanceof guard.HttpError) return json({ error: err.message }, err.status);
        throw err;
      }
    }
    const prisma = await load("codeDatabase", async () => {
      const mod = await import("@prisma/client");
      // Without `prisma generate` at build time the package is a stub with none of its error classes.
      if (typeof mod.Prisma?.PrismaClientKnownRequestError !== "function") throw new Error("the Prisma client wasn't generated during the build");
      return import("@/lib/server/db");
    });
    const auth = await load("codeSignIn", () => import("@/lib/server/auth"));
    await load("codeAccounts", () => import("@/lib/server/accounts"));

    const hasDb = config?.hasDatabase() ?? false;
    const db = prisma?.db;
    const [privyKeysAccepted, databaseReachable, schemaUpToDate, storeReachable, judge] = await Promise.all([
      auth ? auth.privyDiagnosis().catch((err): Check => ({ ok: false, reason: describeError(err) })) : skipped,
      hasDb && db ? attempt(() => db().$queryRaw`SELECT 1`) : skipped,
      // The newest parts of the schema: if these answer, the build's schema sync has run.
      hasDb && db
        ? attempt(() => Promise.all([db().profile.findFirst({ select: { handle: true, onboardedAt: true } }), db().companyInvite.count()]))
        : skipped,
      store ? attempt(() => store.kv().get("names", "__health__")) : skipped,
      // An OpenAI-compatible judge (DeepSeek and others), checked with the provider's free model list.
      import("@/lib/server/judge/compatible")
        .then((m) => m.compatibleDiagnosis())
        .catch((err) => ({ reachable: { ok: false, reason: describeError(err) } as Check, model: skipped })),
    ]);
    const clean = config?.cleanCredential ?? ((v?: string) => v?.trim() || undefined);
    const results: Record<string, Check> = {
      ...loaded,
      privyAppId: { ok: !!clean(process.env.NEXT_PUBLIC_PRIVY_APP_ID) },
      privySecret: { ok: !!clean(process.env.PRIVY_APP_SECRET) },
      privyKeysAccepted,
      privyVerificationKey: { ok: auth ? auth.verificationKeyUsable() : null },
      database: { ok: !!process.env.DATABASE_URL },
      databaseReachable,
      schemaUpToDate,
      storeConfigured: { ok: !!(process.env.REDIS_URL || process.env.KV_URL) || !process.env.VERCEL },
      storeReachable,
      resultEmails: { ok: !!process.env.RESEND_API_KEY },
      judgeReachable: judge.reachable,
      judgeModel: judge.model,
    };
    const checks = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.ok]));
    const reasons = Object.fromEntries(Object.entries(results).flatMap(([k, v]) => (v.reason ? [[k, v.reason]] : [])));
    const ok = Object.entries(checks).every(([k, v]) => v !== false || k === "resultEmails");
    return json({ ok, checks, reasons, version: version() }, ok ? 200 : 503);
  } catch (err) {
    console.error("health:", err);
    return json({ ok: false, failedWhile: "running the checks", error: describeError(err), version: version() }, 500);
  }
}
