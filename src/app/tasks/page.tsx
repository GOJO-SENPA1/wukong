"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { useApp } from "@/components/Providers";
import { TaskCard } from "@/components/TaskCard";
import { SetupNotice } from "@/components/SetupNotice";
import { Counter, Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Empty, Kicker, Skeleton, TierBadge, cx } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { useWorker } from "@/lib/client/hooks";
import { fmtScore, toUsdc } from "@/lib/format";
import { categoryIcon } from "@/lib/fx/sprites";

const STATUS = [
  { id: "live", label: "Open & judging" },
  { id: "open", label: "Open" },
  { id: "settled", label: "Paid out" },
  { id: "all", label: "Everything" },
] as const;
const SORTS = [
  { id: "ending", label: "Ending soon" },
  { id: "reward", label: "Highest reward" },
  { id: "entries", label: "Fewest entries" },
  { id: "new", label: "Newest" },
] as const;

export default function TasksPage() {
  const { state, role, identityReady } = useApp();
  const [status, setStatus] = useState<(typeof STATUS)[number]["id"]>("live");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("ending");
  const [cat, setCat] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [noStake, setNoStake] = useState(false);

  const all = state.tasks ?? [];
  const openCount = all.filter((t) => t.status === "open").length;
  const tasks = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = all.filter(
      (t) =>
        (status === "all" || (status === "live" ? t.status === "open" || t.status === "judging" : t.status === status)) &&
        (cat === null || t.category === cat) &&
        (!noStake || t.entryStake === 0) &&
        (!query || `${t.title} ${t.creatorName ?? ""} ${t.categoryLabel} ${t.agent?.name ?? ""}`.toLowerCase().includes(query)),
    );
    const rank = (s: string) => (s === "open" ? 0 : s === "judging" ? 1 : 2);
    return list.sort((a, b) => {
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      if (sort === "reward") return b.reward - a.reward;
      if (sort === "entries") return a.submissionCount - b.submissionCount;
      if (sort === "new") return b.createdAt - a.createdAt;
      return a.deadline - b.deadline;
    });
  }, [all, status, cat, noStake, q, sort]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal y={8}>
            <Kicker>{identityReady && role === "worker" ? "Find work" : "The marketplace"}</Kicker>
          </Reveal>
          <Kinetic text={"Open work, *escrowed.*"} accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]" />
          <Reveal delay={0.2} className="mt-4 text-[15px] text-muted">
            <Counter value={openCount} className="font-semibold text-fg" /> open {openCount === 1 ? "task" : "tasks"} · every reward already locked in
            escrow
          </Reveal>
        </div>
        <Reveal delay={0.25} className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="relative flex-1 sm:w-72 sm:flex-none">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input !pl-10" placeholder="Search tasks, companies, skills" value={q} onChange={(e) => setQ(e.target.value)} />
            <AnimatePresence>
              {q && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-fg/10 p-1 text-muted transition-colors hover:text-fg"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
          <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Reveal>
      </div>

      <Reveal delay={0.3} className="flex flex-col gap-3">
        <LayoutGroup id="cats">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip active={cat === null} onClick={() => setCat(null)} group="cat">
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} group="cat">
                <PixelIcon name={categoryIcon(c.id)} px={0.9} className="-my-1 -ml-1" />
                {c.label}
              </Chip>
            ))}
          </div>
        </LayoutGroup>
        <LayoutGroup id="status">
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {STATUS.map((s) => (
              <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)} group="status" small>
                {s.label}
              </Chip>
            ))}
            <span className="mx-1 h-5 w-px shrink-0 bg-line-2" />
            <label
              className={cx("chip shrink-0 cursor-pointer !py-1.5 text-[13px]", noStake && "!text-fg !shadow-[inset_0_0_0_1px_rgb(216_179_108/0.5)]")}
            >
              <input type="checkbox" className="accent-gold" checked={noStake} onChange={(e) => setNoStake(e.target.checked)} />
              No entry stake
            </label>
          </div>
        </LayoutGroup>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {!state.ready && state.error && <SetupNotice />}
          {!state.tasks && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 !rounded-[18px]" />)}
          {state.tasks && tasks.length === 0 && (
            <Empty className="flex flex-col items-center gap-3">
              <PixelIcon name="monkey" px={3} motion="bob" />
              {state.tasks.length === 0
                ? role === "company"
                  ? "No tasks yet. Post the first one: it goes live the moment the reward is locked."
                  : "No tasks yet. New tasks appear here the moment an organisation locks the reward."
                : "Nothing matches. Try another filter, or post the first task like it."}
            </Empty>
          )}
          <AnimatePresence mode="popLayout">
            {tasks.map((t, i) => (
              <TaskCard key={t.pubkey} task={t} index={i} />
            ))}
          </AnimatePresence>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  group,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  group: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx("chip relative shrink-0", small && "!py-1.5 text-[13px]", active && "!text-bg !shadow-none")}
      aria-pressed={active}
    >
      {active && (
        <motion.span
          layoutId={`chip-${group}`}
          className="absolute inset-0 rounded-full bg-fg"
          transition={{ type: "spring", stiffness: 480, damping: 38 }}
        />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </button>
  );
}

function Sidebar() {
  const { signer, role, personaName } = useApp();
  const pk = signer?.publicKey.toBase58();
  const [who, city] = personaName.split(" · ");
  const worker = useWorker(role === "worker" ? pk : null);
  const rep = worker?.reputation;
  const active = (worker?.history ?? []).filter((h) => h.taskStatus === "open" || h.taskStatus === "judging" || h.scored).slice(0, 4);

  if (role === "company") {
    return (
      <Reveal delay={0.35} className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="card-gold relative overflow-hidden p-6">
          <div className="absolute right-4 top-4">
            <PixelIcon name="cash" px={2.8} motion="bob" />
          </div>
          <div className="label">Hiring as</div>
          <div className="mt-1.5 text-lg font-semibold">{who}</div>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Post a brief, lock the reward and get many finished takes back, judged in public.
          </p>
          <Link href="/tasks/new" className="btn btn-red mt-6 h-11 w-full">
            Post a task <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard" className="btn btn-line mt-2 h-11 w-full">
            Track my tasks
          </Link>
        </div>
        <Tip />
      </Reveal>
    );
  }

  return (
    <Reveal delay={0.35} className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="card-gold relative overflow-hidden p-6">
        <div className="flex items-center gap-3">
          {pk && <Avatar id={pk} name={who} size={44} />}
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">{role ? who : "Browsing as a guest"}</div>
            <div className="text-[13px] text-muted">{role ? `Freelancer${city ? ` · ${city}` : ""}` : "Sign in as a freelancer to enter"}</div>
          </div>
        </div>
        <div className="well mt-6 grid grid-cols-3 gap-3 p-3.5">
          <div>
            <div className="num text-[1.9rem]">{rep ? <Counter value={rep.rating} /> : "0"}</div>
            <div className="mt-1 text-[11px] text-muted">rating</div>
          </div>
          <div>
            <div className="num text-[1.9rem]">{rep ? <Counter value={rep.wins} /> : "0"}</div>
            <div className="mt-1 text-[11px] text-muted">wins</div>
          </div>
          <div>
            <div className="num text-[1.9rem] text-gold-2">{rep ? <Counter value={toUsdc(rep.totalEarned)} decimals={2} /> : "0"}</div>
            <div className="mt-1 text-[11px] text-muted">USDC earned</div>
          </div>
        </div>
        {rep && (
          <div className="mt-4">
            <TierBadge rating={rep.rating} />
          </div>
        )}
        {pk && role ? (
          <Link href={`/workers/${pk}`} className="btn btn-line mt-5 h-10 w-full">
            View public profile
          </Link>
        ) : (
          <Link href="/signin" className="btn btn-ivory mt-5 h-10 w-full">
            Sign in to enter tasks
          </Link>
        )}
      </div>
      {role && (
        <div className="card p-5">
          <div className="text-[15px] font-semibold">Your entries</div>
          {active.length === 0 ? (
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">No entries yet. Pick a task on the left and submit your best work.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-line">
              {active.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="group py-3 first:pt-0 last:pb-0">
                  <div className="text-[14px] font-medium leading-snug transition-colors group-hover:text-gold-2">{h.taskTitle}</div>
                  <div className={cx("mono-label mt-1 !text-[10px]", h.scored ? "text-blue-2" : "text-muted")}>
                    {h.scored
                      ? `Scored ${fmtScore(h.score)}${h.rank ? ` · #${h.rank}` : ""}`
                      : h.taskStatus === "open"
                        ? "Sealed · waiting for close"
                        : "Judging"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      <Tip />
    </Reveal>
  );
}

function Tip() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line p-4 text-[13px] leading-relaxed text-muted">
      <PixelIcon name="lock" px={1.4} className="-ml-1 -mt-1 shrink-0" />
      Entries stay sealed until the deadline. Nobody, not even the organisation, can read yours before then.
    </div>
  );
}
