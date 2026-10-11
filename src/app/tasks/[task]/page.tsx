"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Bot, ChevronRight, Gavel, Lock, Users } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useAccount } from "@/components/auth/Account";
import { Entry } from "@/components/arena/Entry";
import { CancelButton, EscrowCard, JudgeStage, LiveLog, PickPanel, Rubric, SealedBanner, SettledSummary, ShareBlink, SubmitPanel } from "@/components/arena/Panels";
import type { CrowdEvent, JudgeEvent, LiveState, LogLine, TaskPayload } from "@/components/arena/types";
import { Kinetic, Reveal, Scramble } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Avatar, Countdown, Empty, ExplorerLink, Skeleton, Spinner, cx } from "@/components/ui";
import { getJSON, runAction, streamEvents } from "@/lib/client/api";
import { templateById } from "@/lib/demo";
import { fmtUsdc, shortAddr } from "@/lib/format";
import { categoryIcon } from "@/lib/fx/sprites";

const emptyLive = (): LiveState => ({ scoring: new Set(), scored: new Map(), signals: new Map(), verified: new Map() });

function mineKey(task: string) {
  return `wukong.mine.${task}`;
}
function loadMine(task: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(mineKey(task)) ?? "{}");
  } catch {
    return {};
  }
}

export default function ArenaPage({ params }: { params: Promise<{ task: string }> }) {
  const { task: taskKey } = use(params);
  const { signer, personaName, refresh: refreshState, state: appState, role } = useApp();
  const account = useAccount();
  const demoMode = appState.demoMode === true;
  const [data, setData] = useState<TaskPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>(emptyLive);
  const [log, setLog] = useState<LogLine[]>([]);
  const [judging, setJudging] = useState(false);
  const [summoning, setSummoning] = useState(false);
  const [mine, setMine] = useState<Record<string, string>>({});
  const logId = useRef(0);
  const escrowRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setData(await getJSON<TaskPayload>(`/api/tasks/${taskKey}`));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [taskKey]);

  useEffect(() => {
    load();
    setMine(loadMine(taskKey));
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, [load, taskKey]);

  const push = useCallback((tone: LogLine["tone"], text: string, sig?: string) => {
    setLog((l) => [...l, { id: ++logId.current, at: Date.now(), tone, text, sig }].slice(-80));
  }, []);

  const me = signer?.publicKey.toBase58();
  const task = data?.task;
  const isCreator = !!task && me === task.creator;
  const myEntry = data?.submissions.find((s) => s.worker === me);
  const names = data?.names ?? {};
  const nameOf = (k: string) => names[k] ?? shortAddr(k);

  const runJudge = useCallback(async () => {
    setJudging(true);
    setLive(emptyLive());
    try {
      // The creator closes their own task with a signed transaction; the judge
      // takes over from there. (In demo mode anyone can ask the judge to close.)
      if (task?.status === "open" && isCreator && signer) {
        const { sig } = await runAction(signer, { kind: "close", task: taskKey });
        push("good", "Creator closed submissions on-chain", sig);
      }
      await streamEvents<JudgeEvent>("/api/judge", { task: taskKey }, (e) => {
        switch (e.type) {
          case "start":
            push("ai", `${e.engine === "ai" ? "AI judge" : "Offline judge"} online · ${e.count} entries`);
            break;
          case "tx":
            push("good", e.label, e.sig);
            break;
          case "log":
            push("info", e.message);
            break;
          case "verify":
            setLive((s) => ({ ...s, verified: new Map(s.verified).set(e.submission, e.ok) }));
            push(e.ok ? "info" : "bad", `#${e.index + 1} ${e.ok ? "✓" : "✗"} ${e.detail}`);
            break;
          case "signal":
            setLive((s) => {
              const signals = new Map(s.signals);
              signals.set(e.submission, [...(signals.get(e.submission) ?? []), { flag: e.flag, detail: e.detail }]);
              return { ...s, signals };
            });
            push("bad", `#${e.index + 1} flagged ${e.flag.replace(/_/g, " ")}: ${e.detail}`);
            break;
          case "scoring":
            setLive((s) => ({ ...s, scoring: new Set(s.scoring).add(e.submission) }));
            break;
          case "scored":
            setLive((s) => {
              const scoring = new Set(s.scoring);
              scoring.delete(e.submission);
              return { ...s, scoring, scored: new Map(s.scored).set(e.submission, e.score) };
            });
            push("ai", `#${e.index + 1} scored ${(e.score / 100).toFixed(1)} · ${e.report.summary}`);
            break;
          case "podium":
            push("info", `On-chain podium: ${e.podium.map((p) => `#${p.index + 1} (${(p.score / 100).toFixed(1)})`).join(" › ") || "empty"}`);
            break;
          case "settled":
            if (e.payouts.length) {
              for (const p of e.payouts) push("money", `Place ${p.place}: ${fmtUsdc(p.amount, { decimals: 2 })} USDC → ${nameOf(p.worker)}`);
            } else push("money", `Nothing cleared the quality bar: ${fmtUsdc(e.refunded)} USDC refunded to the buyer`);
            push("good", "Escrow released in one transaction", e.sig);
            if (e.payouts.length) burst(escrowRef.current, { icons: ["coin", "coin", "trophy", "gem"], count: 36 });
            break;
          case "stake":
            push(
              e.refunded ? "info" : "bad",
              `#${e.index + 1} stake ${e.refunded ? "refunded" : "slashed"}: ${fmtUsdc(e.amount, { decimals: 2 })} USDC ${e.refunded ? "back to" : "from"} ${nameOf(e.worker)}`,
            );
            break;
          case "awaiting_pick":
            push("ai", "AI shortlist is on-chain. Creator picks the winner.");
            break;
          case "error":
            push("bad", e.message);
            break;
        }
      });
    } catch (err) {
      push("bad", (err as Error).message);
    } finally {
      setJudging(false);
      load();
      refreshState();
    }
  }, [taskKey, push, load, refreshState, task?.status, isCreator, signer]); // eslint-disable-line react-hooks/exhaustive-deps

  const summon = useCallback(async () => {
    setSummoning(true);
    try {
      await streamEvents<CrowdEvent>("/api/crowd", { task: taskKey }, (e) => {
        if (e.type === "start") push("info", `Summoning ${e.count} workers from around the world…`);
        if (e.type === "submitted") {
          push("good", `${e.name} (${e.city}) committed an entry on-chain`, e.sig);
          load();
        }
        if (e.type === "skipped") push("warn", `${e.name}: ${e.reason}`);
        if (e.type === "error") push("bad", e.message);
      });
    } catch (err) {
      push("bad", (err as Error).message);
    } finally {
      setSummoning(false);
      load();
    }
  }, [taskKey, push, load]);

  if (error && !data) return <Empty>{error}</Empty>;
  if (!data || !task) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-60" />
        <Skeleton className="h-16 w-3/4" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const sealed = task.status === "open";
  const template = templateById(task.template);
  const subs = [...data.submissions].sort((a, b) => {
    if (task.status === "open") return a.index - b.index;
    const sa = a.scored ? a.score : (live.scored.get(a.pubkey) ?? -1);
    const sb = b.scored ? b.score : (live.scored.get(b.pubkey) ?? -1);
    return sb - sa || a.index - b.index;
  });
  const podiumRank = new Map(task.podium.map((p, i) => [p.submission, i + 1]));
  const liveScored = data.submissions.filter((s) => s.scored || live.scored.has(s.pubkey)).length;
  const canEnter = task.status === "open" && !isCreator && role === "worker";
  const needsSignIn = task.status === "open" && role === null && account.enabled && !account.authenticated;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <Reveal y={8} className="flex items-center gap-2 text-[14px]">
          <Link href="/tasks" className="link-underline text-muted transition-colors hover:text-fg">
            Marketplace
          </Link>
          <ChevronRight size={14} className="text-faint" />
          <span className="text-fg/80">{task.categoryLabel}</span>
        </Reveal>
        <Reveal y={8} delay={0.05} className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "mono-label inline-flex items-center gap-2 rounded-full px-3 py-1.5 !text-[10.5px]",
              task.status === "open" ? "bg-red/10 text-red-2" : task.status === "judging" ? "bg-blue/10 text-blue-2" : task.status === "settled" ? "bg-green/10 text-green" : "bg-fg/[0.06] text-muted",
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              {(task.status === "open" || task.status === "judging") && <span className="absolute inset-0 animate-ping rounded-full bg-current" />}
              <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {task.status === "open" ? (
              <>
                Open · closes in <Countdown deadline={task.deadline} className="ml-0.5" />
              </>
            ) : task.status === "judging" ? (
              "Judging"
            ) : task.status === "settled" ? (
              "Paid out"
            ) : (
              "Cancelled · refunded"
            )}
          </span>
          {sealed && (
            <span className="mono-label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 !text-[10.5px] text-fg/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.13)]">
              <Lock size={11} /> Entries sealed until close
            </span>
          )}
          {task.origin === "x402" && (
            <span className="mono-label inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-3 py-1.5 !text-[10.5px] text-blue-2">
              <Bot size={12} /> Posted by an AI agent via x402
            </span>
          )}
          {task.minRating > 0 && (
            <span className="mono-label inline-flex items-center gap-1.5 rounded-full bg-ember/10 px-3 py-1.5 !text-[10.5px] text-ember">Rating {task.minRating}+ only</span>
          )}
        </Reveal>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Kinetic text={task.title} className="display max-w-4xl text-[clamp(2.4rem,5vw,4.2rem)]" stagger={0.035} />
            <Reveal delay={0.2} className="mt-4 flex items-center gap-3">
              <Avatar id={task.creator} name={task.agent?.name ?? task.creatorName} size={40} />
              <div>
                <div className="text-[15px] font-semibold">{task.agent?.name ?? task.creatorName ?? shortAddr(task.creator)}</div>
                <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {task.submissionCount} {task.submissionCount === 1 ? "entry" : "entries"}
                  </span>
                  <span>{task.judgeMode === "aiFinal" ? "AI score is final" : "AI shortlists, creator picks"}</span>
                  <ExplorerLink kind="address" id={task.pubkey}>
                    task account
                  </ExplorerLink>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.25} className="hidden shrink-0 lg:block">
            <PixelIcon name={categoryIcon(task.category)} px={4.5} motion="bob" />
          </Reveal>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Reveal delay={0.1}>
            <div className="card p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[19px] font-semibold tracking-tight">The brief</h2>
                <span className="mono-label inline-flex items-center gap-1.5 !text-[10px] text-blue-2" title={`sha256 ${task.briefHash}`}>
                  ✓ Matches on-chain hash <Scramble text={task.briefHash.slice(0, 8)} className="text-faint" />
                </span>
              </div>
              <pre className="mt-5 max-w-3xl whitespace-pre-wrap font-sans text-[15.5px] leading-[1.75] text-fg/85">
                {data.brief?.text ?? "Brief not available on this server (only its hash is on-chain)."}
              </pre>
            </div>
          </Reveal>

          {task.status === "open" && (
            <Reveal delay={0.15}>
              <Rubric category={task.category} />
            </Reveal>
          )}

          {canEnter && (
            <SubmitPanel
              taskKey={taskKey}
              minRating={task.minRating}
              already={!!myEntry}
              committedHash={myEntry?.contentHash}
              stake={task.entryStake}
              sample={template?.sample}
              personaName={personaName}
              onDone={(content) => {
                const next = { ...mine, [me!]: content };
                setMine(next);
                try {
                  localStorage.setItem(mineKey(taskKey), JSON.stringify(next));
                } catch {
                  /* ignore */
                }
                push("good", `${personaName} committed an entry on-chain`);
                load();
              }}
            />
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="display text-4xl">
                Entries <span className="text-faint">{data.submissions.length}</span>
              </h2>
              {sealed && data.submissions.length > 0 && <SealedBanner count={data.submissions.length} />}
            </div>
            <AnimatePresence>
              {judging && <JudgeStage total={data.submissions.length} scored={liveScored} scoring={live.scoring.size} engine={appState.judge ? (appState.judge.engine === "ai" ? "AI judge" : "offline judge") : undefined} />}
            </AnimatePresence>
            {subs.length === 0 ? (
              <Empty className="flex flex-col items-center gap-3">
                <PixelIcon name="monkey" px={3} motion="bob" />
                No entries yet. Be the first{demoMode ? ", or summon the crowd" : ""}.
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {subs.map((s) => {
                  const mineContent = mine[s.worker];
                  return (
                    <Entry
                      key={s.pubkey}
                      sub={mineContent && !s.content ? { ...s, content: mineContent } : s}
                      sealed={sealed}
                      live={live}
                      mine={s.worker === me}
                      rankHint={task.status === "judging" ? podiumRank.get(s.pubkey) : undefined}
                      code={task.category === 2}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Reveal delay={0.15} x={20} y={0}>
            <EscrowCard data={data} ref={escrowRef}>
              {task.status === "open" && (
                <>
                  {canEnter && !myEntry && (
                    <a href="#enter" className="btn btn-red h-12 w-full">
                      Enter this task <ArrowDown size={16} />
                    </a>
                  )}
                  {needsSignIn && (
                    <Link href={`/signin?next=${encodeURIComponent(`/tasks/${taskKey}`)}`} className="btn btn-red h-12 w-full">
                      Sign in to enter
                    </Link>
                  )}
                  {role === "company" && !isCreator && (
                    <p className="well p-3 text-center text-[13px] leading-relaxed text-muted">You&apos;re viewing as an organisation. Only freelancer accounts can enter tasks.</p>
                  )}
                  {isCreator && task.judgeMode === "creatorPicks" && Date.now() / 1000 <= task.deadline && task.submissionCount < task.maxSubmissions ? (
                    <p className="text-center text-[13px] leading-relaxed text-muted">Creator-picks tasks close at the deadline. Then you pick the winner from the AI shortlist.</p>
                  ) : isCreator ? (
                    <button className="btn btn-red h-12 w-full" disabled={judging || task.submissionCount === 0} onClick={runJudge}>
                      {judging ? <Spinner /> : <Gavel size={17} />} Close and judge
                    </button>
                  ) : demoMode && task.demoCreator ? (
                    <button className="btn btn-line h-11 w-full" disabled={judging || task.submissionCount === 0} onClick={runJudge}>
                      {judging ? <Spinner /> : <Gavel size={16} />} Demo: close and judge now
                    </button>
                  ) : (
                    <p className="text-center text-[13px] leading-relaxed text-muted">Judging starts when the creator closes submissions or the deadline passes.</p>
                  )}
                  {demoMode && (
                    <button className="btn btn-line h-11 w-full" disabled={summoning || judging} onClick={summon}>
                      {summoning ? <Spinner /> : <Users size={16} />} Summon the crowd
                    </button>
                  )}
                  {isCreator && task.submissionCount === 0 && <CancelButton taskKey={taskKey} onDone={load} push={push} />}
                </>
              )}
              {task.status === "judging" && task.scoredCount < task.submissionCount && (
                <button className="btn btn-blue h-12 w-full" disabled={judging} onClick={runJudge}>
                  {judging ? <Spinner /> : <Gavel size={17} />} {judging ? "Judging…" : "Resume judging"}
                </button>
              )}
              {task.status === "judging" && task.judgeMode === "creatorPicks" && task.scoredCount === task.submissionCount && (
                <PickPanel
                  data={data}
                  isCreator={isCreator}
                  onPicked={() => {
                    load();
                    if (task.entryStake > 0) runJudge(); // refunds / slashes stakes
                  }}
                  nameOf={nameOf}
                  push={push}
                />
              )}
              {task.status === "settled" && <SettledSummary data={data} nameOf={nameOf} />}
              {task.status === "cancelled" && <p className="text-[14px] text-muted">Cancelled before any entries. Escrow refunded.</p>}
            </EscrowCard>
          </Reveal>

          <LiveLog log={log} />

          {task.status === "open" && (
            <Reveal delay={0.25}>
              <div className="card p-5">
                <div className="text-[15px] font-semibold">Good to know</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                  One entry per person. After the task closes you&apos;ll see every entry, every score and the judge&apos;s report on each.
                </p>
              </div>
            </Reveal>
          )}

          {task.status === "open" && <ShareBlink taskKey={taskKey} cluster={appState.deployment?.cluster} />}

          {data.txs.length > 0 && (
            <div className="card p-5">
              <div className="text-[15px] font-semibold">On-chain activity</div>
              <ul className="mt-3 flex flex-col gap-2 text-[12.5px]">
                {[...data.txs].reverse().slice(0, 12).map((t, i) => (
                  <motion.li
                    key={t.sig}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-muted">{t.label}</span>
                    <ExplorerLink id={t.sig} />
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-1 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            Pool {fmtUsdc(task.reward - (task.reward * task.feeBps) / 10000, { decimals: 2 })} USDC · fee {task.feeBps / 100}%
          </p>
        </aside>
      </div>
    </div>
  );
}
