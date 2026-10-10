"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Bot } from "lucide-react";
import type { TaskCard as TaskCardData } from "@/lib/server/views";
import { fmtUsdc, shortAddr, toUsdc } from "@/lib/format";
import { categoryIcon } from "@/lib/fx/sprites";
import { PixelIcon } from "./fx/PixelIcon";
import { Countdown, cx } from "./ui";

/** A task as a wide row: what it is on the left, time and entries in the middle, the reward on the right. */
export function TaskCard({ task, index = 0, compact = false }: { task: TaskCardData; index?: number; compact?: boolean }) {
  if (compact) return <CompactTaskCard task={task} index={index} />;
  const total = Math.max(1, task.deadline - task.createdAt);
  const elapsed = Math.max(0, Math.min(1, 1 - (task.deadline - Date.now() / 1000) / total));
  const urgent = task.status === "open" && task.deadline - Date.now() / 1000 < 3 * 3600;
  const amount = task.status === "settled" ? task.paidOut : task.reward;
  const meta = [
    task.agent ? task.agent.name : task.creatorName ?? shortAddr(task.creator),
    task.payoutMode === "topThree" ? "Top 3 paid" : "Winner takes all",
    task.entryStake > 0 ? `${fmtUsdc(task.entryStake)} USDC entry stake` : "No stake",
    task.minRating > 0 ? `Rating ${task.minRating}+` : "Open to all",
  ];
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 8) * 0.04 }}
    >
      <Link
        href={`/tasks/${task.pubkey}`}
        className="card lift group relative grid items-center gap-5 overflow-hidden p-5 hover:!border-gold/25 sm:p-6 md:grid-cols-[auto_1fr_170px_130px]"
      >
        {/* an edge of light that grows on hover */}
        <span
          className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-gradient-to-b from-red via-gold to-gold/0 transition-transform duration-700 ease-out group-hover:scale-y-100"
          aria-hidden
        />
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-fg/[0.03] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.05)] md:flex">
          <PixelIcon name={categoryIcon(task.category)} px={1.9} motion="hover" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">{task.categoryLabel}</span>
            {task.origin === "x402" && (
              <span className="mono-label inline-flex items-center gap-1 rounded-full bg-blue/10 px-2 py-0.5 !text-[9.5px] text-blue-2">
                <Bot size={11} /> Posted by an AI agent
              </span>
            )}
            {task.status !== "open" && (
              <span
                className={cx(
                  "mono-label rounded-full px-2 py-0.5 !text-[9.5px]",
                  task.status === "judging" ? "bg-blue/10 text-blue-2" : task.status === "settled" ? "bg-green/10 text-green" : "bg-fg/[0.06] text-muted",
                )}
              >
                {task.status === "judging" ? "Judging" : task.status === "settled" ? "Paid out" : "Refunded"}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-[17.5px] font-semibold leading-snug tracking-tight sm:text-[18.5px]">{task.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
            {meta.map((m, i) => (
              <span key={m} className="flex items-center gap-3">
                {i > 0 && <span className="h-0.5 w-0.5 rounded-full bg-faint" />}
                {m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className={cx("mono-label !text-[10.5px]", task.status === "open" ? (urgent ? "text-red-2" : "text-fg/80") : "text-muted")}>
            {task.status === "open" ? <Countdown deadline={task.deadline} /> : task.status === "judging" ? "Scoring now" : "Closed"}
          </div>
          <div className="mt-2.5 h-px w-full overflow-hidden bg-fg/[0.08]">
            <motion.div
              className={cx(
                "h-full",
                task.status === "open" ? (urgent ? "bg-red" : "bg-gradient-to-r from-gold/40 to-gold") : task.status === "settled" ? "bg-green" : "bg-blue",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${task.status === "open" ? elapsed * 100 : 100}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 + Math.min(index, 8) * 0.04 }}
            />
          </div>
          <div className="mt-2.5 text-[12.5px] text-muted">
            {task.submissionCount} {task.submissionCount === 1 ? "entry" : "entries"}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 md:block md:text-right">
          <div className="num text-[2.9rem] text-fg transition-colors duration-500 group-hover:text-gold-2">
            {toUsdc(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-muted md:justify-end">
            {task.status === "settled" ? "USDC paid" : "USDC"}
            <ArrowRight size={13} className="-translate-x-1.5 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** The same task, stacked for a narrow column: title and maker, then time left and the reward. */
function CompactTaskCard({ task, index }: { task: TaskCardData; index: number }) {
  const urgent = task.status === "open" && task.deadline - Date.now() / 1000 < 3 * 3600;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 8) * 0.04 }}
    >
      <Link href={`/tasks/${task.pubkey}`} className="card lift group flex flex-col gap-3 p-5 hover:!border-gold/25">
        <div className="flex items-center justify-between gap-3">
          <span className="label !text-[10px]">{task.categoryLabel}</span>
          <span className={cx("mono-label !text-[10px]", urgent ? "text-red-2" : "text-fg/70")}>
            {task.status === "open" ? <Countdown deadline={task.deadline} /> : "Judging"}
          </span>
        </div>
        <div>
          <div className="text-[15.5px] font-semibold leading-snug tracking-tight">{task.title}</div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted">
            {task.agent ? task.agent.name : (task.creatorName ?? shortAddr(task.creator))} · {task.submissionCount}{" "}
            {task.submissionCount === 1 ? "entry" : "entries"}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="flex items-baseline gap-1.5">
            <span className="num text-[2rem] transition-colors duration-500 group-hover:text-gold-2">{toUsdc(task.reward).toLocaleString("en-US")}</span>
            <span className="text-[11px] font-medium text-muted">USDC</span>
          </span>
          <ArrowRight size={15} className="mb-1.5 -translate-x-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      </Link>
    </motion.div>
  );
}
