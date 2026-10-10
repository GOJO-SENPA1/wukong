"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { canonicalJson, sha256Hex } from "@/lib/hash";
import { fmtUsdc, shortAddr, timeAgo } from "@/lib/format";
import { stakeRefunded } from "@/lib/rules";
import { Avatar, ExplorerLink, ScoreBar, ScoreNumber, Spinner, cx } from "../ui";
import type { JudgeFlag, LiveState, SubmissionDetail } from "./types";

const FLAG_LABEL: Record<JudgeFlag, string> = {
  prompt_injection: "Prompt injection",
  duplicate: "Copycat",
  plagiarism_suspected: "Plagiarism",
  off_topic: "Off-topic",
  low_effort: "Low effort / spam",
  wrong_language: "Wrong language",
  constraint_violation: "Breaks the brief",
  unsafe: "Unsafe",
  content_missing: "Unverifiable",
};
const SEVERE: JudgeFlag[] = ["prompt_injection", "duplicate", "plagiarism_suspected", "low_effort", "unsafe", "content_missing", "wrong_language"];

const MEDALS = ["", "🥇", "🥈", "🥉"];

export function Entry({
  sub,
  sealed,
  live,
  mine,
  rankHint,
}: {
  sub: SubmissionDetail;
  sealed: boolean;
  live: LiveState;
  mine: boolean;
  rankHint?: number;
}) {
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const report = sub.report?.report;
  const scoring = live.scoring.has(sub.pubkey) && !sub.scored;
  const liveScore = live.scored.get(sub.pubkey);
  const score = sub.scored ? sub.score : liveScore;
  const flags: JudgeFlag[] = report?.flags ?? live.signals.get(sub.pubkey)?.map((s) => s.flag) ?? [];
  const severe = flags.some((f) => SEVERE.includes(f));
  const rank = sub.rank || rankHint || 0;

  // Re-derive the report hash in the browser and compare with the chain.
  useEffect(() => {
    if (!report || !sub.scored) return;
    setVerified(sha256Hex(canonicalJson(report)) === sub.reportHash);
  }, [report, sub.scored, sub.reportHash]);

  return (
    <div
      className={cx(
        "card animate-rise overflow-hidden transition-colors",
        rank === 1 && "border-gold/60 shadow-[0_0_40px_-12px_rgba(245,184,61,0.5)]",
        severe && sub.scored && "border-crimson/40",
        scoring && "border-violet/50",
      )}
    >
      {scoring && <div className="shimmer h-0.5 w-full" />}
      <div className="flex items-start gap-3 p-4">
        <Link href={`/workers/${sub.worker}`}>
          <Avatar id={sub.worker} name={sub.workerName} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-faint">#{sub.index + 1}</span>
            <Link href={`/workers/${sub.worker}`} className="truncate font-semibold hover:text-gold">
              {sub.workerName ?? shortAddr(sub.worker)}
            </Link>
            {mine && <span className="rounded bg-gold/15 px-1.5 text-[10px] font-bold uppercase text-gold">you</span>}
            {rank > 0 && <span className="text-lg leading-none">{MEDALS[rank]}</span>}
            <span className="text-xs text-faint">{timeAgo(sub.submittedAt)}</span>
          </div>

          {sealed && !mine ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-line-2 px-3 py-2 font-mono text-xs text-muted">
              <Lock size={12} /> sealed until judging · sha256 {sub.contentHash.slice(0, 16)}…
            </div>
          ) : (
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-text">
              {sub.content ?? "(content unavailable)"}
            </pre>
          )}

          {flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <span
                  key={f}
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    SEVERE.includes(f) ? "bg-crimson/15 text-crimson" : "bg-ember/15 text-ember",
                  )}
                  title={live.signals.get(sub.pubkey)?.find((s) => s.flag === f)?.detail}
                >
                  <ShieldAlert size={11} /> {FLAG_LABEL[f]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-20 shrink-0 flex-col items-end sm:w-24 gap-1.5">
          {scoring ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet">
              <Spinner /> judging
            </span>
          ) : score !== undefined && (sub.scored || liveScore !== undefined) ? (
            <>
              <ScoreNumber score={score} className={cx("text-3xl", severe ? "text-crimson" : rank === 1 ? "text-gold" : "text-text")} />
              <ScoreBar score={score} tone={severe ? "crimson" : rank === 1 ? "gold" : "violet"} />
            </>
          ) : (
            <span className="text-xs text-faint">{sealed ? "awaiting close" : "queued"}</span>
          )}
          {sub.payout > 0 && <span className="text-sm font-bold text-jade">+{fmtUsdc(sub.payout, { decimals: 2 })} USDC</span>}
          {sub.stake > 0 && (
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                !sub.stakeSettled
                  ? "bg-violet/10 text-violet"
                  : stakeRefunded(sub)
                    ? "bg-white/5 text-muted"
                    : "bg-crimson/15 text-crimson",
              )}
            >
              {!sub.stakeSettled
                ? `${fmtUsdc(sub.stake)} staked`
                : stakeRefunded(sub)
                  ? "stake refunded"
                  : `−${fmtUsdc(sub.stake)} slashed`}
            </span>
          )}
        </div>
      </div>

      {report && (
        <div className="border-t border-line">
          <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-muted hover:text-text">
            <span className="flex-1 truncate">
              <span className="font-semibold text-violet">Judge: </span>
              {report.summary}
            </span>
            <ChevronDown size={16} className={cx("transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <div className="space-y-2">
                {report.criteria.map((c) => (
                  <div key={c.key}>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {c.label} <span className="text-faint">· {Math.round(c.weight * 100)}%</span>
                      </span>
                      <span className="tabular-nums">{c.score}</span>
                    </div>
                    <ScoreBar score={c.score} max={100} tone="violet" />
                    <p className="mt-0.5 text-xs text-muted">{c.comment}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-sm">
                {report.strengths.length > 0 && (
                  <div>
                    <div className="label mb-1 text-jade">Strengths</div>
                    <ul className="list-inside list-disc space-y-0.5 text-muted">
                      {report.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.improvements.length > 0 && (
                  <div>
                    <div className="label mb-1 text-gold">Coaching for next round</div>
                    <ul className="list-inside list-disc space-y-0.5 text-muted">
                      {report.improvements.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.signals.length > 0 && (
                  <div>
                    <div className="label mb-1 text-crimson">Integrity signals</div>
                    <ul className="space-y-0.5 font-mono text-xs text-muted">
                      {report.signals.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-lg bg-ink p-2.5 font-mono text-[11px] leading-relaxed text-muted">
                  <div>
                    weighted {report.rawScore.toFixed(2)} → final {report.finalScore.toFixed(2)} → on-chain {report.onchainScore}
                  </div>
                  <div>
                    {report.engine} · {report.model} · rubric {report.rubric}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {verified ? (
                      <span className="inline-flex items-center gap-1 text-jade">
                        <ShieldCheck size={12} /> report sha256 matches chain
                      </span>
                    ) : verified === false ? (
                      <span className="text-crimson">report hash mismatch!</span>
                    ) : null}
                    {sub.report?.txSig && <ExplorerLink id={sub.report.txSig}>score tx</ExplorerLink>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
