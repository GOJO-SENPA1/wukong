"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useApp } from "@/components/Providers";
import { Counter, Kinetic, Reveal, Tilt } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Empty, Skeleton, TierBadge, cx } from "@/components/ui";
import { getJSON } from "@/lib/client/api";
import { shortAddr, toUsdc } from "@/lib/format";
import type { SpriteName } from "@/lib/fx/sprites";
import type { ReputationView } from "@/lib/wukong";

type Row = ReputationView & { name?: string };
const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");
const split = (name?: string) => {
  const [who, city] = (name ?? "").split(" · ");
  return { who: who || undefined, city };
};

export default function LeaderboardPage() {
  const { persona, personaKeys, signer } = useApp();
  const me = persona === "wallet" ? signer?.publicKey.toBase58() : personaKeys[persona];
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const load = () =>
      getJSON<{ workers: Row[] }>("/api/leaderboard")
        .then((d) => setRows(d.workers))
        .catch(() => setRows([]));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const top = rows?.slice(0, 3) ?? [];
  const rest = rows?.slice(3) ?? [];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kinetic text="Leaderboard" className="display text-[clamp(3rem,7vw,5.5rem)]" />
          <Reveal delay={0.2} className="mt-3 max-w-2xl text-[16px] text-muted">
            Ranked by rating, which rises with strong scores and wins and falls with spam. Read straight from the chain, no hidden algorithm.
          </Reveal>
        </div>
        <Reveal delay={0.3} className="flex rounded-full border-[1.5px] border-line-2 bg-white p-1 text-[14px] font-medium">
          <span className="rounded-full bg-navy px-4 py-1.5 text-white">All time</span>
          <span className="cursor-not-allowed px-4 py-1.5 text-faint" title="Coming soon">
            This month
          </span>
        </Reveal>
      </div>

      {!rows ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty className="flex flex-col items-center gap-3">
          <PixelIcon name="trophy" px={3} motion="bob" />
          No ranked workers yet. Win a task to be the first.
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {top.map((r, i) => (
              <Podium key={r.worker} row={r} place={i} me={r.worker === me} />
            ))}
          </div>
          {rest.length > 0 && (
            <Reveal>
              <div className="card overflow-hidden px-2 sm:px-6">
                <div className="mono-label grid grid-cols-[52px_1fr_70px_90px] gap-3 border-b border-line px-2 py-4 !text-[10px] text-muted sm:grid-cols-[64px_1fr_110px_80px_100px_120px]">
                  <span>Rank</span>
                  <span>Worker</span>
                  <span>Rating</span>
                  <span className="hidden sm:block">Wins</span>
                  <span className="hidden sm:block">Avg score</span>
                  <span className="text-right">Earned</span>
                </div>
                {rest.map((r, i) => {
                  const { who, city } = split(r.name);
                  const mine = r.worker === me;
                  return (
                    <motion.div
                      key={r.worker}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.6, ease: EASE }}
                    >
                      <Link
                        href={`/workers/${r.worker}`}
                        className={cx(
                          "group relative grid grid-cols-[52px_1fr_70px_90px] items-center gap-3 border-b border-line px-2 py-4 transition-colors last:border-0 hover:bg-paper sm:grid-cols-[64px_1fr_110px_80px_100px_120px]",
                          mine && "bg-red/5",
                        )}
                      >
                        {mine && <span className="absolute inset-y-0 left-0 w-[3px] bg-red" />}
                        <span className={cx("display text-[26px] transition-transform duration-300 group-hover:translate-x-1", mine && "text-red")}>{pad(i + 4)}</span>
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar id={r.worker} name={r.name} size={34} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 truncate font-semibold">
                              {who ?? shortAddr(r.worker, 5)}
                              {mine && <span className="mono-label !text-[9.5px] text-red">You</span>}
                            </span>
                            <span className="block text-[12.5px] text-muted">{city ?? `${r.submissions} entries`}</span>
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums">{r.rating}</span>
                        <span className="hidden tabular-nums sm:block">{r.wins}</span>
                        <span className="hidden tabular-nums sm:block">{r.scored ? Math.round(r.avgScore / 100) : "–"}</span>
                        <span className="text-right tabular-nums">{toUsdc(r.totalEarned).toFixed(2)}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}

const PODIUM_ICON: SpriteName[] = ["trophy", "gem", "fire"];

function Podium({ row, place, me }: { row: Row; place: number; me: boolean }) {
  const { who, city } = split(row.name);
  const first = place === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + [0.15, 0, 0.3][place], duration: 0.9, ease: EASE }}
      className="h-full"
    >
      <Tilt max={7} className="h-full rounded-[22px]">
        <Link
          href={`/workers/${row.worker}`}
          className={cx("relative flex h-full flex-col overflow-hidden rounded-[22px] p-6", first ? "bg-navy text-white" : "card")}
        >
          {first && <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />}
          <div className="relative flex items-start justify-between">
            <span className={cx("display text-[72px] leading-[0.85]", first ? "text-red-2" : "text-navy")}>{pad(place + 1)}</span>
            <div className="relative">
              <Avatar id={row.worker} name={row.name} size={56} />
              <span className="absolute -bottom-3 -left-4">
                <PixelIcon name={PODIUM_ICON[place]} px={1.5} motion={first ? "spin" : "bob"} />
              </span>
            </div>
          </div>
          <div className="relative mt-5 text-[19px] font-semibold">
            {who ?? shortAddr(row.worker, 5)} {me && <span className="mono-label ml-1 !text-[10px] text-red">You</span>}
          </div>
          <div className={cx("relative text-[13.5px]", first ? "text-white/60" : "text-muted")}>{city ?? `${row.submissions} entries`}</div>
          <div className="relative mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
            <span>
              <b className="text-[19px] tabular-nums">
                <Counter value={row.rating} />
              </b>{" "}
              <span className={first ? "text-white/60" : "text-muted"}>rating</span>
            </span>
            <span>
              <b className="text-[19px] tabular-nums">{row.wins}</b> <span className={first ? "text-white/60" : "text-muted"}>wins</span>
            </span>
            <span>
              <b className="text-[19px] tabular-nums">
                <Counter value={toUsdc(row.totalEarned)} decimals={2} />
              </b>{" "}
              <span className={first ? "text-white/60" : "text-muted"}>USDC</span>
            </span>
          </div>
          <div className="relative mt-4">
            <TierBadge rating={row.rating} />
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
}
