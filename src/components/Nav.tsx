"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, UserRound, Wallet, X } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PERSONAS } from "@/lib/demo";
import { useApp } from "./Providers";
import { useAccount } from "./auth/Account";
import { Logo } from "./Logo";
import { Avatar, EngineBadge, Spinner, cx } from "./ui";

type NavLink = { href: string; label: string };

/** What the main nav offers depends on who you are: workers find work, companies hire. */
function linksFor(role: "worker" | "company" | null): NavLink[] {
  if (role === "company")
    return [
      { href: "/dashboard", label: "My tasks" },
      { href: "/tasks/new", label: "Post a task" },
      { href: "/tasks", label: "Explore" },
      { href: "/leaderboard", label: "Leaderboard" },
    ];
  if (role === "worker")
    return [
      { href: "/tasks", label: "Find work" },
      { href: "/dashboard", label: "My work" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/agents", label: "For agents" },
    ];
  return [
    { href: "/tasks", label: "Explore" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/agents", label: "For agents" },
  ];
}

function isActive(path: string, href: string) {
  if (href === "/tasks") return path === "/tasks" || /^\/tasks\/(?!new)/.test(path);
  return path.startsWith(href);
}

export function Nav() {
  const path = usePathname();
  const { state, role } = useApp();
  const account = useAccount();
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
  const links = linksFor(role);
  const signedOut = account.enabled && !account.authenticated && state.demoMode === false;

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
            {links.map((l) => {
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
            {signedOut ? (
              <button className="btn btn-red h-10" onClick={account.login}>
                <LogIn size={16} /> Sign in
              </button>
            ) : (
              <>
                <AccountMenu dark={dark} />
                {role === "company" && (
                  <Link href="/tasks/new" className="btn btn-red hidden h-10 sm:inline-flex">
                    Post a task
                  </Link>
                )}
                {role === "worker" && (
                  <Link href="/tasks" className="btn btn-red hidden h-10 sm:inline-flex">
                    Find work
                  </Link>
                )}
              </>
            )}
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
      <MobileMenu open={open} onClose={() => setOpen(false)} path={path} links={links} />
    </>
  );
}

function MobileMenu({ open, onClose, path, links }: { open: boolean; onClose: () => void; path: string; links: NavLink[] }) {
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
            {[{ href: "/", label: "Home" }, ...links].map((l, i) => (
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

function AccountMenu({ dark }: { dark: boolean }) {
  const { persona, setPersona, personaName, personaKeys, funding, role, personasOn, signer } = useApp();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const activeKey = persona === "account" ? (account.me?.wallet ?? "account") : persona === "wallet" ? "wallet" : (personaKeys[persona] ?? persona);
  const profile = account.me?.profile;
  const pick = (p: typeof persona) => {
    setPersona(p);
    setOpen(false);
  };

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
        {funding ? (
          <Spinner className="text-red" />
        ) : persona === "wallet" ? (
          <Wallet size={16} />
        ) : persona === "account" && !account.authenticated ? (
          <UserRound size={16} />
        ) : (
          <Avatar id={activeKey} name={personaName} size={26} />
        )}
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
            {account.enabled &&
              (account.authenticated ? (
                <div className={cx("rounded-xl p-2", persona === "account" && "bg-paper")}>
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => pick("account")}>
                    <Avatar id={account.me?.wallet ?? "account"} name={profile?.displayName ?? account.me?.email ?? "You"} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{profile?.displayName ?? account.me?.email ?? "Your account"}</div>
                      <div className="truncate text-xs text-muted">
                        {profile?.handle ? `@${profile.handle} · ` : ""}
                        {account.role === "company" ? "Organisation" : account.role === "worker" ? "Freelancer" : "Finish setting up"}
                      </div>
                    </div>
                    {persona === "account" && <Check size={16} className="text-red" />}
                  </button>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {[
                      { href: account.me?.onboarded ? "/dashboard" : "/welcome", label: "Dashboard", Icon: LayoutDashboard },
                      { href: "/wallet", label: "Wallet", Icon: Wallet },
                      { href: profile?.handle ? `/u/${profile.handle}` : "/welcome", label: "Profile", Icon: UserRound },
                    ].map(({ href, label, Icon }) => (
                      <Link key={label} href={href} onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 rounded-lg py-2 text-[12px] text-muted transition-colors hover:bg-white hover:text-navy">
                        <Icon size={16} />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <button
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] text-muted transition-colors hover:text-red"
                    onClick={async () => {
                      setOpen(false);
                      await account.logout();
                    }}
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    account.login();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-red transition-colors hover:bg-paper"
                >
                  <LogIn size={16} /> Sign in with email, Google or a wallet
                </button>
              ))}
            {personasOn && (
              <>
                {account.enabled && <div className="my-2 border-t border-line" />}
                <div className="label px-2 pb-1.5 pt-1.5">Demo accounts · burner wallets</div>
                {PERSONAS.map((p, i) => (
                  <motion.button
                    key={p.id}
                    role="menuitem"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    onClick={() => pick(p.id)}
                    className={cx("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-paper", persona === p.id && "bg-paper")}
                  >
                    <Avatar id={personaKeys[p.id] ?? p.id} name={p.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted">{p.role === "company" ? "Organisation · posts tasks" : `Freelancer · ${p.city}`}</div>
                    </div>
                    {persona === p.id && <Check size={16} className="text-red" />}
                  </motion.button>
                ))}
                {!account.enabled && (
                  <>
                    <div className="my-2 border-t border-line" />
                    <div className="label px-2 pb-1.5">Your own wallet</div>
                    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1" onClick={() => setPersona("wallet")}>
                      <WalletMultiButton />
                      {persona === "wallet" && <Check size={16} className="text-red" />}
                    </div>
                  </>
                )}
                <p className="px-2 pb-1 pt-2 text-[11.5px] leading-relaxed text-muted">
                  Demo accounts are burner keys funded by the demo faucet. Every action is a real signed transaction.
                </p>
              </>
            )}
            {persona === "account" && account.authenticated && !signer && (
              <p className="px-2 pb-1 pt-2 text-[11.5px] text-muted">Your wallet is loading…</p>
            )}
            {role === null && persona === "account" && account.authenticated && (
              <Link href="/welcome" onClick={() => setOpen(false)} className="btn btn-red mt-2 h-10 w-full">
                Finish setting up
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
