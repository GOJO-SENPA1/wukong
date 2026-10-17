"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cx } from "./ui";

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** A follow-up: a link to where the thing now lives, or an undo-style button. */
  action?: { label: string; href?: string; onClick?: () => void };
  /** Milliseconds on screen; errors stay longer by default. */
  duration?: number;
}

interface Item extends ToastInput {
  id: number;
}

// A tiny event bus, so any client code can raise a toast without a hook.
const listeners = new Set<(t: Item) => void>();
let lastId = 0;

export function toast(input: ToastInput | string): number {
  const t: Item = { ...(typeof input === "string" ? { title: input } : input), id: ++lastId };
  listeners.forEach((l) => l(t));
  return t.id;
}
toast.success = (title: string, description?: string, extra?: Partial<ToastInput>) => toast({ ...extra, title, description, tone: "success" });
toast.error = (title: string, description?: string, extra?: Partial<ToastInput>) => toast({ ...extra, title, description, tone: "error" });
toast.info = (title: string, description?: string, extra?: Partial<ToastInput>) => toast({ ...extra, title, description, tone: "info" });

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE = { success: "text-green", error: "text-red-2", info: "text-blue-2" };

function ToastCard({ item, dismiss }: { item: Item; dismiss: (id: number) => void }) {
  const onClose = useCallback(() => dismiss(item.id), [dismiss, item.id]);
  const tone = item.tone ?? "info";
  const Icon = ICON[tone];
  const duration = item.duration ?? (tone === "error" ? 8000 : 5000);
  const remaining = useRef(duration);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const start = useCallback(() => {
    started.current = Date.now();
    timer.current = setTimeout(onClose, remaining.current);
  }, [onClose]);
  const pause = useCallback(() => {
    clearTimeout(timer.current);
    remaining.current = Math.max(1200, remaining.current - (Date.now() - started.current));
  }, []);

  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
  }, [start]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={start}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line-2 bg-surface-2/95 p-4 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.7)] backdrop-blur"
    >
      <Icon size={18} className={cx("mt-0.5 shrink-0", TONE[tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold leading-snug text-fg">{item.title}</p>
        {item.description && <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{item.description}</p>}
        {item.action &&
          (item.action.href ? (
            <Link href={item.action.href} onClick={onClose} className="mt-2 inline-block text-[13.5px] font-semibold text-gold-2 underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
              {item.action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                item.action?.onClick?.();
                onClose();
              }}
              className="mt-2 text-[13.5px] font-semibold text-gold-2 underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
            >
              {item.action.label}
            </button>
          ))}
      </div>
      <button type="button" onClick={onClose} className="-m-1 rounded-full p-1 text-faint transition-colors hover:text-fg" aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </motion.li>
  );
}

/** Where toasts appear. Mounted once in the root layout. */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  // Screen readers hear each toast once, through a live region that is always present.
  const [polite, setPolite] = useState("");
  const [urgent, setUrgent] = useState("");

  useEffect(() => {
    const onToast = (t: Item) => {
      setItems((xs) => [...xs.slice(-3), t]);
      const text = [t.title, t.description].filter(Boolean).join(". ");
      if (t.tone === "error") setUrgent(text);
      else setPolite(text);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {urgent}
      </div>
      <ol
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 top-20 z-[80] mx-auto flex w-[min(420px,calc(100vw-32px))] flex-col gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard key={item.id} item={item} dismiss={dismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </>
  );
}
