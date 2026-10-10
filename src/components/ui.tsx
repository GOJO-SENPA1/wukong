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

const AVATAR_COLORS = ["#E4261C", "#2B3CFF", "#0C1424", "#0E9F5A", "#FF7A1A", "#7C3AED", "#0891B2"];

export function Avatar({ id, name, size = 32, ring = false }: { id: string; name?: string; size?: number; ring?: boolean }) {
  const h = hashCode(id);
  const words = (name ?? id).split(" · ")[0].replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 1)).toUpperCase() || "?";
  return (
    <div
      className={cx("flex shrink-0 items-center justify-center rounded-full font-display text-white", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, fontSize: size * 0.4, background: AVATAR_COLORS[h % AVATAR_COLORS.length], letterSpacing: "0.02em" }}
      aria-hidden
    >
      {letters}
    </div>
  );
}

const STATUS: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  open: { label: "Open", cls: "bg-red/10 text-red", dot: "bg-red" },
  judging: { label: "Judging", cls: "bg-blue/10 text-blue", dot: "bg-blue" },
  settled: { label: "Paid out", cls: "bg-green/10 text-green", dot: "bg-green" },
  cancelled: { label: "Refunded", cls: "bg-paper-2 text-muted", dot: "bg-faint" },
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
      className={cx("group/x inline-flex items-center gap-1 font-mono text-xs text-blue", className)}
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
    <div className={cx("rounded-2xl px-5 py-4", dark ? "bg-white/[0.06]" : "card")}>
      <div className={cx("label", dark && "!text-white/55")}>{label}</div>
      <div className={cx("display mt-2 text-4xl tabular-nums", accent)}>{value}</div>
    </div>
  );
}

/** A score bar that fills when it scrolls into view. */
export function ScoreBar({
  score,
  max = 10000,
  tone = "navy",
  className,
  delay = 0,
}: {
  score: number;
  max?: number;
  tone?: "navy" | "red" | "blue" | "green" | "gold" | "violet" | "crimson" | "jade" | "white";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = {
    navy: "bg-navy",
    red: "bg-red",
    crimson: "bg-red",
    blue: "bg-blue",
    violet: "bg-blue",
    green: "bg-green",
    jade: "bg-green",
    gold: "bg-gold",
    white: "bg-white",
  }[tone];
  return (
    <div ref={ref} className={cx("h-1.5 w-full overflow-hidden rounded-full", tone === "white" ? "bg-white/15" : "bg-paper-2", className)}>
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
  return <span className={cx("display tabular-nums", className)}>{fmtScore(score)}</span>;
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

export function EngineBadge({ dark }: { dark?: boolean }) {
  const { state } = useApp();
  if (!state.judge) return null;
  const claude = state.judge.engine === "claude";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em]",
        dark ? "bg-white/10 text-white/70" : claude ? "bg-blue/10 text-blue" : "bg-paper text-muted",
      )}
      title={claude ? `AI judge: ${state.judge.model}` : "No ANTHROPIC_API_KEY: transparent offline heuristics"}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", claude ? "bg-blue-2" : "bg-faint")} />
      {claude ? state.judge.model : "Offline judge"}
    </span>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card px-6 py-12 text-center text-sm text-muted", className)}>{children}</div>;
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

/** A small mono kicker with a red dot, above section headlines. */
export function Kicker({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cx("mono-label flex items-center gap-2", dark ? "text-white/60" : "text-muted", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-red" />
      {children}
    </div>
  );
}

/** Skeleton block with a shimmer, for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("shimmer rounded-xl bg-paper-2", className)} />;
}
