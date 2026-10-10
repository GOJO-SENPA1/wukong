"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, Empty, Spinner, TierBadge, Usdc } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { SetupNotice } from "@/components/SetupNotice";
import { getJSON } from "@/lib/client/api";
import { shortAddr } from "@/lib/format";
import type { ReputationView } from "@/lib/wukong";

type Row = ReputationView & { name?: string };

export default function LeaderboardPage() {
  const { state: appState } = useApp();
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const load = () => getJSON<{ workers: Row[] }>("/api/leaderboard").then((d) => setRows(d.workers)).catch(() => setRows([]));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-muted">Ranked straight from on-chain reputation accounts. No hidden algorithm.</p>
      </div>
      {!appState.ready && <SetupNotice />}
      {!rows ? (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Empty>No workers yet.</Empty>
          <p className="max-w-sm text-sm text-muted">
            Reputation accrues the moment someone enters an arena and gets scored. Be the first.
          </p>
          <Link href="/tasks" className="btn btn-gold">
            Enter the arena
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[24px_minmax(0,1fr)_auto_auto] gap-x-3 border-b border-line px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid-cols-[48px_1fr_110px_80px_80px_130px] sm:gap-3 sm:px-4">
            <span>#</span>
            <span>Worker</span>
            <span>Rating</span>
            <span className="hidden sm:block">Wins</span>
            <span className="hidden sm:block">Avg</span>
            <span className="text-right">Earned</span>
          </div>
          {rows.map((r, i) => (
            <Link
              key={r.worker}
              href={`/workers/${r.worker}`}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-line/60 px-3 py-3 last:border-0 hover:bg-white/[0.03] sm:grid-cols-[48px_1fr_110px_80px_80px_130px] sm:gap-3 sm:px-4"
            >
              <span className="font-display text-lg font-bold text-muted">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar id={r.worker} name={r.name} size={30} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.name ?? shortAddr(r.worker, 5)}</span>
                  <span className="block font-mono text-[11px] text-faint">
                    {r.submissions} {r.submissions === 1 ? "entry" : "entries"}
                  </span>
                </span>
              </span>
              <span className="justify-self-end sm:justify-self-auto">
                <TierBadge rating={r.rating} compact />
              </span>
              <span className="hidden tabular-nums sm:block">{r.wins}</span>
              <span className="hidden tabular-nums sm:block">{r.scored ? (r.avgScore / 100).toFixed(1) : "–"}</span>
              <span className="text-right">
                <Usdc base={r.totalEarned} decimals={2} className="font-semibold text-jade" unit={false} />
                <span className="ml-1 hidden text-[0.7em] font-semibold tracking-wide text-muted sm:inline">USDC</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
