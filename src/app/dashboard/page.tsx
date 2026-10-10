"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Lock, LogIn, Plus } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useAccount } from "@/components/auth/Account";
import { TaskCard } from "@/components/TaskCard";
import { Counter, Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Container, Countdown, Empty, Skeleton, Spinner, StatusPill, cx } from "@/components/ui";
import type { TaskPayload } from "@/components/arena/types";
import { getJSON, postJSON } from "@/lib/client/api";
import { useWorker } from "@/lib/client/hooks";
import { fmtUsdc, shortAddr, timeAgo, toUsdc } from "@/lib/format";
import type { TaskCard as TaskCardData } from "@/lib/server/views";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function DashboardPage() {
  const { role, signer, personaName } = useApp();
  const account = useAccount();
  const me = signer?.publicKey.toBase58() ?? null;

  if (!role || !me) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <PixelIcon name="monkey" px={4} motion="bob" />
        <h1 className="display text-5xl">Your dashboard</h1>
        <p className="max-w-md text-muted">
          {account.enabled ? "Sign in to see your tasks, entries and earnings." : "Pick a demo account at the top right to see its dashboard."}
        </p>
        {account.enabled && !account.authenticated && (
          <button className="btn btn-red h-12 px-6" onClick={account.login}>
            <LogIn size={17} /> Sign in
          </button>
        )}
      </Container>
    );
  }
  return (
    <Container className="flex flex-col gap-8">
      {role === "company" ? <Hiring me={me} name={personaName.split(" · ")[0]} /> : <Working me={me} name={personaName.split(" · ")[0]} />}
      <Settings />
    </Container>
  );
}

/* ---------- organisations: their tasks, who entered, reports */
function Hiring({ me, name }: { me: string; name: string }) {
  const { state } = useApp();
  const mine = useMemo(
    () =>
      (state.tasks ?? [])
        .filter((t) => t.creator === me)
        .sort((a, b) => rank(a) - rank(b) || b.createdAt - a.createdAt),
    [state.tasks, me],
  );
  const live = mine.filter((t) => t.status === "open" || t.status === "judging");
  const stats = [
    { label: "Live tasks", value: live.length },
    { label: "USDC in escrow", value: toUsdc(live.reduce((a, t) => a + t.reward, 0)), decimals: 2 },
    { label: "USDC paid out", value: toUsdc(mine.reduce((a, t) => a + t.paidOut, 0)), decimals: 2 },
    { label: "Entries received", value: mine.reduce((a, t) => a + t.submissionCount, 0) },
  ];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mono-label text-muted">Organisation · {name}</div>
          <Kinetic text="My tasks" className="display mt-2 text-[clamp(3rem,7vw,5.5rem)]" />
        </div>
        <Link href="/tasks/new" className="btn btn-red h-12 px-6">
          <Plus size={17} /> Post a task
        </Link>
      </div>
      <StatRow stats={stats} />
      <div className="flex flex-col gap-3">
        {!state.tasks ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
        ) : mine.length === 0 ? (
          <Empty className="flex flex-col items-center gap-3">
            <PixelIcon name="cash" px={3} motion="bob" />
            You haven&apos;t posted a task yet.
            <Link href="/tasks/new" className="btn btn-red mt-2 h-11">
              Post your first task
            </Link>
          </Empty>
        ) : (
          mine.map((t, i) => <HiringRow key={t.pubkey} task={t} index={i} />)
        )}
      </div>
    </>
  );
}

const rank = (t: TaskCardData) => (t.status === "open" ? 0 : t.status === "judging" ? 1 : 2);

function HiringRow({ task, index }: { task: TaskCardData; index: number }) {
  const [open, setOpen] = useState(index === 0 && task.status !== "settled");
  const [data, setData] = useState<TaskPayload | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const load = () => getJSON<TaskPayload>(`/api/tasks/${task.pubkey}`).then((d) => alive && setData(d)).catch(() => {});
    load();
    const id = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [open, task.pubkey]);
  const subs = [...(data?.submissions ?? [])].sort((a, b) => (b.scored ? b.score : -1) - (a.scored ? a.score : -1) || a.index - b.index);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.5, ease: EASE }} className="card overflow-hidden">
      <button className="grid w-full items-center gap-4 p-5 text-left transition-colors hover:bg-paper/50 sm:grid-cols-[1fr_auto_auto_auto]" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={task.status} />
            <span className="mono-label !text-[10px] text-muted">{task.categoryLabel}</span>
          </div>
          <div className="mt-1.5 truncate text-[17px] font-semibold">{task.title}</div>
        </div>
        <div className="text-[13px] text-muted">{task.status === "open" ? <Countdown deadline={task.deadline} /> : task.status === "judging" ? "Being judged" : timeAgo(task.settledAt || task.closedAt || task.createdAt)}</div>
        <div className="text-[13px]">
          <b className="text-[17px] tabular-nums">{task.submissionCount}</b> <span className="text-muted">{task.submissionCount === 1 ? "entry" : "entries"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="display text-3xl tabular-nums">{fmtUsdc(task.status === "settled" ? task.paidOut : task.reward)}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown size={18} className="text-muted" />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            <div className="border-t border-line p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[15px] font-semibold">Who entered</div>
                <Link href={`/tasks/${task.pubkey}`} className="group flex items-center gap-1.5 text-[13.5px] font-semibold text-blue">
                  {task.status === "open" ? "Open task" : "Full reports"} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {!data ? (
                <div className="flex justify-center py-6 text-muted">
                  <Spinner />
                </div>
              ) : subs.length === 0 ? (
                <p className="py-3 text-[14px] text-muted">No entries yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-line">
                  {subs.map((s) => (
                    <div key={s.pubkey} className="flex items-center gap-3 py-3">
                      <Avatar id={s.worker} name={s.workerName} size={32} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/workers/${s.worker}`} className="truncate text-[14.5px] font-semibold hover:text-red">
                          {s.workerName ?? shortAddr(s.worker)}
                        </Link>
                        <div className="text-[12.5px] text-muted">
                          Entered {timeAgo(s.submittedAt)}
                          {s.report?.report.summary ? <span className="serif-quote text-navy/70"> · “{s.report.report.summary}”</span> : null}
                        </div>
                      </div>
                      {task.status === "open" ? (
                        <span className="mono-label flex items-center gap-1 !text-[10px] text-muted">
                          <Lock size={11} /> Sealed
                        </span>
                      ) : s.scored ? (
                        <div className="text-right">
                          <div className="display text-2xl">{(s.score / 100).toFixed(1)}</div>
                          {s.payout > 0 && <div className="font-mono text-[11.5px] font-bold text-green">+{fmtUsdc(s.payout, { decimals: 2 })}</div>}
                        </div>
                      ) : (
                        <span className="mono-label !text-[10px] text-blue">Scoring</span>
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
    { label: "Rating", value: rep?.rating ?? 0, cls: "text-red" },
    { label: "Wins", value: rep?.wins ?? 0 },
    { label: "USDC earned", value: toUsdc(rep?.totalEarned ?? 0), decimals: 2 },
    { label: "USDC in wallet", value: toUsdc(worker?.usdc ?? 0), decimals: 2 },
  ];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mono-label text-muted">Freelancer · {name}</div>
          <Kinetic text="My work" className="display mt-2 text-[clamp(3rem,7vw,5.5rem)]" />
        </div>
        <Link href="/tasks" className="btn btn-red h-12 px-6">
          Find work <ArrowRight size={17} />
        </Link>
      </div>
      <StatRow stats={stats} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Section title="In progress" count={active.length}>
            {!worker ? (
              <Skeleton className="h-20" />
            ) : active.length === 0 ? (
              <p className="text-[14px] text-muted">Nothing in progress. Pick a task and submit your best work.</p>
            ) : (
              active.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="group flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold transition-colors group-hover:text-red">{h.taskTitle}</div>
                    <div className="text-[12.5px] text-muted">{h.category} · entered {timeAgo(h.submittedAt)}</div>
                  </div>
                  <span className="mono-label flex shrink-0 items-center gap-1 !text-[10px] text-muted">
                    {h.taskStatus === "open" ? (
                      <>
                        <Lock size={11} /> Sealed
                      </>
                    ) : (
                      "Being judged"
                    )}
                  </span>
                </Link>
              ))
            )}
          </Section>
          <Section title="Results" count={results.length}>
            {results.length === 0 ? (
              <p className="text-[14px] text-muted">Your scores and payouts show up here once tasks are judged.</p>
            ) : (
              results.map((h) => (
                <Link key={h.pubkey} href={`/tasks/${h.task}`} className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 py-3">
                  <span className="display text-4xl">{Math.round(h.score / 100)}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold transition-colors group-hover:text-red">{h.taskTitle}</div>
                    {h.summary && <div className="serif-quote truncate text-[15px] text-navy/70">“{h.summary}”</div>}
                  </div>
                  <div className="text-right">
                    {h.rank > 0 && <div className="mono-label !text-[10px] text-red">{["", "1st", "2nd", "3rd"][h.rank]}</div>}
                    <div className={cx("font-mono text-[13px] font-semibold", h.payout > 0 ? "text-green" : "text-faint")}>{h.payout > 0 ? `+${fmtUsdc(h.payout, { decimals: 2 })}` : "—"}</div>
                  </div>
                </Link>
              ))
            )}
          </Section>
        </div>
        <div className="flex flex-col gap-3">
          <div className="mono-label px-1 text-muted">Open tasks for you</div>
          {suggestions.length === 0 ? (
            <Empty>No new open tasks right now.</Empty>
          ) : (
            suggestions.map((t, i) => <TaskCard key={t.pubkey} task={t} index={i} />)
          )}
          <Link href={`/workers/${me}`} className="link-underline px-1 text-[14px] font-semibold text-blue">
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
        <Reveal key={s.label} delay={i * 0.06}>
          <div className="card lift p-5">
            <div className="label">{s.label}</div>
            <div className={cx("display mt-2 text-[44px] leading-none", s.cls)}>
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
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-[15px] font-semibold">Result emails</div>
          <div className="text-[13.5px] text-muted">
            {profile.role === "company" ? "When your tasks are judged, shortlisted or paid out" : "When your entries are judged or paid"}, sent to {account.me?.email ?? "your email"}.
          </div>
        </div>
        <button
          role="switch"
          aria-checked={profile.emailOnWin}
          disabled={saving}
          onClick={toggle}
          className={cx("relative h-7 w-12 rounded-full transition-colors", profile.emailOnWin ? "bg-green" : "bg-line-2")}
        >
          <motion.span layout className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow", profile.emailOnWin ? "right-1" : "left-1")} />
        </button>
      </div>
    </Reveal>
  );
}
