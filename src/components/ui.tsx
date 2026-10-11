"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { categoryById } from "@/lib/categories";
import { fmtScore, fmtUsdc, shortAddr, tierFor } from "@/lib/format";
import type { TaskStatus } from "@/lib/wukong";
import { useApp } from "./Providers";

export function cx(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Page width and gutters for everything but the full-bleed landing page. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8", className)}>{children}</div>;
}

// Deep jewel tones with a light rim, so avatars read on the dark surfaces.
const AVATAR_COLORS = [
  ["#3a1512", "#ff8b78"],
  ["#161c45", "#a7b0ff"],
  ["#3a2a12", "#f0d9a6"],
  ["#0f3324", "#7fe0ae"],
  ["#3a1d0c", "#ffb27a"],
  ["#2a1640", "#cfa8ff"],
  ["#0d2f36", "#7fd8e6"],
];

export function Avatar({ id, name, size = 32, ring = false }: { id: string; name?: string; size?: number; ring?: boolean }) {
  const h = hashCode(id);
  const words = (name ?? id).split(" · ")[0].replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 1)).toUpperCase() || "?";
  return (
    <div
      className={cx("flex shrink-0 select-none items-center justify-center rounded-full font-sans font-semibold", ring && "ring-2 ring-bg")}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: AVATAR_COLORS[h % AVATAR_COLORS.length][0],
        color: AVATAR_COLORS[h % AVATAR_COLORS.length][1],
        boxShadow: `inset 0 0 0 1px ${AVATAR_COLORS[h % AVATAR_COLORS.length][1]}33`,
        letterSpacing: "0.01em",
      }}
      aria-hidden
    >
      {letters}
    </div>
  );
}

const STATUS: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  open: { label: "Open", cls: "bg-red/10 text-red-2", dot: "bg-red" },
  judging: { label: "Judging", cls: "bg-blue/10 text-blue-2", dot: "bg-blue" },
  settled: { label: "Paid out", cls: "bg-green/10 text-green", dot: "bg-green" },
  cancelled: { label: "Refunded", cls: "bg-fg/[0.06] text-muted", dot: "bg-faint" },
};

export function StatusPill({ status, extra }: { status: TaskStatus; extra?: ReactNode }) {
  const s = STATUS[status];
  const live = status === "open" || status === "judging";
  return (
    <span className={cx("mono-label inline-flex items-center gap-2 rounded-full px-2.5 py-1 !text-[10.5px]", s.cls)}>
      <span className="relative flex h-1.5 w-1.5">
        {live && <span className={cx("absolute inset-0 animate-ping-slow rounded-full", s.dot)} />}
        <span className={cx("relative h-1.5 w-1.5 rounded-full", s.dot)} />
      </span>
      {s.label}
      {extra && <span className="opacity-80">· {extra}</span>}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: number; className?: string }) {
  const c = categoryById(category);
  return <span className={cx("mono-label text-muted", className)}>{c.label}</span>;
}

export function Usdc({ base, className, decimals }: { base: number; className?: string; decimals?: number }) {
  return (
    <span className={cx("tabular-nums", className)}>
      {fmtUsdc(base, { decimals })}
      <span className="ml-1 font-sans text-[0.42em] font-semibold tracking-wide opacity-60">USDC</span>
    </span>
  );
}

export function ExplorerLink({
  kind = "tx",
  id,
  children,
  className,
}: {
  kind?: "tx" | "address";
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  const { explorer } = useApp();
  return (
    <a
      href={explorer(kind, id)}
      target="_blank"
      rel="noreferrer"
      className={cx("group/x inline-flex items-center gap-1 font-mono text-xs text-blue-2", className)}
      title={id}
    >
      <span className="link-underline">{children ?? shortAddr(id, 5)}</span>
      <ArrowUpRight size={12} className="transition-transform duration-300 group-hover/x:-translate-y-0.5 group-hover/x:translate-x-0.5" />
    </a>
  );
}

function parts(deadlineSec: number, now: number) {
  const diff = Math.max(0, deadlineSec * 1000 - now);
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: diff <= 0 };
}

/** Time left, ticking every second; `compact` renders "2H 14M LEFT" style. */
export function Countdown({ deadline, compact = true, className }: { deadline: number; compact?: boolean; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className={className}>&nbsp;</span>;
  const p = parts(deadline, now);
  if (p.done) return <span className={className}>closed</span>;
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = compact
    ? p.d > 0
      ? `${p.d}d ${p.h}h left`
      : p.h > 0
        ? `${p.h}h ${pad(p.m)}m left`
        : `${p.m}m ${pad(p.s)}s left`
    : `${p.d > 0 ? `${p.d}d ` : ""}${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
  return <span className={cx("tabular-nums", className)}>{text}</span>;
}

export function Stat({ label, value, accent, dark }: { label: string; value: ReactNode; accent?: string; dark?: boolean }) {
  return (
    <div className={cx("rounded-2xl px-5 py-4", dark ? "well" : "card")}>
      <div className="label">{label}</div>
      <div className={cx("num mt-3 text-[2.6rem]", accent)}>{value}</div>
    </div>
  );
}

/** A score bar that fills when it scrolls into view. */
export function ScoreBar({
  score,
  max = 10000,
  tone = "fg",
  className,
  delay = 0,
}: {
  score: number;
  max?: number;
  tone?: "fg" | "red" | "blue" | "green" | "gold";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = {
    fg: "bg-fg",
    red: "bg-gradient-to-r from-red/70 to-red",
    blue: "bg-gradient-to-r from-blue/70 to-blue",
    green: "bg-gradient-to-r from-green/70 to-green",
    gold: "bg-gradient-to-r from-gold/70 to-gold-2",
  }[tone];
  return (
    <div ref={ref} className={cx("h-1 w-full overflow-hidden rounded-full bg-fg/[0.07]", className)}>
      <motion.div
        className={cx("h-full rounded-full", color)}
        initial={reduce ? false : { width: 0 }}
        animate={seen || reduce ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
        style={reduce ? { width: `${pct}%` } : undefined}
      />
    </div>
  );
}

export function ScoreNumber({ score, className }: { score: number; className?: string }) {
  return <span className={cx("num", className)}>{fmtScore(score)}</span>;
}

export function TierBadge({ rating, compact }: { rating: number; compact?: boolean }) {
  const t = tierFor(rating);
  return (
    <span
      className="mono-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 !text-[10px]"
      style={{ color: t.color, background: `${t.color}18` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
      {compact ? rating : `${t.name} · ${rating}`}
    </span>
  );
}

export function EngineBadge() {
  const { state } = useApp();
  if (!state.judge) return null;
  const online = state.judge.engine !== "heuristic";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em]",
        online ? "bg-blue/10 text-blue-2" : "bg-fg/[0.05] text-muted",
      )}
      title={online ? `AI judge: ${state.judge.model}` : "No AI judge configured: transparent offline heuristics"}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", online ? "bg-blue" : "bg-faint")} />
      {online ? state.judge.model : "Offline judge"}
    </span>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card px-6 py-14 text-center text-sm text-muted", className)}>{children}</div>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      aria-label="loading"
    />
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

/** A small mono kicker with a gold tick, above section headlines. */
export function Kicker({ children, className }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cx("mono-label flex items-center gap-2.5 text-muted", className)}>
      <span className="h-px w-6 bg-gradient-to-r from-gold to-gold/0" />
      {children}
    </div>
  );
}

/** A page's opening: kicker, serif headline, optional lede and actions on the right. */
export function PageHead({
  kicker,
  title,
  lede,
  right,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="min-w-0 max-w-3xl">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1 className="display mt-4 text-[clamp(2.8rem,6vw,4.8rem)]">{title}</h1>
        {lede && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-3">{right}</div>}
    </header>
  );
}

/** Skeleton block with a shimmer, for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("shimmer rounded-xl bg-fg/[0.04]", className)} />;
}
