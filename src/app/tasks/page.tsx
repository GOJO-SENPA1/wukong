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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cx("rounded-full border px-3 py-1 text-sm", filter === f.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted hover:text-text")}
          >
            {f.label}
          </button>
        ))}
        </div>
        <span className="mx-1 hidden w-px self-stretch bg-line sm:block" aria-hidden />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(cat === c.id ? null : c.id)}
            aria-pressed={cat === c.id}
            className={cx("rounded-full border px-3 py-1 text-sm", cat === c.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted hover:text-text")}
          >
            {c.emoji} {c.label}
          </button>
        ))}
        </div>
      </div>

      {!state.ready && <SetupNotice />}
      {state.ready && tasks.length === 0 && (
        <div className="flex flex-col items-center gap-4">
          <Empty>
            No tasks {filter !== "all" || cat !== null ? "match these filters" : "yet"}.{" "}
            {filter !== "all" || cat !== null ? (
              <button
                className="text-gold hover:underline"
                onClick={() => {
                  setFilter("all");
                  setCat(null);
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link href="/tasks/new" className="text-gold hover:underline">
                Post the first one
              </Link>
            )}
          </Empty>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <TaskCard key={t.pubkey} task={t} />
        ))}
      </div>
    </div>
  );
}
