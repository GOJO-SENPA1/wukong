"use client";

// Motion primitives: scroll reveals, kinetic headlines, rolling numbers,
// magnetic and tilting elements, marquees, decoding text and typewriters.
// Each one renders its final state when the visitor prefers reduced motion.

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cx } from "@/components/ui";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  x = 0,
  blur = false,
  as = "div",
  once = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  blur?: boolean;
  as?: "div" | "section" | "li" | "article" | "span" | "header" | "aside";
  once?: boolean;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }
  return (
    <M
      className={className}
      style={style}
      initial={blur ? { opacity: 0, y, x, filter: "blur(6px)" } : { opacity: 0, y, x }}
      whileInView={blur ? { opacity: 1, y: 0, x: 0, filter: "blur(0px)" } : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.85, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Reveals each child in turn. */
export function Stagger({
  children,
  className,
  gap = 0.07,
  delay = 0,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  y?: number;
}) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <Reveal key={i} delay={delay + i * gap} y={y} className="h-full">
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * A headline whose words rise out of a mask one after another, like the film's
 * kinetic type. Lines are separated with "\n"; wrap a word in *asterisks* to
 * colour it with `accent`.
 */
export function Kinetic({
  text,
  className,
  lineClassName,
  accent = "italic text-gold-2",
  delay = 0,
  stagger = 0.06,
  as = "h1",
  inView = false,
}: {
  text: string;
  className?: string;
  lineClassName?: string;
  accent?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const go = !inView || seen;
  const Tag = as as ElementType;
  let k = 0;
  return (
    <Tag className={className} ref={ref} aria-label={text.replace(/\*/g, "").replace(/\n/g, " ")}>
      {text.split("\n").map((line, li) => (
        <span key={li} className={cx("block", lineClassName)} aria-hidden>
          {line.split(" ").map((word, wi) => {
            const hot = /^\*.*\*[.,!?]?$/.test(word);
            const clean = word.replace(/\*/g, "");
            const i = k++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.1em] pr-[0.04em] align-bottom">
                <motion.span
                  className={cx("inline-block", hot && accent)}
                  initial={reduce ? false : { y: "105%" }}
                  animate={go ? { y: "0%" } : undefined}
                  transition={{ duration: 1, ease: EASE, delay: delay + i * stagger }}
                >
                  {clean}
                </motion.span>
                {wi < line.split(" ").length - 1 && <span>&nbsp;</span>}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Rolls a number up from zero when it scrolls into view, and to each new value after. */
export function Counter({
  value,
  decimals = 0,
  duration = 1.4,
  className,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const from = useRef(0);
  const fmt = (v: number) =>
    prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || !seen) return;
    if (reduce) {
      el.textContent = fmt(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    from.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, value, reduce]);
  // The final value sits invisibly in the same grid cell, so the width never changes while it rolls
  // (a grid, not absolute positioning, so gradient text clipping still covers the digits).
  return (
    <span className={cx("inline-grid tabular-nums", className)}>
      <span className="invisible [grid-area:1/1]" aria-hidden>
        {fmt(value)}
      </span>
      {/* Always 0 at first, so server and browser render the same; the effect shows the value (instantly with reduced motion). */}
      <span ref={ref} className="[grid-area:1/1]">
        {fmt(0)}
      </span>
    </span>
  );
}

/** Pulls its child toward the pointer while hovered, then springs back. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={cx("inline-block", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Tilts in 3D toward the pointer, with a soft glare that follows it. */
export function Tilt({
  children,
  className,
  max = 8,
  glare = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useTransform([gx, gy] as MotionValue[], ([a, b]) => `radial-gradient(420px circle at ${a} ${b}, rgb(255 255 255 / 0.07), transparent 45%)`);
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      ref={ref}
      className={cx("relative [transform-style:preserve-3d]", className)}
      style={{ ...style, rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
        setHover(true);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
        setHover(false);
      }}
    >
      {children}
      {glare && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{ background: glareBg, opacity: hover ? 1 : 0 }}
        />
      )}
    </motion.div>
  );
}

/** An endless horizontal strip; pauses while hovered. */
export function Marquee({
  children,
  className,
  speed = 30,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  reverse?: boolean;
}) {
  return (
    <div className={cx("group relative flex overflow-hidden", className)}>
      <div
        className={cx(
          "flex w-max shrink-0 group-hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
        style={{ "--marquee-duration": `${speed}s` } as CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=<>/";

/** Decodes into its text from random glyphs: for hashes, addresses and labels. */
export function Scramble({
  text,
  className,
  duration = 900,
  trigger = "view",
}: {
  text: string;
  className?: string;
  duration?: number;
  trigger?: "view" | "hover" | "mount";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);
  const run = useRef<number | null>(null);
  const play = () => {
    if (reduce) return setOut(text);
    if (run.current) cancelAnimationFrame(run.current);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const fixed = Math.floor(p * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) => (i < fixed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (p < 1) run.current = requestAnimationFrame(step);
    };
    run.current = requestAnimationFrame(step);
  };
  useEffect(() => {
    if (trigger === "mount" || (trigger === "view" && seen)) play();
    return () => {
      if (run.current) cancelAnimationFrame(run.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, text, trigger]);
  return (
    <span ref={ref} className={className} onMouseEnter={trigger === "hover" ? play : undefined} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}

/** Types its lines out one after another, with a blinking caret. */
export function TypeLines({
  lines,
  className,
  lineClassName,
  speed = 28,
  pause = 350,
  start = 0,
  loop = false,
}: {
  lines: { text: string; className?: string }[];
  className?: string;
  lineClassName?: string;
  speed?: number;
  pause?: number;
  start?: number;
  loop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<string[]>([]);
  useEffect(() => {
    if (!seen) return;
    if (reduce) return setShown(lines.map((l) => l.text));
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      do {
        setShown([]);
        await sleep(start);
        for (let li = 0; li < lines.length; li++) {
          for (let c = 1; c <= lines[li].text.length; c++) {
            if (cancelled) return;
            setShown((s) => {
              const n = s.slice(0, li);
              n[li] = lines[li].text.slice(0, c);
              return n;
            });
            await sleep(speed);
          }
          await sleep(pause);
        }
        if (loop) await sleep(2600);
      } while (loop && !cancelled);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, reduce]);
  return (
    <div ref={ref} className={className}>
      {lines.map((l, i) => (
        <div key={i} className={cx(lineClassName, l.className, i >= shown.length && "invisible")}>
          {shown[i] ?? l.text}
          {i === shown.length - 1 && <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-blink bg-current" />}
        </div>
      ))}
    </div>
  );
}

/** A hairline along the top of the window that fills as the page scrolls. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-red via-red to-gold-2"
      style={{ scaleX }}
    />
  );
}

/** Moves its child vertically at a different speed from the scroll. */
export function Parallax({ children, speed = 0.15, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  const reduce = useReducedMotion();
  return (
    <motion.div ref={ref} className={className} style={{ y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  );
}

/** A radial glow that follows the pointer inside its parent (put it in a relative, overflow-hidden box). */
export function Spotlight({ color = "rgb(216 179 108 / 0.07)", size = 520 }: { color?: string; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
      ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
      ref.current!.style.opacity = "1";
    };
    const leave = () => {
      ref.current!.style.opacity = "0";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
      style={{ background: `radial-gradient(${size}px circle at var(--x) var(--y), ${color}, transparent 60%)` }}
    />
  );
}
