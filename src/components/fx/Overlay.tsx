"use client";

// Page-wide effects mounted once in the layout: a coin burst any component can
// fire (after a payout, a posted task, a submitted entry), and an easter egg.

import { useEffect, useRef } from "react";
import { drawIcon, fitCanvas, prefersReducedMotion } from "@/lib/fx/draw";
import type { SpriteName } from "@/lib/fx/sprites";

const EVENT = "wukong:burst";

/** Throw pixel coins (or other icons) from a point on screen, or from an element's centre. */
export function burst(from: { x: number; y: number } | Element | null, opts: { icons?: SpriteName[]; count?: number } = {}) {
  if (typeof window === "undefined" || !from) return;
  let x: number, y: number;
  if (from instanceof Element) {
    const r = from.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else ({ x, y } = from);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x, y, ...opts } }));
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  icon: SpriteName;
  spin: number;
  px: number;
}

export function BurstLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    let g = fitCanvas(c, window.innerWidth, window.innerHeight);
    let parts: P[] = [];
    let raf = 0;
    const resize = () => {
      g = fitCanvas(c, window.innerWidth, window.innerHeight);
    };
    const loop = (now: number) => {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts = parts.filter((p) => now - p.born < 1700);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        const life = (now - p.born) / 1700;
        drawIcon(g, p.icon, p.x, p.y, p.px, { sx: Math.cos(now / 80 + p.spin), alpha: 1 - life * life, depth: p.px * 0.7 });
      }
      raf = parts.length ? requestAnimationFrame(loop) : 0;
    };
    const on = (e: Event) => {
      if (prefersReducedMotion()) return;
      const { x, y, icons = ["coin"], count = 18 } = (e as CustomEvent).detail;
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const v = 6 + Math.random() * 9;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          born: now + Math.random() * 60,
          icon: icons[i % icons.length],
          spin: Math.random() * 6,
          px: 1.6 + Math.random() * 1.4,
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener(EVENT, on);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[80] h-screen w-screen" />;
}

/** Type "wukong" anywhere (outside a text field) and the crowd bursts out of the screen. */
export function SummonEgg() {
  useEffect(() => {
    let buf = "";
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true]") || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf !== "wukong") return;
      buf = "";
      const w = window.innerWidth,
        h = window.innerHeight;
      [0.15, 0.35, 0.5, 0.65, 0.85].forEach((fx, i) =>
        setTimeout(() => burst({ x: w * fx, y: h * 0.95 }, { icons: ["monkey", "monkey", "coin", "trophy"], count: 22 }), i * 140),
      );
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return null;
}
