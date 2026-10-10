"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/components/Providers";
import { TaskCard } from "@/components/TaskCard";
import { SetupNotice } from "@/components/SetupNotice";
import { Empty, cx } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "judging", label: "Judging" },
  { id: "settled", label: "Paid out" },
] as const;

export default function TasksPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [cat, setCat] = useState<number | null>(null);
  const tasks = (state.tasks ?? []).filter(
    (t) => (filter === "all" || t.status === filter) && (cat === null || t.category === cat),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">The Arena</h1>
          <p className="mt-1 text-muted">Every reward here is already locked in escrow. Pick a task, do your best work, get paid if you win.</p>
        </div>
        <Link href="/tasks/new" className="btn btn-gold">
          <Plus size={16} /> Post a task
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cx("rounded-full border px-3 py-1 text-sm", filter === f.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted hover:text-text")}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 w-px bg-line" />
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(cat === c.id ? null : c.id)}
            className={cx("rounded-full border px-3 py-1 text-sm", cat === c.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted hover:text-text")}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {!state.ready && <SetupNotice />}
      {state.ready && tasks.length === 0 && <Empty>No tasks match. Post the first one.</Empty>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <TaskCard key={t.pubkey} task={t} />
        ))}
      </div>
    </div>
  );
}
