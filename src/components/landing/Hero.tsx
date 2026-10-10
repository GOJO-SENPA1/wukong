"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Kinetic, Magnetic, Reveal, Scramble, Spotlight, Tilt } from "@/components/fx/motion";
import { Summon } from "@/components/fx/Summon";
import { Avatar, Countdown, Kicker } from "@/components/ui";
import { fmtUsdc, shortAddr } from "@/lib/format";
import type { TaskCard } from "@/lib/server/views";

export function Hero() {
  const { state } = useApp();
  const tasks = state.tasks ?? [];
  const live =
    tasks.filter((t) => t.status === "open").sort((a, b) => b.reward - a.reward)[0] ??
    tasks.find((t) => t.status === "judging") ??
    tasks[0];

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" aria-hidden />
      <Spotlight color="rgb(228 38 28 / 0.16)" size={620} />
      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:gap-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="flex flex-col justify-center">
          <Reveal y={10}>
            <Kicker dark>Competitive work · USDC escrow · Solana</Kicker>
          </Reveal>
          <Kinetic
            text={"Post a task.\nSummon the crowd.\n*Pay* *the* *best.*"}
            className="display mt-6 text-[clamp(3.1rem,5.6vw,6rem)]"
            delay={0.15}
            stagger={0.07}
          />
          <Reveal delay={0.7} className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/70">
            Lock a USDC reward in escrow. Workers anywhere take on the same brief, their entries sealed. An AI judge scores every one in public,
            and the best work is paid in a single on-chain transaction.
          </Reveal>
          <Reveal delay={0.85} className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link href="/tasks/new" className="btn btn-red h-12 px-6 text-[15px]">
                Post a task <ArrowRight size={18} />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tasks" className="btn btn-ghost-light h-12 px-6 text-[15px]">
                Find work
              </Link>
            </Magnetic>
          </Reveal>
          <Reveal delay={1} className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
            No crypto needed to start · sign up with Google or email
          </Reveal>
        </div>

        <div className="relative">
          <motion.div
            className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-navy-2 to-navy sm:aspect-square lg:aspect-[5/6]"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          >
            <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
            <div className="absolute inset-0">
              <Summon />
            </div>
          </motion.div>
          {live && <LiveCard task={live} />}
        </div>
      </div>
    </section>
  );
}

function LiveCard({ task }: { task: TaskCard }) {
  const avatars = ["Aarav", "Maya", "Tunde", "Sita", "Rohan"];
  return (
    <motion.div
      className="relative z-10 mx-auto -mt-12 w-[min(100%,380px)] sm:-mt-20 sm:mr-0 lg:absolute lg:-bottom-8 lg:-left-16 lg:mt-0 lg:w-[380px]"
      initial={{ opacity: 0, y: 40, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
    >
      <Tilt className="rounded-[20px]" max={10}>
        <Link href={`/tasks/${task.pubkey}`} className="block rounded-[20px] bg-white p-5 text-navy shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]">
          <div className="flex items-center justify-between gap-3">
            <span className="mono-label text-muted">{task.categoryLabel}</span>
            <span className="mono-label flex items-center gap-1.5 text-red">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />
              {task.status === "open" ? <Countdown deadline={task.deadline} /> : task.status}
            </span>
          </div>
          <div className="mt-2 text-[17px] font-semibold leading-snug tracking-tight">{task.title}</div>
          <div className="mt-0.5 text-[13px] text-muted">{task.agent ? task.agent.name : task.creatorName ?? shortAddr(task.creator)}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3">
            <div>
              <div className="display text-[26px] leading-none">{fmtUsdc(task.reward, { decimals: 2 })}</div>
              <div className="mt-1 text-[11px] text-muted">USDC in escrow</div>
            </div>
            <div>
              <div className="display text-[26px] leading-none">{task.submissionCount}</div>
              <div className="mt-1 text-[11px] text-muted">sealed entries</div>
            </div>
            <div>
              <div className="display text-[26px] leading-none">{task.payoutMode === "topThree" ? "Top 3" : "Winner"}</div>
              <div className="mt-1 text-[11px] text-muted">{task.payoutMode === "topThree" ? "paid 50 · 30 · 20" : "takes all"}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {avatars.slice(0, Math.max(2, Math.min(5, task.submissionCount))).map((n) => (
                  <Avatar key={n} id={n} name={n} size={26} ring />
                ))}
              </div>
              <span className="ml-2 text-[12px] text-muted">competing</span>
            </div>
            <span className="mono-label flex items-center gap-1 !text-[10px] text-blue">
              Vault <Scramble text={shortAddr(task.vault, 4)} trigger="mount" duration={1400} /> <ArrowUpRight size={12} />
            </span>
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
}
