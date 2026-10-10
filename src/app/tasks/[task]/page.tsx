"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Gavel, Lock, Send, ShieldCheck, Sparkles, Trophy, Users, Wand2, XCircle } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Entry } from "@/components/arena/Entry";
import type { CrowdEvent, JudgeEvent, LiveState, LogLine, TaskPayload } from "@/components/arena/types";
import { Avatar, CategoryBadge, Countdown, Empty, ExplorerLink, ScoreNumber, Spinner, StatusPill, Usdc, cx } from "@/components/ui";
import { getJSON, postJSON, runAction, streamEvents } from "@/lib/client/api";
import { templateById } from "@/lib/demo";
import { fmtUsdc, shortAddr } from "@/lib/format";
import { sha256Hex } from "@/lib/hash";

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
  const { signer, personaName, refresh: refreshState } = useApp();
  const [data, setData] = useState<TaskPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>(emptyLive);
  const [log, setLog] = useState<LogLine[]>([]);
  const [judging, setJudging] = useState(false);
  const [summoning, setSummoning] = useState(false);
  const [mine, setMine] = useState<Record<string, string>>({});
  const logId = useRef(0);

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
      await streamEvents<JudgeEvent>("/api/judge", { task: taskKey }, (e) => {
        switch (e.type) {
          case "start":
            push("ai", `Judge online: ${e.engine === "claude" ? e.model : "offline heuristics"} · ${e.count} entries`);
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
  }, [taskKey, push, load, refreshState]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex justify-center py-24 text-muted">
        <Spinner />
      </div>
    );
  }

  const sealed = task.status === "open";
  const fee = (task.reward * task.feeBps) / 10000;
  const pool = task.reward - fee;
  const template = templateById(task.template);
  const subs = [...data.submissions].sort((a, b) => {
    if (task.status === "open") return a.index - b.index;
    const sa = a.scored ? a.score : (live.scored.get(a.pubkey) ?? -1);
    const sb = b.scored ? b.score : (live.scored.get(b.pubkey) ?? -1);
    return sb - sa || a.index - b.index;
  });
  const podiumRank = new Map(task.podium.map((p, i) => [p.submission, i + 1]));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={task.status} />
            <CategoryBadge category={task.category} />
            {task.origin === "x402" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky/30 bg-sky/10 px-2 py-0.5 text-xs font-semibold text-sky">
                <Bot size={12} /> Posted by AI agent via x402
              </span>
            )}
            {task.minRating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ember/30 bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">
                <Lock size={11} /> Reputation {task.minRating}+ only
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Avatar id={task.creator} name={task.creatorName} size={18} />
              {task.agent?.name ?? task.creatorName ?? shortAddr(task.creator)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={14} /> {task.submissionCount} entries
            </span>
            <span className="inline-flex items-center gap-1">
              <Trophy size={14} /> {task.payoutMode === "topThree" ? "Top 3 · 50/30/20" : "Winner takes all"}
            </span>
            <span>{task.judgeMode === "aiFinal" ? "AI score is final" : "AI shortlists, creator picks"}</span>
            {task.status === "open" && <Countdown deadline={task.deadline} />}
            <ExplorerLink kind="address" id={task.pubkey}>
              task account
            </ExplorerLink>
          </div>
        </div>
        <div className="card shrink-0 px-5 py-3 text-right">
          <div className="label">{task.status === "settled" ? "Paid out" : "Locked in escrow"}</div>
          <Usdc
            base={task.status === "settled" ? task.paidOut : data.vaultBalance || task.reward}
            className={cx("font-display text-4xl font-bold", task.status === "settled" ? "text-jade" : "text-gold")}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-5">
          <details className="card group p-5" open={task.status === "open"}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="font-display font-semibold">The brief</span>
              <span className="inline-flex items-center gap-1 text-xs text-jade">
                <ShieldCheck size={13} /> sha256 {task.briefHash.slice(0, 10)}… on-chain
              </span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-text/90">
              {data.brief?.text ?? "Brief not available on this server (only its hash is on-chain)."}
            </pre>
          </details>

          {task.status === "open" && !isCreator && (
            <SubmitPanel
              taskKey={taskKey}
              minRating={task.minRating}
              already={!!myEntry}
              committedHash={myEntry?.contentHash}
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

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Entries <span className="text-muted">({data.submissions.length})</span>
              </h2>
              {sealed && data.submissions.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Lock size={12} /> sealed until submissions close
                </span>
              )}
            </div>
            {subs.length === 0 ? (
              <Empty>No entries yet. Be the first, or summon the crowd.</Empty>
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
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="label mb-3">Control room</div>
            <div className="flex flex-col gap-2">
              {task.status === "open" && (
                <>
                  <button className="btn btn-violet w-full py-3" disabled={judging || task.submissionCount === 0} onClick={runJudge}>
                    {judging ? <Spinner /> : <Gavel size={17} />} {isCreator ? "Close & judge" : "Close & judge (demo)"}
                  </button>
                  <button className="btn btn-ghost w-full" disabled={summoning || judging} onClick={summon}>
                    {summoning ? <Spinner /> : <Users size={16} />} Summon the crowd
                  </button>
                </>
              )}
              {task.status === "judging" && task.scoredCount < task.submissionCount && (
                <button className="btn btn-violet w-full py-3" disabled={judging} onClick={runJudge}>
                  {judging ? <Spinner /> : <Gavel size={17} />} {judging ? "Judging…" : "Resume judging"}
                </button>
              )}
              {task.status === "judging" && task.judgeMode === "creatorPicks" && task.scoredCount === task.submissionCount && (
                <PickPanel data={data} isCreator={isCreator} onPicked={load} nameOf={nameOf} push={push} />
              )}
              {task.status === "open" && isCreator && task.submissionCount === 0 && (
                <CancelButton taskKey={taskKey} onDone={load} push={push} />
              )}
              {task.status === "settled" && <SettledSummary data={data} nameOf={nameOf} />}
              {task.status === "cancelled" && <p className="text-sm text-muted">Cancelled before any entries. Escrow refunded.</p>}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-muted">
              <div className="flex justify-between">
                <span>Worker pool</span>
                <span>{fmtUsdc(pool, { decimals: 2 })} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee ({task.feeBps / 100}%)</span>
                <span>{fmtUsdc(fee, { decimals: 2 })} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Escrow vault</span>
                <ExplorerLink kind="address" id={task.vault} />
              </div>
            </div>
          </div>

          {task.podium.length > 0 && task.status !== "open" && (
            <div className="card p-4">
              <div className="label mb-2">On-chain podium</div>
              <div className="space-y-2">
                {task.podium.map((p, i) => (
                  <Link key={p.submission} href={`/workers/${p.worker}`} className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-white/5">
                    <span className="w-6 text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                    <Avatar id={p.worker} name={names[p.worker]} size={26} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(p.worker)}</span>
                    <ScoreNumber score={p.score} className="text-lg text-gold" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <LiveLog log={log} />

          {data.txs.length > 0 && (
            <div className="card p-4">
              <div className="label mb-2">On-chain activity</div>
              <ul className="space-y-1.5 text-xs">
                {[...data.txs].reverse().slice(0, 14).map((t) => (
                  <li key={t.sig} className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted">{t.label}</span>
                    <ExplorerLink id={t.sig} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SubmitPanel({
  taskKey,
  minRating,
  already,
  sample,
  personaName,
  onDone,
  committedHash,
}: {
  taskKey: string;
  minRating: number;
  already: boolean;
  committedHash?: string;
  sample?: string;
  personaName: string;
  onDone: (content: string) => void;
}) {
  const { signer } = useApp();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hash = useMemo(() => (content ? sha256Hex(content) : ""), [content]);

  if (already) {
    return (
      <div className="card flex items-center gap-3 border-jade/40 p-4 text-sm">
        <ShieldCheck className="text-jade" size={20} />
        <span>
          You&apos;re in. Your entry is committed on-chain as{" "}
          <span className="font-mono text-xs text-muted">sha256 {committedHash?.slice(0, 16)}…</span> and stays sealed until judging.
        </span>
      </div>
    );
  }

  async function submit() {
    if (!signer) return setErr("Pick a worker persona (top right) or connect a wallet.");
    setBusy(true);
    setErr(null);
    try {
      const { hash } = await postJSON<{ hash: string }>("/api/submissions", {
        task: taskKey,
        worker: signer.publicKey.toBase58(),
        content,
        workerName: personaName,
      });
      await runAction(signer, { kind: "submit", task: taskKey, contentHash: hash });
      onDone(content);
      setContent("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-semibold">Enter the arena</h2>
        {sample && (
          <button className="inline-flex items-center gap-1 text-xs text-gold hover:underline" onClick={() => setContent(sample)}>
            <Wand2 size={12} /> fill a sample
          </button>
        )}
      </div>
      <textarea
        className="input mt-3 min-h-32 text-[15px] leading-relaxed"
        placeholder="Your best work. It is hashed and committed on-chain; nobody sees it until submissions close."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-faint">{hash ? `sha256 ${hash.slice(0, 24)}…` : minRating > 0 ? `requires rating ${minRating}+` : " "}</span>
        <button className="btn btn-gold" disabled={!content.trim() || busy} onClick={submit}>
          {busy ? <Spinner /> : <Send size={15} />} Submit as {personaName.split(" · ")[0]}
        </button>
      </div>
      {err && <p className="mt-3 rounded-lg bg-crimson/10 p-2 text-sm text-crimson">{err}</p>}
    </div>
  );
}

function PickPanel({
  data,
  isCreator,
  onPicked,
  nameOf,
  push,
}: {
  data: TaskPayload;
  isCreator: boolean;
  onPicked: () => void;
  nameOf: (k: string) => string;
  push: (tone: LogLine["tone"], text: string, sig?: string) => void;
}) {
  const { signer } = useApp();
  const [busy, setBusy] = useState<number | null>(null);
  const shortlist = data.task.podium;
  if (!shortlist.length) return <p className="text-sm text-muted">Nothing cleared the quality bar.</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        <Sparkles size={13} className="mr-1 inline text-violet" />
        AI shortlist is on-chain. {isCreator ? "Pick the winner:" : "Waiting for the creator to pick."}
      </p>
      {shortlist.map((p, i) => (
        <button
          key={p.submission}
          disabled={!isCreator || busy !== null}
          className="btn btn-ghost w-full justify-between"
          onClick={async () => {
            if (!signer) return;
            setBusy(i);
            try {
              const { sig } = await runAction(signer, { kind: "settle_pick", task: data.task.pubkey, pick: i });
              push("money", `Creator picked ${nameOf(p.worker)}`, sig);
              onPicked();
            } catch (e) {
              push("bad", (e as Error).message);
            } finally {
              setBusy(null);
            }
          }}
        >
          <span className="truncate">
            #{p.index + 1} {nameOf(p.worker)}
          </span>
          {busy === i ? <Spinner /> : <ScoreNumber score={p.score} className="text-gold" />}
        </button>
      ))}
    </div>
  );
}

function CancelButton({ taskKey, onDone, push }: { taskKey: string; onDone: () => void; push: (tone: LogLine["tone"], text: string, sig?: string) => void }) {
  const { signer } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-ghost w-full text-muted"
      disabled={busy}
      onClick={async () => {
        if (!signer) return;
        setBusy(true);
        try {
          const { sig } = await runAction(signer, { kind: "cancel", task: taskKey });
          push("money", "Cancelled, escrow refunded", sig);
          onDone();
        } catch (e) {
          push("bad", (e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner /> : <XCircle size={15} />} Cancel & refund
    </button>
  );
}

function SettledSummary({ data, nameOf }: { data: TaskPayload; nameOf: (k: string) => string }) {
  const paid = data.submissions.filter((s) => s.rank > 0).sort((a, b) => a.rank - b.rank);
  const settleTx = [...data.txs].reverse().find((t) => t.kind === "settle");
  return (
    <div className="space-y-2">
      {paid.length === 0 ? (
        <p className="text-sm text-muted">No entry cleared the quality bar. The buyer was refunded in full.</p>
      ) : (
        paid.map((s) => (
          <Link key={s.pubkey} href={`/workers/${s.worker}`} className="flex items-center gap-2 rounded-lg bg-jade/5 p-2 hover:bg-jade/10">
            <span className="text-lg">{["", "🥇", "🥈", "🥉"][s.rank]}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(s.worker)}</span>
            <span className="text-sm font-bold text-jade">+{fmtUsdc(s.payout, { decimals: 2 })}</span>
          </Link>
        ))
      )}
      {settleTx && (
        <div className="pt-1 text-xs text-muted">
          Released in one transaction · <ExplorerLink id={settleTx.sig} />
        </div>
      )}
    </div>
  );
}

const TONE: Record<LogLine["tone"], string> = {
  info: "text-muted",
  good: "text-jade",
  warn: "text-ember",
  bad: "text-crimson",
  ai: "text-violet",
  money: "text-gold",
};

function LiveLog({ log }: { log: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);
  if (!log.length) return null;
  return (
    <div className="card p-4">
      <div className="label mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet" /> Live
      </div>
      <div ref={ref} className="max-h-80 space-y-1 overflow-y-auto pr-1 font-mono text-[11.5px] leading-relaxed">
        {log.map((l) => (
          <div key={l.id} className={cx("animate-rise", TONE[l.tone])}>
            <span className="text-faint">{new Date(l.at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })} </span>
            {l.text}
            {l.sig && (
              <>
                {" "}
                <ExplorerLink id={l.sig}>tx</ExplorerLink>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
