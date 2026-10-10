"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Kinetic, Magnetic, Reveal, Scramble, Tilt } from "@/components/fx/motion";
import { Summon } from "@/components/fx/Summon";
import { Avatar, Countdown, Kicker } from "@/components/ui";
import { fmtUsdc, shortAddr } from "@/lib/format";
import type { TaskCard } from "@/lib/server/views";

export function Hero() {
  const { state, role, identityReady } = useApp();
  const tasks = state.tasks ?? [];
  const live =
    tasks.filter((t) => t.status === "open").sort((a, b) => b.reward - a.reward)[0] ??
    tasks.find((t) => t.status === "judging") ??
    tasks[0];
  // Each side gets its own way in: organisations post, freelancers find work.
  const r = identityReady ? role : null;
  const primary =
    r === "worker"
      ? { href: "/tasks", label: "Find work", Icon: Search }
      : r === "company"
        ? { href: "/tasks/new", label: "Post a task", Icon: ArrowRight }
        : { href: "/business", label: "Hire the crowd", Icon: ArrowRight };
  const secondary =
    r === "worker" ? { href: "/dashboard", label: "My work" } : r === "company" ? { href: "/dashboard", label: "My tasks" } : { href: "/tasks", label: "Find work" };

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div className="aura left-[-10%] top-[-20%] h-[620px] w-[620px] bg-red/25" aria-hidden />
      <div className="aura right-[-12%] top-[10%] h-[560px] w-[560px] bg-gold/15 [animation-delay:-6s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="flex flex-col justify-center">
          <Reveal y={8}>
            <Kicker>Competitive work · USDC escrow · Solana</Kicker>
          </Reveal>
          <Kinetic
            text={"Post a task.\nSummon the crowd.\n*Pay* *the* *best.*"}
            className="display mt-7 text-[clamp(3.3rem,6.6vw,6.9rem)] !leading-[0.92]"
            accent="text-foil italic"
            delay={0.1}
            stagger={0.06}
          />
          <Reveal delay={0.55} className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted">
            Lock a USDC reward in escrow. Freelancers anywhere take on the same brief, their entries sealed. An AI judge scores every one in
            public, and the best work is paid in a single on-chain transaction.
          </Reveal>
          <Reveal delay={0.7} className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <Link href={primary.href} className="btn btn-red h-12 px-6 text-[15px]">
                {primary.label} <primary.Icon size={17} />
              </Link>
            </Magnetic>
            <Link href={secondary.href} className="btn btn-line h-12 px-6 text-[15px]">
              {secondary.label}
            </Link>
          </Reveal>
          <Reveal delay={0.85} className="mt-10 flex flex-col gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {["No crypto needed", "Sign up with Google or email", "Paid out in seconds"].map((t, i) => (
              <span key={t} className="flex items-center gap-6">
                {i > 0 && <span className="hidden h-1 w-1 rounded-full bg-gold/60 sm:block" />}
                {t}
              </span>
            ))}
          </Reveal>
        </div>

        <div className="relative">
          <motion.div
            className="card-gold relative aspect-[4/5] overflow-hidden !rounded-[28px] sm:aspect-square lg:aspect-[5/6]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(115_131_255/0.14),transparent_60%)]" aria-hidden />
            <div className="grid-lines absolute inset-0 opacity-70" aria-hidden />
            <div className="absolute inset-0">
              <Summon />
            </div>
          </motion.div>
          {live && <LiveCard task={live} />}
        </div>
      </div>
      <div className="rule mx-auto max-w-7xl" />
    </section>
  );
}

function LiveCard({ task }: { task: TaskCard }) {
  const avatars = ["Aarav", "Maya", "Tunde", "Sita", "Rohan"];
  return (
    <motion.div
      className="relative z-10 mx-auto -mt-14 w-[min(100%,372px)] sm:-mt-20 sm:mr-0 lg:absolute lg:-bottom-10 lg:-left-16 lg:mt-0 lg:w-[372px]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.75 }}
    >
      <Tilt className="rounded-[20px]" max={7}>
        <Link
          href={`/tasks/${task.pubkey}`}
          className="block rounded-[20px] border border-line-2 bg-surface-2/85 p-5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.95)] backdrop-blur-xl transition-colors hover:border-gold/40"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="label">{task.categoryLabel}</span>
            <span className="mono-label flex items-center gap-1.5 !text-[10px] text-red-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />
              {task.status === "open" ? <Countdown deadline={task.deadline} /> : task.status}
            </span>
          </div>
          <div className="mt-2.5 text-[16.5px] font-semibold leading-snug tracking-tight">{task.title}</div>
          <div className="mt-0.5 text-[13px] text-muted">{task.agent ? task.agent.name : (task.creatorName ?? shortAddr(task.creator))}</div>
          <div className="well mt-4 grid grid-cols-3 gap-2 p-3">
            <div>
              <div className="num text-[26px] text-gold-2">{fmtUsdc(task.reward, { decimals: 0 })}</div>
              <div className="mt-1 text-[11px] text-muted">USDC in escrow</div>
            </div>
            <div>
              <div className="num text-[26px]">{task.submissionCount}</div>
              <div className="mt-1 text-[11px] text-muted">sealed entries</div>
            </div>
            <div>
              <div className="num text-[26px]">{task.payoutMode === "topThree" ? "Top 3" : "Winner"}</div>
              <div className="mt-1 text-[11px] text-muted">{task.payoutMode === "topThree" ? "paid 50 · 30 · 20" : "takes all"}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {avatars.slice(0, Math.max(2, Math.min(5, task.submissionCount))).map((n) => (
                  <Avatar key={n} id={n} name={n} size={24} ring />
                ))}
              </div>
              <span className="ml-2 text-[12px] text-muted">competing</span>
            </div>
            <span className="mono-label flex items-center gap-1 !text-[10px] text-blue-2">
              Vault <Scramble text={shortAddr(task.vault, 4)} trigger="mount" duration={1400} /> <ArrowUpRight size={12} />
            </span>
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
}
