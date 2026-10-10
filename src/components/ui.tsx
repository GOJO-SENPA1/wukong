"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { categoryById } from "@/lib/categories";
import { fmtScore, fmtUsdc, shortAddr, tierFor, timeLeft } from "@/lib/format";
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

export function Avatar({ id, name, size = 32 }: { id: string; name?: string; size?: number }) {
  const h = hashCode(id);
  const a = h % 360;
  const b = (a + 40 + (h % 80)) % 360;
  const letter = (name ?? id).replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-black/80"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${a} 85% 65%), hsl(${b} 80% 55%))`,
      }}
      aria-hidden
    >
      {letter}
    </div>
  );
}

const STATUS: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  open: { label: "Open", cls: "text-jade border-jade/30 bg-jade/10", dot: "bg-jade" },
  judging: { label: "Judging", cls: "text-violet border-violet/30 bg-violet/10", dot: "bg-violet animate-pulse" },
  settled: { label: "Paid out", cls: "text-gold border-gold/30 bg-gold/10", dot: "bg-gold" },
  cancelled: { label: "Cancelled", cls: "text-muted border-line-2 bg-white/5", dot: "bg-muted" },
};

export function StatusPill({ status }: { status: TaskStatus }) {
  const s = STATUS[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.cls)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: number }) {
  const c = categoryById(category);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line-2 bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted">
      <span>{c.emoji}</span>
      {c.label}
    </span>
  );
}

export function Usdc({ base, className, decimals, unit = true }: { base: number; className?: string; decimals?: number; unit?: boolean }) {
  return (
    <span className={cx("tabular-nums", className)}>
      {fmtUsdc(base, { decimals })}
      {unit && <span className="ml-1 text-[0.7em] font-semibold tracking-wide text-muted">USDC</span>}
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
      className={cx("inline-flex items-center gap-1 font-mono text-xs text-sky hover:underline", className)}
      title={id}
    >
      {children ?? shortAddr(id, 5)}
      <ExternalLink size={11} />
    </a>
  );
}

export function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{timeLeft(deadline, now)}</span>;
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className={cx("mt-1 font-display text-2xl font-bold tabular-nums", accent)}>{value}</div>
    </div>
  );
}

export function ScoreBar({ score, max = 10000, tone = "gold" }: { score: number; max?: number; tone?: "gold" | "violet" | "crimson" | "jade" }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = {
    gold: "from-gold-2 to-gold",
    violet: "from-[#c4b2ff] to-violet",
    crimson: "from-[#ff8a93] to-crimson",
    jade: "from-[#8bf0c2] to-jade",
  }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className={cx("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ScoreNumber({ score, className }: { score: number; className?: string }) {
  return <span className={cx("font-display font-bold tabular-nums", className)}>{fmtScore(score)}</span>;
}

export function TierBadge({ rating, compact }: { rating: number; compact?: boolean }) {
  const t = tierFor(rating);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{ color: t.color, borderColor: `${t.color}55`, background: `${t.color}14` }}
    >
      {compact ? rating : `${t.name} · ${rating}`}
    </span>
  );
}

export function EngineBadge() {
  const { state } = useApp();
  if (!state.judge) return null;
  const claude = state.judge.engine === "claude";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        claude ? "border-violet/40 bg-violet/10 text-violet" : "border-line-2 bg-white/5 text-muted",
      )}
      title={claude ? `AI judge: ${state.judge.model}` : "No ANTHROPIC_API_KEY: transparent offline heuristics"}
    >
      ⚖️ {claude ? state.judge.model : "Offline judge"}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card px-6 py-10 text-center text-sm text-muted">{children}</div>;
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold">{children}</h2>
      {right}
    </div>
  );
}
