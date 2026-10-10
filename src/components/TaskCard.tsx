"use client";

import Link from "next/link";
import { Bot, Lock, Trophy, Users } from "lucide-react";
import type { TaskCard as TaskCardData } from "@/lib/server/views";
import { CategoryBadge, Countdown, StatusPill, Usdc } from "./ui";

export function TaskCard({ task }: { task: TaskCardData }) {
  return (
    <Link
      href={`/tasks/${task.pubkey}`}
      className="card group flex animate-rise flex-col gap-3 p-4 transition-colors hover:border-gold/50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={task.status} />
        <CategoryBadge category={task.category} />
        {task.origin === "x402" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky/30 bg-sky/10 px-2 py-0.5 text-xs font-semibold text-sky">
            <Bot size={12} /> AI agent · x402
          </span>
        )}
        {task.minRating > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-ember/30 bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">
            <Lock size={11} /> Rating {task.minRating}+
          </span>
        )}
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-gold-2">{task.title}</h3>
        <p className="mt-0.5 text-sm text-muted">
          by {task.agent ? task.agent.name : task.creatorName ?? `${task.creator.slice(0, 4)}…${task.creator.slice(-4)}`}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <div>
          <div className="label">
            {task.status === "settled" ? "Paid out" : task.status === "cancelled" ? "Refunded" : "Reward in escrow"}
          </div>
          <Usdc
            base={task.status === "settled" ? task.paidOut : task.reward}
            className={`font-display text-2xl font-bold ${task.status === "settled" ? "text-jade" : task.status === "cancelled" ? "text-muted" : "text-gold"}`}
          />
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {task.submissionCount} {task.submissionCount === 1 ? "entry" : "entries"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy size={13} /> {task.payoutMode === "topThree" ? "Top 3 · 50/30/20" : "Winner takes all"}
          </span>
          {task.status === "open" && <Countdown deadline={task.deadline} />}
        </div>
      </div>
    </Link>
  );
}
