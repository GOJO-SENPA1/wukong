"use client";

// Page-wide effects mounted once in the layout: a coin burst any component can
// fire (after a payout, a posted task, a submitted entry) and a custom cursor
// for mouse users that swells over anything clickable.

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

/** A dot that tracks the mouse exactly and a ring that trails it, growing over links and buttons. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    const d = dot.current!,
      r = ring.current!;
    d.style.display = r.style.display = "block";
    d.style.opacity = r.style.opacity = "0";
    let x = -100,
      y = -100,
      rx = -100,
      ry = -100,
      scale = 1,
      target = 1,
      raf = 0;
    const move = (e: PointerEvent) => {
      if (x < -99) {
        rx = e.clientX;
        ry = e.clientY;
        d.style.opacity = r.style.opacity = "1";
      }
      x = e.clientX;
      y = e.clientY;
      const el = e.target as Element | null;
      const hot = el?.closest?.("a, button, [role=button], input, textarea, select, label, summary, canvas.cursor-pointer");
      target = hot ? (el?.closest("input, textarea") ? 0.6 : 1.9) : 1;
      r.dataset.hot = hot ? "1" : "";
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const down = () => (target = 0.7);
    const up = () => (target = 1);
    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      scale += (target - scale) * 0.2;
      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) + Math.abs(target - scale) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    const hide = () => {
      d.style.opacity = r.style.opacity = "0";
    };
    const show = () => {
      d.style.opacity = r.style.opacity = "1";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", show);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerenter", show);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-1.5 w-1.5 rounded-full bg-red mix-blend-difference"
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-8 w-8 rounded-full border-[1.5px] border-red/70 transition-[background-color,border-color] duration-200 data-[hot=1]:border-red data-[hot=1]:bg-red/10"
      />
    </>
  );
}
