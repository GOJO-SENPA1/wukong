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
export function TaskCard({ task, index = 0 }: { task: TaskCardData; index?: number }) {
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
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 8) * 0.05 }}
    >
      <Link
        href={`/tasks/${task.pubkey}`}
        className="card group relative grid items-center gap-5 overflow-hidden p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-navy hover:shadow-[0_24px_48px_-28px_rgb(12_20_36/0.45)] sm:p-6 md:grid-cols-[auto_1fr_170px_120px]"
      >
        {/* red edge that grows on hover */}
        <span className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-red transition-transform duration-500 ease-out group-hover:scale-y-100" aria-hidden />
        <div className="hidden md:block">
          <PixelIcon name={categoryIcon(task.category)} px={2.2} motion="hover" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-muted">{task.categoryLabel}</span>
            {task.origin === "x402" && (
              <span className="mono-label inline-flex items-center gap-1 rounded bg-blue/10 px-1.5 py-0.5 !text-[10px] text-blue">
                <Bot size={11} /> Posted by an AI agent
              </span>
            )}
            {task.status !== "open" && (
              <span
                className={cx(
                  "mono-label rounded px-1.5 py-0.5 !text-[10px]",
                  task.status === "judging" ? "bg-blue/10 text-blue" : task.status === "settled" ? "bg-green/10 text-green" : "bg-paper-2 text-muted",
                )}
              >
                {task.status === "judging" ? "Judging" : task.status === "settled" ? "Paid out" : "Refunded"}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-[18px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-red sm:text-[19px]">{task.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
        <div>
          <div className={cx("mono-label", task.status === "open" ? (urgent ? "text-red" : "text-navy") : "text-muted")}>
            {task.status === "open" ? <Countdown deadline={task.deadline} /> : task.status === "judging" ? "Scoring now" : "Closed"}
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-paper-2">
            <motion.div
              className={cx("h-full rounded-full", task.status === "open" ? (urgent ? "bg-red" : "bg-navy") : task.status === "settled" ? "bg-green" : "bg-blue")}
              initial={{ width: 0 }}
              animate={{ width: `${task.status === "open" ? elapsed * 100 : 100}%` }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + Math.min(index, 8) * 0.05 }}
            />
          </div>
          <div className="mt-2 text-[12.5px] text-muted">
            {task.submissionCount} {task.submissionCount === 1 ? "entry" : "entries"}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 md:block md:text-right">
          <div className="display text-[44px] leading-none tabular-nums transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-[1.04] md:origin-right">
            {toUsdc(amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted md:justify-end">
            {task.status === "settled" ? "USDC paid" : "USDC"}
            <ArrowRight size={14} className="-translate-x-2 text-red opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
