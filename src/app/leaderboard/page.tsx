"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useApp } from "@/components/Providers";
import { Counter, Kinetic, Reveal, Tilt } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Empty, Kicker, Skeleton, TierBadge, cx } from "@/components/ui";
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
  const { persona, personaKeys, signer, role, identityReady } = useApp();
  const me = persona === "wallet" || persona === "account" ? signer?.publicKey.toBase58() : personaKeys[persona];
  const hiring = identityReady && role === "company";
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
          <Reveal y={8}>
            <Kicker>{hiring ? "Talent" : "Leaderboard"}</Kicker>
          </Reveal>
          <Kinetic
            text={hiring ? "Proven talent, *on-chain.*" : "The best, *ranked* *in* *public.*"}
            accent="italic text-gold-2"
            className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]"
          />
          <Reveal delay={0.2} className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Ranked by rating, which rises with strong scores and wins and falls with spam. Read straight from the chain, no hidden algorithm.
          </Reveal>
        </div>
        <Reveal delay={0.3} className="flex rounded-full p-1 text-[13.5px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.13)]">
          <span className="rounded-full bg-fg px-4 py-1.5 text-bg">All time</span>
          <span className="cursor-not-allowed px-4 py-1.5 text-faint" title="Coming soon">
            This month
          </span>
        </Reveal>
      </div>

      {!rows ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 !rounded-[22px]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty className="flex flex-col items-center gap-3">
          <PixelIcon name="trophy" px={3} motion="bob" />
          No ranked freelancers yet. Win a task to be the first.
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
                <div className="label grid grid-cols-[40px_1fr_76px] gap-3 border-b border-line px-2 py-4 !text-[10px] sm:grid-cols-[64px_1fr_110px_80px_100px_120px]">
                  <span>Rank</span>
                  <span>Freelancer</span>
                  <span className="hidden sm:block">Rating</span>
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
                          "group relative grid grid-cols-[40px_1fr_76px] items-center gap-3 border-b border-line px-2 py-4 transition-colors last:border-0 hover:bg-fg/[0.025] sm:grid-cols-[64px_1fr_110px_80px_100px_120px]",
                          mine && "bg-gold/[0.04]",
                        )}
                      >
                        {mine && <span className="absolute inset-y-2 left-0 w-px bg-gold" />}
                        <span className={cx("num text-[22px] italic text-muted transition-transform duration-300 group-hover:translate-x-1 sm:text-[26px]", mine && "text-gold-2")}>{pad(i + 4)}</span>
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar id={r.worker} name={r.name} size={34} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 truncate font-semibold">
                              {who ?? shortAddr(r.worker, 5)}
                              {mine && <span className="mono-label !text-[9px] text-gold-2">You</span>}
                            </span>
                            <span className="block truncate text-[12.5px] text-muted">
                              <span className="sm:hidden">{r.rating} rating · </span>
                              {city ?? `${r.submissions} ${r.submissions === 1 ? "entry" : "entries"}`}
                            </span>
                          </span>
                        </span>
                        <span className="hidden font-semibold tabular-nums sm:block">{r.rating}</span>
                        <span className="hidden tabular-nums sm:block">{r.wins}</span>
                        <span className="hidden tabular-nums sm:block">{r.scored ? Math.round(r.avgScore / 100) : "–"}</span>
                        <span className="text-right tabular-nums text-fg/90">{toUsdc(r.totalEarned).toFixed(2)}</span>
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
          className={cx("lift relative flex h-full flex-col overflow-hidden !rounded-[22px] p-6", first ? "card-gold" : "card")}
        >
          {first && <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/20 blur-3xl" aria-hidden />}
          <div className="relative flex items-start justify-between">
            <span className={cx("num text-[76px] italic", first ? "text-foil" : "text-fg/80")}>{pad(place + 1)}</span>
            <div className="relative">
              <Avatar id={row.worker} name={row.name} size={56} />
              <span className="absolute -bottom-3 -left-4">
                <PixelIcon name={PODIUM_ICON[place]} px={1.5} motion={first ? "spin" : "bob"} />
              </span>
            </div>
          </div>
          <div className="relative mt-5 text-[19px] font-semibold">
            {who ?? shortAddr(row.worker, 5)} {me && <span className="mono-label ml-1 !text-[9.5px] text-gold-2">You</span>}
          </div>
          <div className="relative text-[13.5px] text-muted">{city ?? `${row.submissions} ${row.submissions === 1 ? "entry" : "entries"}`}</div>
          <div className="relative mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
            <span>
              <b className="text-[19px] tabular-nums">
                <Counter value={row.rating} />
              </b>{" "}
              <span className="text-muted">rating</span>
            </span>
            <span>
              <b className="text-[19px] tabular-nums">{row.wins}</b> <span className="text-muted">wins</span>
            </span>
            <span>
              <b className="text-[19px] tabular-nums">
                <Counter value={toUsdc(row.totalEarned)} decimals={2} />
              </b>{" "}
              <span className="text-muted">USDC</span>
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
