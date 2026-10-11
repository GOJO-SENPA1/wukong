"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { canonicalJson, sha256Hex } from "@/lib/hash";
import { fmtUsdc, shortAddr, timeAgo } from "@/lib/format";
import { stakeRefunded } from "@/lib/rules";
import { Counter, Scramble } from "../fx/motion";
import { PixelIcon } from "../fx/PixelIcon";
import { Avatar, ExplorerLink, ScoreBar, cx } from "../ui";
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

const RANK_STYLE = ["", "bg-gradient-to-b from-gold-2 to-gold text-bg", "bg-gradient-to-b from-[#e9edf5] to-[#aab3c4] text-bg", "bg-gradient-to-b from-[#f0b98a] to-[#b9774a] text-bg"];
const PLACE = ["", "1st", "2nd", "3rd"];
const EASE = [0.16, 1, 0.3, 1] as const;

export function Entry({
  sub,
  sealed,
  live,
  mine,
  rankHint,
  code = false,
}: {
  sub: SubmissionDetail;
  sealed: boolean;
  live: LiveState;
  mine: boolean;
  rankHint?: number;
  /** render the content as code */
  code?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const report = sub.report?.report;
  const scoring = live.scoring.has(sub.pubkey) && !sub.scored;
  const liveScore = live.scored.get(sub.pubkey);
  const score = sub.scored ? sub.score : liveScore;
  const hasScore = score !== undefined && (sub.scored || liveScore !== undefined);
  const flags: JudgeFlag[] = report?.flags ?? live.signals.get(sub.pubkey)?.map((s) => s.flag) ?? [];
  const severe = flags.some((f) => SEVERE.includes(f));
  const rank = sub.rank || rankHint || 0;

  // Re-derive the report hash in the browser and compare with the chain.
  useEffect(() => {
    if (!report || !sub.scored) return;
    setVerified(sha256Hex(canonicalJson(report)) === sub.reportHash);
  }, [report, sub.scored, sub.reportHash]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ layout: { type: "spring", stiffness: 260, damping: 30 }, duration: 0.5, ease: EASE }}
      className={cx(
        "card relative overflow-hidden transition-[border-color,box-shadow] duration-500",
        rank === 1 && "!border-gold/50 shadow-[0_0_0_1px_rgb(216_179_108/0.25),0_30px_80px_-30px_rgb(216_179_108/0.45)]",
        severe && sub.scored && "!border-red/30",
        scoring && "!border-blue/60",
      )}
    >
      {/* the judge's scan beam, sweeping across while this entry is scored */}
      {scoring && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-blue/15 to-blue/0"
          initial={{ left: "-20%" }}
          animate={{ left: "110%" }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      )}
      {/* a flash the moment a score lands */}
      <AnimatePresence>
        {liveScore !== undefined && !sub.scored && (
          <motion.div
            key="flash"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-blue/10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start gap-4 p-5">
        <Link href={`/workers/${sub.worker}`} className="relative shrink-0">
          <Avatar id={sub.worker} name={sub.workerName} size={42} />
          {rank > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
              className={cx("absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold ring-2 ring-surface", RANK_STYLE[rank])}
            >
              {rank}
            </motion.span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-mono text-[11px] text-faint">#{sub.index + 1}</span>
            <Link href={`/workers/${sub.worker}`} className="truncate font-semibold transition-colors hover:text-gold-2">
              {sub.workerName ?? shortAddr(sub.worker)}
            </Link>
            {mine && <span className="mono-label rounded-full bg-red/15 px-2 py-0.5 !text-[9px] text-red-2">You</span>}
            {rank > 0 && <span className={cx("mono-label !text-[10px]", rank === 1 ? "text-gold-2" : "text-fg/80")}>{PLACE[rank]} place</span>}
            <span className="text-xs text-faint">{timeAgo(sub.submittedAt)}</span>
          </div>

          {sealed && !mine ? (
            <div className="well mt-3 px-4 py-3.5">
              <div className="flex flex-col gap-1.5" aria-hidden>
                {[92, 78, 54].map((w, i) => (
                  <span key={i} className="shimmer h-2 rounded-full bg-fg/[0.06]" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted">
                <Lock size={12} /> Sealed until judging · sha256 <Scramble text={sub.contentHash.slice(0, 16)} />…
              </div>
            </div>
          ) : (
            <motion.pre
              initial={sealed ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className={cx("mt-2 whitespace-pre-wrap break-words text-fg/90", code ? "well p-4 font-mono text-[12.5px] leading-relaxed" : "font-sans text-[15px] leading-relaxed")}
            >
              {sub.content ?? "(content unavailable)"}
            </motion.pre>
          )}

          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {flags.map((f, i) => (
                <motion.span
                  key={f}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 500, damping: 20 }}
                  className={cx("mono-label inline-flex items-center gap-1 rounded-full px-2 py-1 !text-[9.5px]", SEVERE.includes(f) ? "bg-red/10 text-red-2" : "bg-ember/10 text-ember")}
                  title={live.signals.get(sub.pubkey)?.find((s) => s.flag === f)?.detail}
                >
                  <ShieldAlert size={11} /> {FLAG_LABEL[f]}
                </motion.span>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-24 shrink-0 flex-col items-end gap-2 sm:w-28">
          {scoring ? (
            <span className="mono-label flex items-center gap-2 !text-[10px] text-blue-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-blue" />
                <span className="relative h-2 w-2 rounded-full bg-blue" />
              </span>
              Judging
            </span>
          ) : hasScore ? (
            <>
              <div className={cx("num text-[44px]", severe ? "text-red-2" : rank === 1 ? "text-gold-2" : "text-fg")}>
                <Counter value={score! / 100} decimals={1} duration={1.2} />
              </div>
              <ScoreBar score={score!} tone={severe ? "red" : rank === 1 ? "gold" : "blue"} />
            </>
          ) : (
            <span className="mono-label !text-[10px] text-faint">{sealed ? "Awaiting close" : "Queued"}</span>
          )}
          {rank === 1 && hasScore && <PixelIcon name="trophy" px={1.6} motion="bob" className="-mr-1" />}
          <AnimatePresence>
            {sub.payout > 0 && (
              <motion.span
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: -4 }}
                transition={{ type: "spring", stiffness: 420, damping: 14 }}
                className="rounded-md bg-green/10 px-2 py-0.5 font-mono text-[11.5px] font-semibold text-green shadow-[inset_0_0_0_1px_rgb(69_207_139/0.4)]"
              >
                +{fmtUsdc(sub.payout, { decimals: 2 })} USDC
              </motion.span>
            )}
          </AnimatePresence>
          {sub.stake > 0 && (
            <span
              className={cx(
                "mono-label rounded-full px-2 py-0.5 !text-[9px]",
                !sub.stakeSettled ? "bg-blue/10 text-blue-2" : stakeRefunded(sub) ? "bg-fg/[0.06] text-muted" : "bg-red/10 text-red-2",
              )}
            >
              {!sub.stakeSettled ? `${fmtUsdc(sub.stake)} staked` : stakeRefunded(sub) ? "Stake refunded" : `−${fmtUsdc(sub.stake)} slashed`}
            </span>
          )}
        </div>
      </div>

      {report && (
        <div className="relative border-t border-line">
          <button onClick={() => setOpen((o) => !o)} className="group flex w-full items-center gap-3 px-5 py-3.5 text-left text-[14px] text-muted transition-colors hover:bg-fg/[0.025]" aria-expanded={open}>
            <span className="mono-label shrink-0 !text-[10px] text-gold">Judge</span>
            <span className="serif-quote flex-1 truncate text-[16.5px] text-fg/90">“{report.summary}”</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }}>
              <ChevronDown size={16} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="grid gap-6 px-5 pb-5 pt-1 sm:grid-cols-2">
                  <div className="flex flex-col gap-3.5">
                    {report.criteria.map((c, i) => (
                      <div key={c.key}>
                        <div className="flex justify-between text-[13px]">
                          <span className="font-semibold">
                            {c.label} <span className="font-normal text-faint">{Math.round(c.weight * 100)}%</span>
                          </span>
                          <span className="font-mono font-semibold tabular-nums">{c.score}</span>
                        </div>
                        <ScoreBar score={c.score} max={100} tone="fg" className="mt-1.5" delay={i * 0.08} />
                        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-4 text-[14px]">
                    {report.strengths.length > 0 && (
                      <div>
                        <div className="mono-label mb-1.5 !text-[10px] text-green">Strengths</div>
                        <ul className="list-inside list-disc space-y-1 text-muted">
                          {report.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.improvements.length > 0 && (
                      <div>
                        <div className="mono-label mb-1.5 !text-[10px] text-ember">Coaching for next time</div>
                        <ul className="list-inside list-disc space-y-1 text-muted">
                          {report.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.signals.length > 0 && (
                      <div>
                        <div className="mono-label mb-1.5 !text-[10px] text-red-2">Integrity signals</div>
                        <ul className="space-y-1 font-mono text-[12px] text-muted">
                          {report.signals.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="well p-3.5 font-mono text-[11px] leading-relaxed text-muted">
                      <div>
                        weighted {report.rawScore.toFixed(2)} → final {report.finalScore.toFixed(2)} → on-chain {report.onchainScore}
                      </div>
                      <div>
                        {report.engine === "heuristic" ? "Offline judge" : "AI judge"} · rubric {report.rubric}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 text-green">
                            <ShieldCheck size={12} /> Report sha256 matches the chain
                          </span>
                        ) : verified === false ? (
                          <span className="text-red-2">Report hash mismatch!</span>
                        ) : null}
                        {sub.report?.txSig && (
                          <ExplorerLink id={sub.report.txSig} className="!text-blue-2">
                            score tx
                          </ExplorerLink>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
