"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleSlash, RotateCcw, XCircle } from "lucide-react";
import { Container, Kicker, Spinner, cx } from "@/components/ui";

type Checks = Record<string, boolean | null>;
interface Version {
  version: string;
  branch: string | null;
  environment: string;
  region: string | null;
}

/** What each check means and, when it fails, what to change (all in Vercel → Settings → Environment Variables, then redeploy). */
const CHECKS: { key: string; label: string; fix: string; optional?: boolean }[] = [
  { key: "privyAppId", label: "Privy app id is set", fix: "Add NEXT_PUBLIC_PRIVY_APP_ID (Privy dashboard → App settings), then redeploy." },
  { key: "privySecret", label: "Privy app secret is set", fix: "Add PRIVY_APP_SECRET (Privy dashboard → App settings), then redeploy." },
  { key: "privyKeysAccepted", label: "Privy accepts the id and secret", fix: "Privy rejected the pair: copy both again from the same Privy app, update them, then redeploy." },
  { key: "database", label: "Accounts database is set", fix: "Add DATABASE_URL (Supabase → Connect → Transaction pooler, port 6543), then redeploy." },
  { key: "databaseReachable", label: "Database answers", fix: "Check DATABASE_URL: the Transaction pooler string (port 6543) with the current database password." },
  { key: "schemaUpToDate", label: "Database tables are up to date", fix: "Run the upgrade SQL in Supabase's SQL editor (see docs/LAUNCH.md), then redeploy." },
  { key: "storeConfigured", label: "Redis store is set", fix: "Vercel → Storage → add Upstash for Redis to this project (it sets REDIS_URL / KV_URL), then redeploy." },
  { key: "storeReachable", label: "Redis store answers", fix: "Check REDIS_URL / KV_URL: for Upstash it must start with rediss:// (with two s). Then redeploy." },
  { key: "resultEmails", label: "Result emails are set up", fix: "Optional: add RESEND_API_KEY and EMAIL_FROM to send result emails.", optional: true },
];

/** A plain-language status page for sign-in: which build is live and whether each piece it needs works. */
export default function StatusPage() {
  const [version, setVersion] = useState<Version | null | "error">(null);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setProblem(null);
    setChecks(null);
    setVersion(null);
    const started = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    fetch("/api/version", { cache: "no-store", signal: AbortSignal.timeout(10_000) })
      .then((r) => r.json())
      .then(setVersion)
      .catch(() => setVersion("error"));
    try {
      const res = await fetch("/api/health/auth", { cache: "no-store", signal: AbortSignal.timeout(30_000) });
      const body = await res.json().catch(() => null);
      if (body?.checks) setChecks(body.checks as Checks);
      else if (res.status === 429) setProblem("Checked too often. Wait a minute, then run it again.");
      else setProblem(`The check didn't return a report (HTTP ${res.status}). The server may be failing before it reaches the app's code.`);
    } catch (err) {
      setProblem(
        (err as Error).name === "TimeoutError"
          ? "No answer after 30 seconds: the server is hanging. This live build may be older than the fix; check that the newest deployment is live."
          : "The request failed before reaching the server (offline, or the domain isn't pointing at this app).",
      );
    } finally {
      clearInterval(tick);
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const failing = checks ? CHECKS.filter((c) => checks[c.key] === false && !c.optional) : [];

  return (
    <Container className="flex max-w-3xl flex-col gap-8">
      <div>
        <Kicker>System status</Kicker>
        <h1 className="display mt-5 text-[clamp(2.6rem,6vw,4.2rem)]">
          Sign-in <em className="text-gold-2">health</em>
        </h1>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="label">Live build</div>
          <div className="mt-1.5 font-mono text-[15px]">
            {version === null ? (
              <span className="text-muted">checking…</span>
            ) : version === "error" ? (
              <span className="text-red-2">couldn&apos;t read it</span>
            ) : (
              <>
                {version.version}
                <span className="text-muted">
                  {version.branch ? ` · ${version.branch}` : ""} · {version.environment}
                  {version.region ? ` · ${version.region}` : ""}
                </span>
              </>
            )}
          </div>
        </div>
        <button className="btn btn-line h-10 px-4" disabled={running} onClick={() => void run()}>
          {running ? <Spinner /> : <RotateCcw size={15} />} {running ? `Checking… ${elapsed}s` : "Check again"}
        </button>
      </div>

      {problem && <p className="rounded-xl bg-red/10 p-4 text-[14.5px] leading-relaxed text-red-2">{problem}</p>}

      {checks && (
        <>
          <p className={cx("rounded-xl p-4 text-[14.5px]", failing.length ? "bg-red/10 text-red-2" : "bg-green/10 text-green")}>
            {failing.length ? `${failing.length} thing${failing.length === 1 ? "" : "s"} to fix, listed below.` : "Everything sign-in needs is working."}
          </p>
          <ul className="card divide-y divide-line">
            {CHECKS.map((c) => {
              const v = checks[c.key];
              return (
                <li key={c.key} className="flex gap-3 p-4">
                  {v === true ? (
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-green" />
                  ) : v === false ? (
                    <XCircle size={19} className={cx("mt-0.5 shrink-0", c.optional ? "text-faint" : "text-red-2")} />
                  ) : (
                    <CircleSlash size={19} className="mt-0.5 shrink-0 text-faint" />
                  )}
                  <div>
                    <div className="text-[15px] font-medium">{c.label}</div>
                    {v === false && <div className="mt-1 text-[13.5px] leading-relaxed text-muted">{c.fix}</div>}
                    {v === null && <div className="mt-1 text-[13px] text-faint">Not checked (depends on an earlier item).</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Container>
  );
}
