"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, Menu, Wallet, X } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PERSONAS } from "@/lib/demo";
import { useApp } from "./Providers";
import { Logo } from "./Logo";
import { Avatar, EngineBadge, Spinner, cx } from "./ui";

const LINKS = [
  { href: "/tasks", label: "Explore" },
  { href: "/tasks/new", label: "Post a task" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/agents", label: "For agents" },
];

function isActive(path: string, href: string) {
  if (href === "/tasks") return path === "/tasks" || /^\/tasks\/(?!new)/.test(path);
  return path.startsWith(href);
}

export function Nav() {
  const path = usePathname();
  const { state } = useApp();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    setHidden(y > 240 && y > prev && !open);
  });
  useEffect(() => setOpen(false), [path]);
  const dark = path === "/" && !scrolled;

  return (
    <>
      <motion.header
        className={cx(
          "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
          dark ? "border-b border-white/10 bg-navy" : "border-b border-line bg-white/80 shadow-[0_8px_30px_-20px_rgb(12_20_36/0.35)] backdrop-blur-xl",
        )}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0" aria-label="Wukong home">
            <Logo size={24} light={dark} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => {
              const active = isActive(path, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cx(
                    "relative rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                    dark ? (active ? "text-white" : "text-white/65 hover:text-white") : active ? "text-navy" : "text-muted hover:text-navy",
                  )}
                >
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-[13px] h-[2.5px] rounded-full bg-red"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {state.deployment && (
              <span
                className={cx(
                  "hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] xl:inline-flex",
                  dark ? "bg-white/10 text-white/70" : "bg-paper text-muted",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green" /> {state.deployment.cluster}
              </span>
            )}
            <span className="hidden lg:inline">
              <EngineBadge dark={dark} />
            </span>
            <PersonaSwitcher dark={dark} />
            <Link href="/tasks/new" className="btn btn-red hidden h-10 sm:inline-flex">
              Post a task
            </Link>
            <button
              className={cx("flex h-10 w-10 items-center justify-center rounded-xl md:hidden", dark ? "text-white" : "text-navy")}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </motion.header>
      <MobileMenu open={open} onClose={() => setOpen(false)} path={path} />
    </>
  );
}

function MobileMenu({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex flex-col bg-navy px-6 pb-10 pt-5 text-white md:hidden"
          initial={{ clipPath: "circle(0% at 92% 4%)" }}
          animate={{ clipPath: "circle(150% at 92% 4%)" }}
          exit={{ clipPath: "circle(0% at 92% 4%)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between">
            <Logo size={24} light />
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10" onClick={onClose} aria-label="Close menu">
              <X size={22} />
            </button>
          </div>
          <nav className="mt-14 flex flex-col gap-2" aria-label="Main">
            {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={l.href}
                  className={cx("display flex items-center justify-between py-1 text-5xl", (l.href === "/" ? path === "/" : isActive(path, l.href)) ? "text-red" : "text-white")}
                >
                  {l.label}
                  <ArrowUpRight size={28} className="opacity-50" />
                </Link>
              </motion.div>
            ))}
          </nav>
          <p className="mt-auto font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">Payouts settle on Solana in USDC</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PersonaSwitcher({ dark }: { dark: boolean }) {
  const { persona, setPersona, personaName, personaKeys, funding } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const activeKey = persona === "wallet" ? "wallet" : personaKeys[persona] ?? persona;

  return (
    <div className="relative" ref={ref}>
      <button
        className={cx(
          "flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium transition-colors",
          dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-paper text-navy hover:bg-paper-2",
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {funding ? <Spinner className="text-red" /> : persona === "wallet" ? <Wallet size={16} /> : <Avatar id={activeKey} name={personaName} size={26} />}
        <span className="hidden max-w-32 truncate sm:inline">{personaName.split(" · ")[0]}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="opacity-60">
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-line bg-white p-2 text-navy shadow-[0_30px_60px_-20px_rgb(12_20_36/0.45)]"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="label px-2 pb-1.5 pt-1.5">Demo accounts · burner wallets</div>
            {PERSONAS.map((p, i) => (
              <motion.button
                key={p.id}
                role="menuitem"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                onClick={() => {
                  setPersona(p.id);
                  setOpen(false);
                }}
                className={cx("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-paper", persona === p.id && "bg-paper")}
              >
                <Avatar id={personaKeys[p.id] ?? p.id} name={p.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted">{p.role === "company" ? "Company · posts tasks" : `Worker · ${p.city}`}</div>
                </div>
                {persona === p.id && <Check size={16} className="text-red" />}
              </motion.button>
            ))}
            <div className="my-2 border-t border-line" />
            <div className="label px-2 pb-1.5">Your own wallet</div>
            <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1" onClick={() => setPersona("wallet")}>
              <WalletMultiButton />
              {persona === "wallet" && <Check size={16} className="text-red" />}
            </div>
            <p className="px-2 pb-1 pt-2 text-[11.5px] leading-relaxed text-muted">
              Demo accounts are burner keys funded by the demo faucet (gas, plus test USDC for the company). Every action is a real signed transaction.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
