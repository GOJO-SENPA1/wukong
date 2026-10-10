"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Award, Coins, Copy, Target, TrendingUp } from "lucide-react";
import { Avatar, Empty, ExplorerLink, ScoreNumber, Spinner, Stat, StatusPill, TierBadge, Usdc } from "@/components/ui";
import { getJSON } from "@/lib/client/api";
import { TIERS, fmtUsdc, shortAddr, tierFor, timeAgo } from "@/lib/format";
import type { ReputationView, SubmissionView, TaskStatus } from "@/lib/wukong";

interface WorkerPayload {
  worker: string;
  name?: string;
  usdc: number;
  reputation: ReputationView | null;
  reputationAccount: string;
  history: (SubmissionView & { taskTitle: string; taskStatus?: TaskStatus; category: string; summary?: string })[];
}

export default function WorkerPage({ params }: { params: Promise<{ worker: string }> }) {
  const { worker } = use(params);
  const [data, setData] = useState<WorkerPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = () =>
      getJSON<WorkerPayload>(`/api/workers/${worker}`)
        .then(setData)
        .catch((e) => setErr(e.message));
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [worker]);

  if (err && !data) return <Empty>{err}</Empty>;
  if (!data) {
    return (
      <div className="flex justify-center py-24 text-muted">
        <Spinner />
      </div>
    );
  }

  const rep = data.reputation;
  const tier = tierFor(rep?.rating ?? 0);
  const next = TIERS.find((t) => t.min > (rep?.rating ?? 0));
  const snippet = `// Read this worker's reputation from any app, no Wukong API needed
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("reputation"), new PublicKey("${data.worker}").toBuffer()],
  WUKONG_PROGRAM_ID,
);
const rep = await program.account.reputation.fetch(pda);`;

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar id={data.worker} name={data.name} size={76} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold">{data.name ?? shortAddr(data.worker, 6)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-mono text-xs">{shortAddr(data.worker, 6)}</span>
            <TierBadge rating={rep?.rating ?? 0} />
          </div>
          {next && (
            <div className="mt-3 max-w-sm">
              <div className="flex justify-between text-xs text-muted">
                <span>{tier.name}</span>
                <span>
                  {next.min - (rep?.rating ?? 0)} to {next.name}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(((rep?.rating ?? 0) - tier.min) / (next.min - tier.min)) * 100}%`,
                    background: tier.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="label">Wallet balance</div>
          <Usdc base={data.usdc} decimals={2} className="font-display text-2xl font-bold text-jade" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Rating" value={<span style={{ color: tier.color }}>{rep?.rating ?? 0}</span>} />
        <Stat label="Wins / podiums" value={`${rep?.wins ?? 0} / ${rep?.podiums ?? 0}`} accent="text-gold" />
        <Stat label="Earned on Wukong" value={<Usdc base={rep?.totalEarned ?? 0} decimals={2} />} accent="text-jade" />
        <Stat label="Avg score" value={rep?.scored ? (rep.avgScore / 100).toFixed(1) : "–"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">Track record</h2>
          {data.history.length === 0 ? (
            <Empty>No submissions yet.</Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {data.history.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="card flex items-center gap-4 p-4 hover:border-gold/40">
                  <div className="w-8 text-center text-xl">{["", "🥇", "🥈", "🥉"][h.rank] || (h.scored ? "·" : "⏳")}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{h.taskTitle}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {h.taskStatus && <StatusPill status={h.taskStatus} />}
                      <span>{h.category}</span>
                      <span>{timeAgo(h.submittedAt)}</span>
                    </div>
                    {h.summary && <p className="mt-1 truncate text-xs text-muted">{h.summary}</p>}
                  </div>
                  <div className="text-right">
                    {h.scored ? <ScoreNumber score={h.score} className="text-2xl" /> : <span className="text-xs text-faint">pending</span>}
                    {h.payout > 0 && <div className="text-xs font-bold text-jade">+{fmtUsdc(h.payout, { decimals: 2 })}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 font-display font-semibold">
              <Award size={18} className="text-gold" /> Portable, on-chain reputation
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This record lives in a program-derived account keyed by the worker&apos;s wallet, not in our database. If Wukong disappears
              tomorrow, it survives. Any app can read it and gate, rank or pay on it.
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Reputation PDA</span>
              <ExplorerLink kind="address" id={data.reputationAccount} />
            </div>
            <div className="relative mt-3">
              <pre className="overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-muted">{snippet}</pre>
              <button
                className="absolute right-2 top-2 rounded-md bg-white/5 p-1.5 text-muted hover:text-text"
                onClick={() => {
                  navigator.clipboard?.writeText(snippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                aria-label="Copy snippet"
              >
                <Copy size={12} />
              </button>
              {copied && <span className="absolute right-10 top-2.5 text-[10px] text-jade">copied</span>}
            </div>
          </div>
          <div className="card space-y-3 p-5 text-sm">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-violet" /> {rep?.submissions ?? 0} {rep?.submissions === 1 ? "submission" : "submissions"}, {rep?.scored ?? 0} scored
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-gold" /> best score {rep?.bestScore ? (rep.bestScore / 100).toFixed(1) : "–"}
            </div>
            <div className="flex items-center gap-2">
              <Coins size={15} className="text-jade" /> rating = quality above 50 + podium bonuses (100/50/25), spam costs 10
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
