"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, ChevronDown, Lock, LogIn, Plus, Search, Sparkles } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useAccount } from "@/components/auth/Account";
import { TaskCard } from "@/components/TaskCard";
import { Counter, Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Container, Countdown, Empty, Kicker, Skeleton, Spinner, StatusPill, cx } from "@/components/ui";
import type { TaskPayload } from "@/components/arena/types";
import { getJSON, postJSON } from "@/lib/client/api";
import { useWorker } from "@/lib/client/hooks";
import { fmtUsdc, shortAddr, timeAgo, toUsdc } from "@/lib/format";
import type { TaskCard as TaskCardData } from "@/lib/server/views";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function DashboardPage() {
  const { role, signer, personaName, identityReady } = useApp();
  const account = useAccount();
  const me = signer?.publicKey.toBase58() ?? null;

  if (!identityReady) {
    return (
      <Container className="flex flex-col gap-8">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-1/2" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 !rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-64 !rounded-[18px]" />
      </Container>
    );
  }
  if (!role || !me) {
    return (
      <Container className="relative flex min-h-[64vh] flex-col items-center justify-center gap-6 text-center">
        <div className="aura left-[calc(50%-9rem)] top-1/4 h-72 w-72 bg-gold/15" aria-hidden />
        <PixelIcon name="monkey" px={3.6} motion="bob" />
        <h1 className="display text-[clamp(2.6rem,6vw,4.4rem)]">
          Your <em className="text-gold-2">dashboard</em>
        </h1>
        <p className="max-w-md leading-relaxed text-muted">
          {account.enabled
            ? account.authenticated
              ? "Finish setting up your account to see your tasks, entries and earnings."
              : "Sign in to see your tasks, entries and earnings."
            : "Pick a demo account at the top right to see its dashboard."}
        </p>
        {account.enabled &&
          (account.authenticated ? (
            <Link href="/welcome" className="btn btn-red h-12 px-6">
              Finish setting up <ArrowRight size={17} />
            </Link>
          ) : (
            <button className="btn btn-red h-12 px-6" onClick={account.login}>
              <LogIn size={17} /> Sign in
            </button>
          ))}
      </Container>
    );
  }
  return (
    <Container className="flex flex-col gap-10">
      {role === "company" ? <Hiring me={me} name={personaName.split(" · ")[0]} /> : <Working me={me} name={personaName.split(" · ")[0]} />}
      <Settings />
    </Container>
  );
}

/* ---------- organisations: their tasks, who entered, reports */
const FILTERS = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "done", label: "Finished" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const order = (t: TaskCardData) => (t.status === "open" ? 0 : t.status === "judging" ? 1 : 2);
const isLive = (t: TaskCardData) => t.status === "open" || t.status === "judging";
const awaitingPick = (t: TaskCardData) =>
  t.status === "judging" && t.judgeMode === "creatorPicks" && t.submissionCount > 0 && t.scoredCount === t.submissionCount;

function Hiring({ me, name }: { me: string; name: string }) {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const mine = useMemo(
    () => (state.tasks ?? []).filter((t) => t.creator === me).sort((a, b) => order(a) - order(b) || b.createdAt - a.createdAt),
    [state.tasks, me],
  );
  const live = mine.filter(isLive);
  const picks = mine.filter(awaitingPick);
  const shown = filter === "all" ? mine : filter === "live" ? live : mine.filter((t) => !isLive(t));
  const stats = [
    { label: "Live tasks", value: live.length },
    { label: "USDC in escrow", value: toUsdc(live.reduce((a, t) => a + t.reward, 0)), decimals: 2, cls: "text-gold-2" },
    { label: "USDC paid out", value: toUsdc(mine.reduce((a, t) => a + t.paidOut, 0)), decimals: 2 },
    { label: "Entries received", value: mine.reduce((a, t) => a + t.submissionCount, 0) },
  ];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal y={8}>
            <Kicker>Organisation · {name}</Kicker>
          </Reveal>
          <Kinetic text="My *tasks*" accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]" />
          <Reveal delay={0.15} className="mt-3 text-[15px] text-muted">
            What&apos;s live, who entered, and every judge&apos;s report.
          </Reveal>
        </div>
        <Reveal delay={0.2} className="flex flex-wrap gap-2">
          <Link href="/tasks" className="btn btn-line h-11 px-5">
            Marketplace
          </Link>
          <Link href="/tasks/new" className="btn btn-red h-11 px-5">
            <Plus size={16} strokeWidth={2.5} /> Post a task
          </Link>
        </Reveal>
      </div>
      <StatRow stats={stats} />

      <AnimatePresence>
        {picks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-gold flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <Sparkles size={16} className="text-gold-2" /> Needs you
            </div>
            {picks.map((t) => (
              <Link key={t.pubkey} href={`/tasks/${t.pubkey}`} className="well group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-fg/[0.05]">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.title}</span>
                  <span className="text-[13px] text-muted">The AI shortlist is ready. Pick the winner to release the reward.</span>
                </span>
                <span className="btn btn-red h-9 shrink-0 px-4 text-[13px]">
                  Pick winner <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LayoutGroup id="dash-filter">
            <div className="flex rounded-full p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]" role="tablist">
              {FILTERS.map((f) => {
                const n = f.id === "all" ? mine.length : f.id === "live" ? live.length : mine.length - live.length;
                return (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={cx("relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors", filter === f.id ? "text-bg" : "text-muted hover:text-fg")}
                  >
                    {filter === f.id && (
                      <motion.span layoutId="dash-filter-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 480, damping: 38 }} />
                    )}
                    <span className="relative">
                      {f.label} <span className="opacity-60">{n}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <span className="text-[13px] text-muted">Open a task to see who entered and how they scored.</span>
        </div>
        {!state.tasks ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 !rounded-[18px]" />)
        ) : mine.length === 0 ? (
          <Empty className="flex flex-col items-center gap-3">
            <PixelIcon name="cash" px={3} motion="bob" />
            You haven&apos;t posted a task yet.
            <Link href="/tasks/new" className="btn btn-red mt-2 h-11">
              Post your first task
            </Link>
          </Empty>
        ) : shown.length === 0 ? (
          <Empty>Nothing here yet.</Empty>
        ) : (
          shown.map((t, i) => <HiringRow key={t.pubkey} task={t} index={i} />)
        )}
      </div>
    </>
  );
}

function HiringRow({ task, index }: { task: TaskCardData; index: number }) {
  const [open, setOpen] = useState(index === 0 && task.status !== "settled" && task.status !== "cancelled");
  const [data, setData] = useState<TaskPayload | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const load = () =>
      getJSON<TaskPayload>(`/api/tasks/${task.pubkey}`)
        .then((d) => alive && setData(d))
        .catch(() => {});
    load();
    const id = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [open, task.pubkey]);
  const subs = [...(data?.submissions ?? [])].sort((a, b) => (b.scored ? b.score : -1) - (a.scored ? a.score : -1) || a.index - b.index);
  const scored = subs.filter((s) => s.scored);
  const top = scored[0]?.score;
  const avg = scored.length ? scored.reduce((a, s) => a + s.score, 0) / scored.length : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.5, ease: EASE }}
      className={cx("card overflow-hidden transition-colors duration-300", open && "!border-line-2")}
    >
      <button
        className="grid w-full items-center gap-4 p-5 text-left transition-colors hover:bg-fg/[0.02] sm:grid-cols-[1fr_auto_auto_auto] sm:p-6"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={task.status} />
            <span className="label !text-[10px]">{task.categoryLabel}</span>
            {awaitingPick(task) && <span className="mono-label rounded-full bg-gold/15 px-2 py-0.5 !text-[9.5px] text-gold-2">Pick a winner</span>}
          </div>
          <div className="mt-2 truncate text-[17px] font-semibold">{task.title}</div>
        </div>
        <div className="text-[13px] text-muted">
          {task.status === "open" ? (
            <Countdown deadline={task.deadline} />
          ) : task.status === "judging" ? (
            `${task.scoredCount} / ${task.submissionCount} scored`
          ) : (
            timeAgo(task.settledAt || task.closedAt || task.createdAt)
          )}
        </div>
        <div className="text-[13px]">
          <b className="text-[17px] tabular-nums">{task.submissionCount}</b> <span className="text-muted">{task.submissionCount === 1 ? "entry" : "entries"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="num text-[2rem]">{fmtUsdc(task.status === "settled" ? task.paidOut : task.reward)}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="flex h-8 w-8 items-center justify-center rounded-full bg-fg/[0.05]">
            <ChevronDown size={16} className="text-muted" />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <span className="text-[15px] font-semibold">Who entered</span>
                  {scored.length > 0 && (
                    <span className="text-[13px] text-muted">
                      Top score <b className="text-fg">{((top ?? 0) / 100).toFixed(1)}</b> · average <b className="text-fg">{(avg / 100).toFixed(1)}</b>
                    </span>
                  )}
                </div>
                <Link href={`/tasks/${task.pubkey}`} className="group flex items-center gap-1.5 text-[13.5px] font-semibold text-gold-2 transition-colors hover:text-fg">
                  {task.status === "open" ? "Open task" : "Full reports"} <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
              {!data ? (
                <div className="flex justify-center py-6 text-muted">
                  <Spinner />
                </div>
              ) : subs.length === 0 ? (
                <p className="py-3 text-[14px] text-muted">No entries yet. Share the task, or wait for the crowd.</p>
              ) : (
                <div className="flex flex-col divide-y divide-line">
                  {subs.map((s) => (
                    <div key={s.pubkey} className="flex items-center gap-3 py-3">
                      <Avatar id={s.worker} name={s.workerName} size={34} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/workers/${s.worker}`} className="truncate text-[14.5px] font-semibold transition-colors hover:text-gold-2">
                          {s.workerName ?? shortAddr(s.worker)}
                        </Link>
                        <div className="truncate text-[12.5px] text-muted">
                          Entered {timeAgo(s.submittedAt)}
                          {s.report?.report.summary ? <span className="serif-quote text-[14px] text-fg/70"> · “{s.report.report.summary}”</span> : null}
                        </div>
                      </div>
                      {task.status === "open" ? (
                        <span className="mono-label flex items-center gap-1 !text-[10px] text-muted">
                          <Lock size={11} /> Sealed
                        </span>
                      ) : s.scored ? (
                        <div className="text-right">
                          <div className={cx("num text-2xl", s.rank === 1 && "text-gold-2")}>{(s.score / 100).toFixed(1)}</div>
                          {s.payout > 0 && <div className="font-mono text-[11.5px] font-semibold text-green">+{fmtUsdc(s.payout, { decimals: 2 })}</div>}
                        </div>
                      ) : (
                        <span className="mono-label !text-[10px] text-blue-2">Scoring</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- freelancers: entries, results, earnings, what to do next */
function Working({ me, name }: { me: string; name: string }) {
  const { state } = useApp();
  const worker = useWorker(me, 6000);
  const rep = worker?.reputation;
  const history = worker?.history ?? [];
  const active = history.filter((h) => h.taskStatus === "open" || (h.taskStatus === "judging" && !h.scored));
  const results = history.filter((h) => h.scored);
  const entered = new Set(history.map((h) => h.task));
  const suggestions = (state.tasks ?? [])
    .filter((t) => t.status === "open" && !entered.has(t.pubkey) && t.creator !== me && (rep?.rating ?? 0) >= t.minRating)
    .sort((a, b) => b.reward - a.reward)
    .slice(0, 3);
  const stats = [
    { label: "Rating", value: rep?.rating ?? 0, cls: "text-gold-2" },
    { label: "Wins", value: rep?.wins ?? 0 },
    { label: "USDC earned", value: toUsdc(rep?.totalEarned ?? 0), decimals: 2 },
    { label: "USDC in wallet", value: toUsdc(worker?.usdc ?? 0), decimals: 2 },
  ];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal y={8}>
            <Kicker>Freelancer · {name}</Kicker>
          </Reveal>
          <Kinetic text="My *work*" accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]" />
          <Reveal delay={0.15} className="mt-3 text-[15px] text-muted">
            Your entries, your scores, and what you&apos;ve earned.
          </Reveal>
        </div>
        <Reveal delay={0.2} className="flex flex-wrap gap-2">
          <Link href="/wallet" className="btn btn-line h-11 px-5">
            Wallet
          </Link>
          <Link href="/tasks" className="btn btn-red h-11 px-5">
            <Search size={15} strokeWidth={2.5} /> Find work
          </Link>
        </Reveal>
      </div>
      <StatRow stats={stats} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Section title="In progress" count={active.length}>
            {!worker ? (
              <Skeleton className="my-3 h-14" />
            ) : active.length === 0 ? (
              <p className="py-3 text-[14px] text-muted">Nothing in progress. Pick a task and submit your best work.</p>
            ) : (
              active.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="group flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate font-semibold transition-colors group-hover:text-gold-2">{h.taskTitle}</div>
                    <div className="text-[12.5px] text-muted">
                      {h.category} · entered {timeAgo(h.submittedAt)}
                    </div>
                  </div>
                  <span className="mono-label flex shrink-0 items-center gap-1 !text-[10px] text-muted">
                    {h.taskStatus === "open" ? (
                      <>
                        <Lock size={11} /> Sealed
                      </>
                    ) : (
                      <span className="text-blue-2">Being judged</span>
                    )}
                  </span>
                </Link>
              ))
            )}
          </Section>
          <Section title="Results" count={results.length}>
            {results.length === 0 ? (
              <p className="py-3 text-[14px] text-muted">Your scores and payouts show up here once tasks are judged.</p>
            ) : (
              results.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 py-3.5">
                  <span className={cx("num text-[2.4rem]", h.rank === 1 && "text-gold-2")}>{Math.round(h.score / 100)}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold transition-colors group-hover:text-gold-2">{h.taskTitle}</div>
                    {h.summary && <div className="serif-quote truncate text-[15px] text-fg/70">“{h.summary}”</div>}
                  </div>
                  <div className="text-right">
                    {h.rank > 0 && <div className={cx("mono-label !text-[10px]", h.rank === 1 ? "text-gold-2" : "text-fg/70")}>{["", "1st", "2nd", "3rd"][h.rank]}</div>}
                    <div className={cx("font-mono text-[13px] font-semibold", h.payout > 0 ? "text-green" : "text-faint")}>
                      {h.payout > 0 ? `+${fmtUsdc(h.payout, { decimals: 2 })}` : "—"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </Section>
        </div>
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div className="label px-1">Open tasks for you</div>
          {suggestions.length === 0 ? <Empty>No new open tasks right now.</Empty> : suggestions.map((t, i) => <TaskCard key={t.pubkey} task={t} index={i} compact />)}
          <Link href={`/workers/${me}`} className="btn btn-line mt-1 h-11 w-full">
            View my public profile
          </Link>
        </div>
      </div>
    </>
  );
}

function StatRow({ stats }: { stats: { label: string; value: number; decimals?: number; cls?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s, i) => (
        <Reveal key={s.label} delay={i * 0.05}>
          <div className="card p-5">
            <div className="label">{s.label}</div>
            <div className={cx("num mt-3 text-[2.6rem]", s.cls)}>
              <Counter value={s.value} decimals={s.decimals ?? 0} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Reveal>
      <div className="card p-6">
        <div className="flex items-baseline gap-2 text-[17px] font-semibold">
          {title} <span className="text-faint">{count}</span>
        </div>
        <div className="mt-2 flex flex-col divide-y divide-line">{children}</div>
      </div>
    </Reveal>
  );
}

/* ---------- account settings: result emails */
function Settings() {
  const { persona } = useApp();
  const account = useAccount();
  const profile = account.me?.profile;
  const [saving, setSaving] = useState(false);
  if (persona !== "account" || !profile) return null;
  const toggle = async () => {
    setSaving(true);
    try {
      await postJSON("/api/me", {
        handle: profile.handle ?? "",
        displayName: profile.displayName,
        role: profile.role,
        company: profile.company ?? undefined,
        city: profile.city ?? undefined,
        bio: profile.bio ?? undefined,
        skills: profile.skills,
        languages: profile.languages,
        emailOnWin: !profile.emailOnWin,
      });
      await account.refresh();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Reveal>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <div className="text-[15px] font-semibold">Result emails</div>
          <div className="mt-0.5 text-[13.5px] text-muted">
            {profile.role === "company" ? "When your tasks are judged, shortlisted or paid out" : "When your entries are judged or paid"}, sent to{" "}
            {account.me?.email ?? "your email"}.
          </div>
        </div>
        <button
          role="switch"
          aria-checked={profile.emailOnWin}
          aria-label="Result emails"
          disabled={saving}
          onClick={toggle}
          className={cx("relative h-7 w-12 rounded-full transition-colors duration-300", profile.emailOnWin ? "bg-green/80" : "bg-fg/15")}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={cx("absolute top-1 h-5 w-5 rounded-full bg-fg shadow", profile.emailOnWin ? "right-1" : "left-1")}
          />
        </button>
      </div>
    </Reveal>
  );
}
