export const dynamic = "force-dynamic";

/** Which build is serving this request. Touches nothing else, so it answers instantly even when the rest is down. */
export function GET() {
  return Response.json(
    {
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      region: process.env.VERCEL_REGION ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
