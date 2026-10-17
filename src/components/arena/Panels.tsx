"use client";

import Link from "next/link";
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Coins, Copy, Info, Lock, Send, ShieldCheck, Sparkles, Wand2, XCircle } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Counter, Scramble } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Avatar, ExplorerLink, Spinner, cx } from "@/components/ui";
import { categoryById } from "@/lib/categories";
import { postJSON, runAction } from "@/lib/client/api";
import { track } from "@/lib/client/analytics";
import { toast } from "@/components/Toast";
import { fmtUsdc, toUsdc } from "@/lib/format";
import { sha256Hex } from "@/lib/hash";
import { stakeRefunded } from "@/lib/rules";
import type { LogLine, TaskPayload } from "./types";

const EASE = [0.16, 1, 0.3, 1] as const;
type Push = (tone: LogLine["tone"], text: string, sig?: string) => void;

/* ---------- the escrow card */
export const EscrowCard = forwardRef<
  HTMLDivElement,
  { data: TaskPayload; children?: ReactNode }
>(function EscrowCard({ data, children }, ref) {
  const { task } = data;
  const fee = (task.reward * task.feeBps) / 10000;
  const pool = task.reward - fee;
  const splits = task.payoutMode === "topThree" ? [0.5, 0.3, 0.2] : [1];
  const settled = task.status === "settled";
  const closes = new Date(task.deadline * 1000);
  const rows: [string, ReactNode][] = [
    [task.status === "open" ? "Closes" : "Closed", closes.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })],
    ["Entries", `${task.submissionCount}${task.status === "open" ? ", sealed" : ""}`],
    ["Entry stake", task.entryStake > 0 ? `${fmtUsdc(task.entryStake, { decimals: 2 })} USDC, refundable` : "None"],
    ["Judged by", task.judgeMode === "aiFinal" ? "AI, final" : "AI shortlist, you pick"],
    ["Quality bar", "25 / 100, or refund"],
  ];
  return (
    <div ref={ref} className="card-gold relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold/15 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="label flex items-center gap-2">
          <Lock size={11} className="text-gold" />
          {settled ? "Paid out" : task.status === "cancelled" ? "Refunded" : "Locked in escrow"}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className={cx("num text-[64px]", settled ? "text-green" : "text-foil")}>
            <Counter value={toUsdc(settled ? task.paidOut : task.reward)} decimals={2} duration={1.6} />
          </span>
          <span className="pb-1.5 text-sm text-muted">USDC</span>
        </div>
        <div className="mt-3 text-[13.5px] text-muted">
          {task.payoutMode === "topThree" ? "Top 3 paid" : "Winner takes all"}, after the {task.feeBps / 100}% fee
        </div>
        <div className={cx("mt-4 grid gap-2", splits.length === 3 ? "grid-cols-3" : "grid-cols-1")}>
          {splits.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: EASE, duration: 0.6 }}
              className="well px-3 py-2.5 transition-colors hover:bg-fg/[0.05]"
            >
              <div className={cx("mono-label !text-[9.5px]", i === 0 ? "text-gold-2" : "text-muted")}>{["1st", "2nd", "3rd"][i]}</div>
              <div className="mt-0.5 text-[17px] font-semibold tabular-nums">{fmtUsdc(pool * s, { decimals: 2 })}</div>
            </motion.div>
          ))}
        </div>
        <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4 text-[13.5px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right text-fg/90">{v}</dd>
            </div>
          ))}
        </dl>
        {children && <div className="mt-5 flex flex-col gap-2">{children}</div>}
        <div className="mt-5 flex justify-center">
          <ExplorerLink kind="address" id={task.vault} className="mono-label !text-[10px] !text-muted hover:!text-fg">
            Escrow vault <Scramble text={`${task.vault.slice(0, 4)}…${task.vault.slice(-4)}`} />
          </ExplorerLink>
        </div>
      </div>
    </div>
  );
});

/* ---------- the rubric */
export function Rubric({ category }: { category: number }) {
  const c = categoryById(category);
  return (
    <div className="card p-6 sm:p-7">
      <h2 className="text-[19px] font-semibold tracking-tight">How entries are judged</h2>
      <p className="mt-1 text-[14px] text-muted">The {c.label} rubric. Every entry gets a score out of 100 and written feedback.</p>
      <div className="mt-5 flex flex-col">
        {c.criteria.map((cr, i) => (
          <motion.div
            key={cr.key}
            className="group grid grid-cols-[84px_1fr] items-baseline gap-4 border-t border-line py-4"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, ease: EASE, duration: 0.6 }}
          >
            <span className="num text-[34px] italic text-gold-2 transition-transform duration-300 group-hover:scale-105">
              <Counter value={Math.round(cr.weight * 100)} suffix="%" />
            </span>
            <div>
              <div className="font-semibold">{cr.label}</div>
              <div className="mt-0.5 text-[14px] text-muted">{cr.guide}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="border-t border-line pt-4 text-[13px] text-muted">
        <span className="font-semibold text-fg">Integrity checks run first:</span> a copy of an earlier entry is capped at 10, hidden instructions to the
        judge score 0, and spam is capped at 15.
      </p>
    </div>
  );
}

/* ---------- your entry */
export function SubmitPanel({
  taskKey,
  minRating,
  already,
  sample,
  personaName,
  onDone,
  committedHash,
  stake,
}: {
  taskKey: string;
  minRating: number;
  already: boolean;
  committedHash?: string;
  stake: number;
  sample?: string;
  personaName: string;
  onDone: (content: string) => void;
}) {
  const { signer } = useApp();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const hash = useMemo(() => (content ? sha256Hex(content) : ""), [content]);
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (already) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card flex items-center gap-4 !border-green/30 p-5"
      >
        <PixelIcon name="lock" px={2} motion="bob" />
        <div className="text-[14.5px]">
          <div className="font-semibold">You&apos;re in. Your entry is sealed.</div>
          <div className="mt-0.5 text-muted">
            Committed on-chain as <span className="font-mono text-[12px]">sha256 {committedHash?.slice(0, 16)}…</span> and hidden until judging.
          </div>
        </div>
      </motion.div>
    );
  }

  async function submit() {
    if (!signer) return setErr("Sign in with a freelancer account to enter.");
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
      burst(btn.current, { icons: ["coin", "monkey", "coin"], count: 16 });
      toast.success("Entry submitted", "It's sealed on-chain until the task closes. You'll see your score when judging ends.");
      track("entry_submitted");
      onDone(content);
      setContent("");
    } catch (e) {
      setErr((e as Error).message);
      toast.error("Entry not submitted", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="enter" className="card-gold relative scroll-mt-28 !rounded-[20px] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[19px] font-semibold tracking-tight">Your entry</h2>
        <span className="flex items-center gap-1.5 text-[13px] text-muted">
          <Lock size={13} /> Only you can see it until the task closes
        </span>
      </div>
      <textarea
        className="input mt-4 min-h-44 text-[16px] leading-relaxed"
        placeholder="Your best work. It is hashed and committed on-chain; nobody sees it until submissions close."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>
          <span className="tabular-nums">{words}</span> {words === 1 ? "word" : "words"}
          {sample && !content && (
            <button className="ml-3 inline-flex items-center gap-1 font-semibold text-gold-2 transition-colors hover:text-fg" onClick={() => setContent(sample)}>
              <Wand2 size={13} /> Fill a sample
            </button>
          )}
        </span>
        <span className="font-mono text-[11px] text-faint">
          <AnimatePresence mode="wait">
            <motion.span key={hash.slice(0, 4)} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="inline-block">
              {hash ? `sha256 ${hash.slice(0, 24)}…` : minRating > 0 ? `Requires rating ${minRating}+` : "You can edit until you submit. Submitting is final."}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      {stake > 0 && (
        <div className="well mt-4 flex items-start gap-2.5 px-4 py-3 text-[13.5px] text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-2" />
          <span>
            Submitting stakes <b className="text-fg">{fmtUsdc(stake, { decimals: 2 })} USDC</b> from your wallet. It comes back after judging unless your
            entry scores under 20.
          </span>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button ref={btn} className="btn btn-red h-12 px-6" disabled={!content.trim() || busy} onClick={submit}>
          {busy ? <Spinner /> : <Send size={16} />} {stake > 0 ? `Stake ${fmtUsdc(stake)} USDC and submit` : `Submit as ${personaName.split(" · ")[0]}`}
        </button>
      </div>
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-xl bg-red/10 p-3 text-[14px] text-red-2">
            {err}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- creator picks from the AI shortlist */
export function PickPanel({
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
  push: Push;
}) {
  const { signer } = useApp();
  const [busy, setBusy] = useState<number | null>(null);
  const shortlist = data.task.podium;
  if (!shortlist.length) return <p className="text-[14px] text-muted">Nothing cleared the quality bar.</p>;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-[13.5px] text-muted">
        <Sparkles size={14} className="text-blue-2" />
        AI shortlist is on-chain. {isCreator ? "Pick the winner:" : "Waiting for the creator to pick."}
      </p>
      {shortlist.map((p, i) => (
        <button
          key={p.submission}
          disabled={!isCreator || busy !== null}
          className="btn btn-ivory w-full justify-between"
          onClick={async (ev) => {
            if (!signer) return;
            setBusy(i);
            const el = ev.currentTarget;
            try {
              const { sig } = await runAction(signer, { kind: "settle_pick", task: data.task.pubkey, pick: i });
              push("money", `Creator picked ${nameOf(p.worker)}`, sig);
              burst(el, { icons: ["coin", "trophy"], count: 24 });
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
          {busy === i ? <Spinner /> : <span className="num text-xl">{(p.score / 100).toFixed(1)}</span>}
        </button>
      ))}
    </div>
  );
}

export function CancelButton({ taskKey, onDone, push }: { taskKey: string; onDone: () => void; push: Push }) {
  const { signer } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-line w-full"
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
      {busy ? <Spinner /> : <XCircle size={15} />} Cancel and refund
    </button>
  );
}

/* ---------- after settlement */
export function SettledSummary({ data, nameOf }: { data: TaskPayload; nameOf: (k: string) => string }) {
  const paid = data.submissions.filter((s) => s.rank > 0).sort((a, b) => a.rank - b.rank);
  const settleTx = [...data.txs].reverse().find((t) => t.kind === "settle");
  return (
    <div className="flex flex-col gap-2">
      {paid.length === 0 ? (
        <p className="text-[14px] text-muted">No entry cleared the quality bar. The buyer was refunded in full.</p>
      ) : (
        paid.map((s, i) => (
          <motion.div key={s.pubkey} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i, ease: EASE, duration: 0.6 }}>
            <Link href={`/workers/${s.worker}`} className="well flex items-center gap-3 p-2.5 transition-colors hover:bg-fg/[0.05]">
              <span className={cx("num w-6 text-center text-xl italic", s.rank === 1 ? "text-gold-2" : "text-muted")}>{s.rank}</span>
              <Avatar id={s.worker} name={nameOf(s.worker)} size={28} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{nameOf(s.worker)}</span>
              <span className="font-mono text-[12.5px] font-semibold text-green">+{fmtUsdc(s.payout, { decimals: 2 })}</span>
            </Link>
          </motion.div>
        ))
      )}
      {settleTx && (
        <div className="pt-1 text-[12px] text-muted">
          Released in one transaction · <ExplorerLink id={settleTx.sig} className="!text-blue-2" />
        </div>
      )}
      {data.task.entryStake > 0 && <StakeSummary data={data} />}
    </div>
  );
}

function StakeSummary({ data }: { data: TaskPayload }) {
  const staked = data.submissions.filter((s) => s.stake > 0);
  const settled = staked.filter((s) => s.stakeSettled);
  const slashed = settled.filter((s) => !stakeRefunded(s));
  return (
    <div className="well mt-1 flex items-center gap-2 p-2.5 text-[12px] text-muted">
      <Coins size={13} className="text-blue-2" />
      {settled.length < staked.length
        ? `${staked.length - settled.length} stakes waiting to settle`
        : `Stakes: ${settled.length - slashed.length} refunded, ${slashed.length} slashed to the treasury`}
    </div>
  );
}

/* ---------- share as a Blink */
export function ShareBlink({ taskKey, cluster }: { taskKey: string; cluster?: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  if (!origin) return null;
  const action = `${origin}/api/actions/tasks/${taskKey}`;
  const local = /localhost|127\.0\.0\.1/.test(origin) || cluster === "localnet";
  const dial = `https://dial.to/?action=${encodeURIComponent(`solana-action:${action}`)}${cluster === "devnet" ? "&cluster=devnet" : ""}`;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <PixelIcon name="bolt" px={1.5} className="-ml-1" />
        <div className="text-[15px] font-semibold">Share as a Blink</div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">Post this task anywhere Blinks unfurl (X, wallets, dial.to). Freelancers enter and stake straight from the post.</p>
      <button
        className="btn btn-line mt-3 w-full justify-between !text-[12px]"
        onClick={() => {
          navigator.clipboard?.writeText(action);
          setCopied(true);
          toast.success("Blink link copied", "Paste it in a post on X or anywhere Blinks unfurl.");
          track("blink_copied");
          setTimeout(() => setCopied(false), 1400);
        }}
      >
        <span className="truncate font-mono">{action.replace(/^https?:\/\//, "")}</span>
        <AnimatePresence mode="wait">
          <motion.span key={String(copied)} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className={copied ? "text-green" : "text-muted"}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </motion.span>
        </AnimatePresence>
      </button>
      {local ? (
        <p className="mt-2 text-[12px] text-faint">Blink clients need a public URL: deploy (devnet) to share it.</p>
      ) : (
        <a href={dial} target="_blank" rel="noreferrer" className="btn btn-line mt-2 w-full !text-[13px]">
          Open in dial.to
        </a>
      )}
    </div>
  );
}

/* ---------- the live log, as a terminal */
const TONE: Record<LogLine["tone"], string> = {
  info: "text-muted",
  good: "text-green",
  warn: "text-ember",
  bad: "text-red-2",
  ai: "text-blue-2",
  money: "text-gold",
};

export function LiveLog({ log }: { log: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);
  if (!log.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[18px] border border-line-2 bg-[#05060a]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-red" />
          <span className="relative h-2 w-2 rounded-full bg-red" />
        </span>
        <span className="mono-label !text-[10px] text-muted">Live</span>
      </div>
      <div ref={ref} className="max-h-80 space-y-1.5 overflow-y-auto p-4 font-mono text-[11.5px] leading-relaxed">
        <AnimatePresence initial={false}>
          {log.map((l) => (
            <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className={TONE[l.tone]}>
              <span className="text-faint">{new Date(l.at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })} </span>
              {l.text}
              {l.sig && (
                <>
                  {" "}
                  <ExplorerLink id={l.sig} className="!text-blue-2">
                    tx
                  </ExplorerLink>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------- the judging stage: progress while the judge works through the entries */
export function JudgeStage({ total, scored, scoring, engine }: { total: number; scored: number; scoring: number; engine?: string }) {
  const pct = total ? (scored / total) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="relative overflow-hidden rounded-[18px] border border-blue/40 bg-gradient-to-br from-blue/25 via-blue/10 to-surface p-5">
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue/20 to-transparent"
          animate={{ left: ["-40%", "110%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative flex items-center gap-4">
          <PixelIcon name="robot" px={2.2} motion="bob" speed={2} />
          <div className="flex-1">
            <div className="mono-label !text-[10px] text-blue-2">The judge is scoring{engine ? ` · ${engine}` : ""}</div>
            <div className="num mt-1.5 text-3xl">
              {scored} / {total} scored
            </div>
          </div>
          {scoring > 0 && <Spinner className="text-blue-2" />}
        </div>
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-fg/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-blue to-blue-2" animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE }} />
        </div>
      </div>
    </motion.div>
  );
}

export function SealedBanner({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <ShieldCheck size={14} className="text-blue-2" /> {count} sealed {count === 1 ? "entry" : "entries"} · revealed when submissions close
    </div>
  );
}
