export const USDC_DECIMALS = 6;
const UNIT = 10 ** USDC_DECIMALS;

export function toUsdc(base: number | bigint): number {
  return Number(base) / UNIT;
}

export function fromUsdc(amount: number): number {
  return Math.round(amount * UNIT);
}

export function fmtUsdc(base: number | bigint, opts: { decimals?: number } = {}): string {
  const v = toUsdc(base);
  const decimals = opts.decimals ?? (Number.isInteger(v) ? 0 : 2);
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtScore(score: number): string {
  return (score / 100).toFixed(1);
}

export function shortAddr(addr: string, n = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function timeLeft(deadlineSec: number, nowMs = Date.now()): string {
  const diff = deadlineSec * 1000 - nowMs;
  if (diff <= 0) return "closed";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m left`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m left`;
  return `${Math.floor(h / 24)}d left`;
}

export function timeAgo(sec: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - sec * 1000);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function toHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}

/** Reputation tiers, named after the Monkey King's rise. */
export const TIERS = [
  { min: 0, name: "Stone Monkey", color: "#a8a29e" },
  { min: 50, name: "Monkey King", color: "#f59e0b" },
  { min: 150, name: "Great Sage", color: "#ef4444" },
  { min: 400, name: "Equal of Heaven", color: "#a855f7" },
];

export function tierFor(rating: number) {
  let t = TIERS[0];
  for (const tier of TIERS) if (rating >= tier.min) t = tier;
  return t;
}
