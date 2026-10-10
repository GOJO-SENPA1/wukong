"use client";

import { useEffect, useRef, useState } from "react";
import { drawIcon, fitCanvas, prefersReducedMotion } from "@/lib/fx/draw";
import { cx } from "@/components/ui";

// The landing hero's loop, in pixel art: one monkey clones itself into a
// crowd, a blue judge beam scans every entry, three winners are crowned, and
// coins fall from escrow into their hands. Monkeys hop out of the pointer's
// way; a click throws a handful of coins.

const LOOP = 11;
const PHASES = [
  { at: 0, n: "01", label: "Post a task. The reward locks in escrow." },
  { at: 1.0, n: "02", label: "Summon the crowd. Everyone does the work." },
  { at: 4.2, n: "03", label: "The AI judge scores every entry in public." },
  { at: 6.4, n: "04", label: "The best get paid, in seconds." },
];

interface Mk {
  x: number;
  y: number;
  appear: number;
  phase: number;
  scan: number;
  rank: number; // 0 = not a winner
  hopAt: number;
}
interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  target?: Mk;
  spin: number;
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const backOut = (k: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};
const io = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function Summon({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const c = ref.current!;
    const reduce = prefersReducedMotion();
    let W = 0,
      H = 0,
      px = 3,
      g: CanvasRenderingContext2D;
    let crowd: Mk[] = [];
    let coins: Coin[] = [];
    const pointer = { x: -999, y: -999 };
    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    let lastPhase = -1;
    let lastCount = -1;

    const layout = () => {
      const r = c.getBoundingClientRect();
      W = r.width;
      H = r.height;
      g = fitCanvas(c, W, H);
      px = clamp(Math.min(W, H * 1.2) / 175, 1.7, 3.1);
      const step = 18 * px * 1.18;
      const cols = Math.max(4, Math.floor((W - step) / step));
      const rows = Math.max(3, Math.floor((H - step * 1.9) / (step * 0.92)));
      const ox = (W - (cols - 1) * step) / 2;
      const oy = (H - step * 0.9 - (rows - 1) * step * 0.92) / 2 + step * 0.45;
      const cx = W / 2,
        cy = H / 2;
      const pts: Mk[] = [];
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const x = ox + i * step + (j % 2 ? step * 0.5 : 0) + (rnd() - 0.5) * step * 0.25;
          if (x > W - step * 0.45) continue;
          pts.push({ x, y: oy + j * step * 0.92 + (rnd() - 0.5) * step * 0.2, appear: 0, phase: rnd() * 6, scan: 0, rank: 0, hopAt: -9 });
        }
      pts.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
      pts.forEach((p, i) => {
        p.appear = 1.0 + 2.6 * Math.pow(i / pts.length, 0.8);
        p.scan = 4.3 + 1.6 * clamp((p.x - step / 2) / (W - step));
      });
      // three winners, spread out and not on the edge
      const mid = pts.filter((p) => p.y > H * 0.26 && p.y < H * 0.6 && p.x > W * 0.15 && p.x < W * 0.85);
      const picks = [mid[Math.floor(mid.length * 0.15)], mid[Math.floor(mid.length * 0.55)], mid[Math.floor(mid.length * 0.85)]];
      picks.forEach((p, i) => p && (p.rank = i + 1));
      crowd = pts;
    };

    const ro = new ResizeObserver(layout);
    ro.observe(c);
    layout();

    const throwCoins = (x: number, y: number, n: number, now: number) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const v = 3 + Math.random() * 4;
        coins.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: now, spin: Math.random() * 6 });
      }
    };

    const frame = (now: number) => {
      const T = reduce ? 9 : ((now - t0) / 1000) % LOOP;
      g.clearRect(0, 0, W, H);
      const fadeAll = 1 - clamp((T - (LOOP - 0.9)) / 0.7);

      // the escrow vault at the top centre, glowing while it holds the reward
      const vaultK = clamp(T / 0.5);
      if (vaultK > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 300);
        g.save();
        g.globalAlpha = fadeAll * vaultK * (T < 6.4 ? 0.12 + 0.08 * pulse : 0.06);
        const grd = g.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.55);
        grd.addColorStop(0, "#6B78FF");
        grd.addColorStop(1, "transparent");
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        g.restore();
      }

      // the original starts big in the centre, then shrinks into the crowd as the clones arrive
      const winnersAt = 5.95;
      let shown = 0;
      for (let idx = crowd.length - 1; idx >= 0; idx--) {
        const m = crowd[idx];
        const k = idx === 0 ? clamp(T / 0.45) : clamp((T - m.appear) / 0.32);
        if (k <= 0) continue;
        shown++;
        let s = backOut(k);
        let size = px;
        if (idx === 0) size = px * (1 + 1.4 * (1 - io(clamp((T - 0.7) / 0.6))));
        const hop = (now - m.hopAt) / 420;
        let dy = Math.sin(now / 400 + m.phase) * px * 0.6;
        if (hop >= 0 && hop < 1) dy -= Math.sin(hop * Math.PI) * px * 5;
        // judged: losers fade back, winners hop and glow
        let alpha = fadeAll;
        const judged = clamp((T - winnersAt) / 0.4);
        if (m.rank === 0) alpha *= 1 - 0.72 * judged;
        else if (T > winnersAt) {
          const w = (T - winnersAt) * 1.6;
          dy -= Math.abs(Math.sin(w * Math.PI)) * px * 3 * Math.exp(-w * 0.35);
          s *= 1 + 0.25 * judged;
        }
        // the judge beam lights each monkey as it passes
        const scanK = 1 - Math.abs(T - m.scan) / 0.18;
        if (scanK > 0) {
          g.save();
          g.globalAlpha = scanK * 0.9 * fadeAll;
          g.fillStyle = "#6B78FF";
          g.beginPath();
          g.arc(m.x, m.y + dy, 18 * size * 0.62, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
        if (m.rank && T > winnersAt) {
          g.save();
          g.globalAlpha = judged * fadeAll * (0.55 + 0.2 * Math.sin(now / 200));
          const grd = g.createRadialGradient(m.x, m.y + dy, 0, m.x, m.y + dy, 18 * px * 1.3);
          grd.addColorStop(0, m.rank === 1 ? "#F5B83D" : "#FFFFFF");
          grd.addColorStop(1, "transparent");
          g.fillStyle = grd;
          g.fillRect(m.x - 60 * px, m.y - 60 * px, 120 * px, 120 * px);
          g.restore();
        }
        drawIcon(g, "monkey", m.x, m.y + dy, size, { scale: s, alpha, depth: size * 0.9 });
        // score ticks under each entry once the beam has passed
        if (T > m.scan && T < winnersAt + 0.4) {
          const sk = clamp((T - m.scan) / 0.25);
          const score = m.rank ? 0.95 - m.rank * 0.07 : 0.2 + ((m.phase * 997) % 1) * 0.5;
          g.save();
          g.globalAlpha = fadeAll * (1 - clamp((T - winnersAt) / 0.4)) * 0.9;
          g.fillStyle = "rgba(255,255,255,0.15)";
          const bw = 18 * px * 0.8;
          g.fillRect(m.x - bw / 2, m.y + 18 * px * 0.62, bw, px);
          g.fillStyle = m.rank ? "#F5B83D" : "#6B78FF";
          g.fillRect(m.x - bw / 2, m.y + 18 * px * 0.62, bw * score * sk, px);
          g.restore();
        }
        // ranks above the winners
        if (m.rank && T > winnersAt + 0.15) {
          const rk = backOut(clamp((T - winnersAt - 0.15 - m.rank * 0.12) / 0.35));
          if (m.rank === 1) drawIcon(g, "trophy", m.x, m.y + dy - 18 * px * 0.95, px * 0.8, { scale: rk, alpha: fadeAll });
          else drawIcon(g, m.rank === 2 ? "gem" : "fire", m.x, m.y + dy - 18 * px * 0.9, px * 0.65, { scale: rk, alpha: fadeAll });
        }
      }

      // the beam itself
      if (T > 4.1 && T < 6.1) {
        const bx = ((T - 4.3) / 1.6) * W;
        g.save();
        g.globalAlpha = fadeAll * (1 - Math.abs(T - 5.1) / 1.0) * 0.9;
        const grd = g.createLinearGradient(bx - 80, 0, bx + 6, 0);
        grd.addColorStop(0, "transparent");
        grd.addColorStop(1, "rgba(107,120,255,0.45)");
        g.fillStyle = grd;
        g.fillRect(bx - 80, 0, 86, H);
        g.fillStyle = "#AEB7FF";
        g.fillRect(bx, 0, 2, H);
        g.restore();
      }

      // payout: coins arc from the vault into each winner's hands
      if (T > 6.4 && T < 9.6) {
        crowd
          .filter((m) => m.rank)
          .forEach((m) => {
            const n = m.rank === 1 ? 5 : 3;
            for (let i = 0; i < n; i++) {
              const start = 6.5 + (m.rank - 1) * 0.25 + i * 0.16;
              const k = clamp((T - start) / 0.75);
              if (k <= 0 || k >= 1) continue;
              const e = io(k);
              const x = W / 2 + (m.x - W / 2) * e;
              const y = -20 + (m.y - 18 * px * 0.3 + 20) * e - Math.sin(k * Math.PI) * H * 0.12;
              drawIcon(g, "coin", x, y, px * 0.75, { sx: Math.cos(T * 9 + i), alpha: fadeAll, depth: px * 0.6 });
            }
          });
        // a flash on each winner as their coins land
        crowd
          .filter((m) => m.rank)
          .forEach((m) => {
            const land = 6.5 + (m.rank - 1) * 0.25 + 0.75;
            const f = 1 - Math.abs(T - land - 0.2) / 0.5;
            if (f > 0) {
              g.save();
              g.globalAlpha = f * 0.55 * fadeAll;
              g.fillStyle = "#FFFFFF";
              g.beginPath();
              g.arc(m.x, m.y, 18 * px * 0.9 * (1.4 - f * 0.4), 0, Math.PI * 2);
              g.fill();
              g.restore();
            }
          });
      }

      // thrown coins (clicks)
      coins = coins.filter((co) => now - co.born < 1600);
      for (const co of coins) {
        co.vy += 0.22;
        co.x += co.vx;
        co.y += co.vy;
        const life = (now - co.born) / 1600;
        drawIcon(g, "coin", co.x, co.y, px * 0.7, { sx: Math.cos(now / 90 + co.spin), alpha: 1 - life * life, depth: px * 0.5 });
      }

      // pointer: monkeys near it hop
      for (const m of crowd) {
        if (Math.hypot(m.x - pointer.x, m.y - pointer.y) < 18 * px * 0.9 && now - m.hopAt > 600) m.hopAt = now;
      }

      let ph = 0;
      PHASES.forEach((p, i) => {
        if (T >= p.at) ph = i;
      });
      if (ph !== lastPhase) {
        lastPhase = ph;
        setPhase(ph);
      }
      const cnt = Math.max(0, shown);
      if (Math.abs(cnt - lastCount) >= 1) {
        lastCount = cnt;
        setCount(cnt);
      }
    };

    const loop = (now: number) => {
      frame(now);
      raf = visible && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const vis = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    vis.observe(c);
    if (reduce) frame(performance.now());
    else raf = requestAnimationFrame(loop);

    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const leave = () => {
      pointer.x = pointer.y = -999;
    };
    const click = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      throwCoins(e.clientX - r.left, e.clientY - r.top, 9, performance.now());
      if (!raf && reduce) frame(performance.now());
    };
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerleave", leave);
    c.addEventListener("pointerdown", click);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      vis.disconnect();
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerleave", leave);
      c.removeEventListener("pointerdown", click);
    };
  }, []);

  const p = PHASES[phase];
  return (
    <div className={cx("relative h-full w-full", className)}>
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full cursor-pointer"
        role="img"
        aria-label="Pixel-art loop: one monkey clones into a crowd, an AI judge scans every entry, three winners are paid in coins."
      />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
        <div key={phase} className="flex animate-rise items-center gap-3 rounded-full bg-navy/80 py-1.5 pl-1.5 pr-4 backdrop-blur">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red font-mono text-[11px] font-semibold text-white">{p.n}</span>
          <span className="text-[13px] font-medium text-white/90">{p.label}</span>
        </div>
        <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-navy/80 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-white/70 backdrop-blur sm:inline">
          ENTRIES <span className="tabular-nums text-white">{String(count).padStart(2, "0")}</span>
        </span>
      </div>
    </div>
  );
}
