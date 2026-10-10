"use client";

import { useEffect, useRef } from "react";
import { drawIcon, fitCanvas, prefersReducedMotion } from "@/lib/fx/draw";
import type { SpriteName } from "@/lib/fx/sprites";
import { cx } from "@/components/ui";

/**
 * One of the promo's 3D pixel icons. `motion`: "spin" flips it like a coin,
 * "bob" floats it, "hover" flips it once when hovered, "still" draws it once.
 * It only animates while on screen.
 */
export function PixelIcon({
  name,
  px = 4,
  motion = "still",
  speed = 1,
  phase = 0,
  className,
  title,
}: {
  name: SpriteName;
  px?: number;
  motion?: "spin" | "bob" | "hover" | "still";
  speed?: number;
  phase?: number;
  className?: string;
  title?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hoverAt = useRef<number | null>(null);
  const pad = Math.ceil(px * 2.5);
  const box = 18 * px + pad * 2;

  useEffect(() => {
    const c = ref.current!;
    const g = fitCanvas(c, box, box + px * 3);
    const reduce = prefersReducedMotion();
    let raf = 0;
    let visible = true;
    const draw = (now: number) => {
      const t = now / 1000 + phase;
      g.clearRect(0, 0, box, box + px * 3);
      let sx = 1;
      let dy = 0;
      if (!reduce) {
        if (motion === "spin") sx = Math.cos(t * 2.2 * speed);
        if (motion === "bob") dy = Math.sin(t * 2 * speed) * px * 1.2;
        if (motion === "hover" && hoverAt.current !== null) {
          const k = (now - hoverAt.current) / 650;
          if (k >= 1) hoverAt.current = null;
          else sx = Math.cos(k * Math.PI * 2);
        }
      }
      drawIcon(g, name, box / 2, box / 2 + dy, px, { sx });
    };
    const loop = (now: number) => {
      draw(now);
      if (visible && !reduce && (motion === "spin" || motion === "bob" || hoverAt.current !== null)) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(c);
    draw(performance.now());
    const enter = () => {
      if (motion !== "hover" || reduce) return;
      if (hoverAt.current === null) hoverAt.current = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    };
    c.addEventListener("pointerenter", enter);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      c.removeEventListener("pointerenter", enter);
    };
  }, [name, px, motion, speed, phase, box]);

  return (
    <canvas
      ref={ref}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cx("block select-none", className)}
      style={{ width: box, height: box + px * 3, imageRendering: "pixelated" }}
    />
  );
}
