"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { CONSENT_CHANGED, OPEN_CONSENT, privacySignal, readConsent, saveConsent } from "@/lib/client/consent";
import { track } from "@/lib/client/analytics";
import { toast } from "./Toast";
import { cx } from "./ui";

/**
 * Cookie consent: a banner until the visitor decides, and a preferences panel they
 * can reopen from the footer. Only one optional category exists (anonymous
 * analytics), it is off until they say yes, and declining is one click, same as
 * accepting. A browser privacy signal (GPC or Do Not Track) counts as a no, so
 * those visitors never see the banner.
 */
export function Consent() {
  const [banner, setBanner] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const c = readConsent();
    setAnalytics(c?.analytics ?? false);
    setBanner(!c && !privacySignal());
    const open = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      dialog.current?.showModal();
    };
    window.addEventListener(OPEN_CONSENT, open);
    return () => window.removeEventListener(OPEN_CONSENT, open);
  }, []);

  const decide = useCallback((yes: boolean, from: "banner" | "panel") => {
    saveConsent(yes);
    setAnalytics(yes);
    setBanner(false);
    dialog.current?.close();
    if (from === "panel") toast.success("Preferences saved", yes ? "Anonymous analytics are on. Thank you." : "Analytics are off. Only essential storage is used.");
  }, []);

  return (
    <>
      <AnimatePresence>
        {banner && (
          <motion.section
            role="region"
            aria-label="Cookie consent"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.6 }}
            className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl border border-line-2 bg-surface-2/95 p-5 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.8)] backdrop-blur sm:inset-x-auto sm:left-6 sm:bottom-6 sm:mx-0"
          >
            <h2 className="text-[15px] font-semibold">Your privacy, your call</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Wukong uses essential storage to keep you signed in and save your drafts. With your OK, we also count anonymous visits and actions to improve the
              product: no advertising, no third parties, nothing that identifies you.{" "}
              <Link href="/privacy#storage" className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold">
                Privacy Policy
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-red h-10 px-4 text-[13.5px]" onClick={() => decide(true, "banner")}>
                Allow analytics
              </button>
              <button type="button" className="btn btn-line h-10 px-4 text-[13.5px]" onClick={() => decide(false, "banner")}>
                Essential only
              </button>
              <button
                type="button"
                className="h-10 px-2 text-[13.5px] text-muted underline decoration-line-2 underline-offset-4 transition-colors hover:text-fg"
                onClick={() => dialog.current?.showModal()}
              >
                Preferences
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <dialog
        ref={dialog}
        aria-labelledby="consent-title"
        className="m-auto w-[min(540px,calc(100vw-32px))] rounded-3xl border border-line-2 bg-surface p-0 text-fg shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <form
          method="dialog"
          className="flex flex-col gap-5 p-6 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            decide(analytics, "panel");
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="consent-title" className="text-[20px] font-semibold tracking-tight">
                Cookie preferences
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">Change these any time from the footer. They apply to this browser.</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} className="-m-1 rounded-full p-1.5 text-faint transition-colors hover:text-fg" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <Category
            id="consent-essential"
            title="Essential"
            checked
            locked
            description="Keeps you signed in (Privy), remembers your wallet and saves drafts of your entries. Wukong can't work without it, so it's always on."
          />
          <Category
            id="consent-analytics"
            title="Anonymous analytics"
            checked={analytics}
            onChange={setAnalytics}
            description="Counts which pages are visited and which steps people complete, like posting a task or sending an entry, as daily totals. No cookies, no IP addresses, no account or wallet ids, no third parties."
          />

          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
            <button type="button" className="btn btn-line h-10 px-4 text-[13.5px]" onClick={() => decide(false, "panel")}>
              Essential only
            </button>
            <button type="submit" className="btn btn-red h-10 px-5 text-[13.5px]">
              Save preferences
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Category({
  id,
  title,
  description,
  checked,
  locked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 rounded-2xl border border-line p-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] font-semibold">
          {title}
          {locked && <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">Always on</span>}
        </label>
        <p id={`${id}-desc`} className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-desc`}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full p-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          checked ? "bg-green/80" : "bg-fg/15",
          locked && "cursor-not-allowed opacity-60",
        )}
      >
        <span aria-hidden className={cx("absolute left-0 top-0.5 h-5 w-5 rounded-full bg-fg shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

/** Counts a page view on every route change, once analytics are allowed. */
export function PageViews() {
  const path = usePathname();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    setAllowed(readConsent()?.analytics === true);
    const on = (e: Event) => setAllowed((e as CustomEvent<{ analytics: boolean }>).detail.analytics);
    window.addEventListener(CONSENT_CHANGED, on);
    return () => window.removeEventListener(CONSENT_CHANGED, on);
  }, []);
  useEffect(() => {
    if (allowed) track("page_view");
  }, [path, allowed]);
  return null;
}
