"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Plus, Search, UserRound, Wallet, X } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PERSONAS } from "@/lib/demo";
import { useApp } from "./Providers";
import { useAccount } from "./auth/Account";
import { Logo } from "./Logo";
import { Avatar, EngineBadge, Spinner, cx } from "./ui";

type NavLink = { href: string; label: string };

/** What the main nav offers depends on who you are: freelancers find work, organisations hire. */
function linksFor(role: "worker" | "company" | null): NavLink[] {
  if (role === "company")
    return [
      { href: "/dashboard", label: "My tasks" },
      { href: "/tasks", label: "Marketplace" },
      { href: "/leaderboard", label: "Talent" },
      { href: "/agents", label: "For agents" },
    ];
  if (role === "worker")
    return [
      { href: "/tasks", label: "Find work" },
      { href: "/dashboard", label: "My work" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/wallet", label: "Wallet" },
    ];
  return [
    { href: "/tasks", label: "Marketplace" },
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
  const { role, identityReady, personasOn, state } = useApp();
  const account = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  useEffect(() => setOpen(false), [path]);
  const links = linksFor(identityReady ? role : null);
  // With accounts on, a signed-out visitor always gets the way in (on a demo deployment, beside the demo accounts).
  const signedOut = account.enabled && !account.authenticated;

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled ? "border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-bg/0",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0" aria-label="Wukong home">
            <Logo size={23} />
          </Link>
          <nav
            className={cx("hidden items-center gap-0.5 transition-opacity duration-500 md:flex", identityReady ? "opacity-100" : "opacity-0")}
            aria-label="Main"
          >
            {links.map((l) => {
              const active = isActive(path, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cx(
                    "relative rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-300",
                    active ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-fg/[0.07] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {state.deployment && (
              <span className="hidden items-center gap-1.5 rounded-full bg-fg/[0.05] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted xl:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgb(69_207_139/0.8)]" /> {state.deployment.cluster}
              </span>
            )}
            <span className="hidden lg:inline">
              <EngineBadge />
            </span>
            <div className={cx("flex items-center gap-2 transition-opacity duration-500", identityReady ? "opacity-100" : "pointer-events-none opacity-0")}>
              {signedOut ? (
                <>
                  {personasOn && <AccountMenu />}
                  <Link
                    href="/business"
                    className={cx(
                      "hidden rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-colors sm:inline",
                      path.startsWith("/business") ? "text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    For organisations
                  </Link>
                  <Link href="/signin" className="btn btn-red h-9 !px-4">
                    <LogIn size={15} /> Sign in
                  </Link>
                </>
              ) : (
                <>
                  <AccountMenu />
                  {role === "company" && (
                    <Link href="/tasks/new" className="btn btn-red hidden h-9 !px-4 sm:inline-flex">
                      <Plus size={15} strokeWidth={2.5} /> Post a task
                    </Link>
                  )}
                  {role === "worker" && (
                    <Link href="/tasks" className="btn btn-red hidden h-9 !px-4 sm:inline-flex">
                      <Search size={15} strokeWidth={2.5} /> Find work
                    </Link>
                  )}
                </>
              )}
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-fg/[0.06] md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} path={path} links={links} role={identityReady ? role : null} signedOut={signedOut} />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  path,
  links,
  role,
  signedOut,
}: {
  open: boolean;
  onClose: () => void;
  path: string;
  links: NavLink[];
  role: "worker" | "company" | null;
  signedOut: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);
  const all = [
    { href: "/", label: "Home" },
    ...links,
    ...(role === "company" ? [{ href: "/tasks/new", label: "Post a task" }] : []),
    ...(signedOut
      ? [
          { href: "/signin", label: "Sign in" },
          { href: "/business", label: "For organisations" },
        ]
      : []),
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex flex-col bg-bg/95 px-6 pb-10 pt-4 backdrop-blur-2xl md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex h-12 items-center justify-between">
            <Logo size={23} />
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-fg/[0.07]" onClick={onClose} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <nav className="mt-12 flex flex-col" aria-label="Main">
            {all.map((l, i) => {
              const active = l.href === "/" ? path === "/" : isActive(path, l.href);
              return (
                <motion.div
                  key={l.href}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <Link href={l.href} className={cx("display flex items-center justify-between py-4 text-[2.6rem]", active ? "text-gold-2" : "text-fg")}>
                    {l.label}
                    <ArrowUpRight size={22} className="text-faint" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <p className="mt-auto font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">Payouts settle on Solana in USDC</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AccountMenu() {
  const { persona, setPersona, personaName, personaKeys, funding, role, personasOn, signer } = useApp();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  const activeKey = persona === "account" ? (account.me?.wallet ?? "account") : persona === "wallet" ? "wallet" : (personaKeys[persona] ?? persona);
  const profile = account.me?.profile;
  const pick = (p: typeof persona) => {
    setPersona(p);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-9 items-center gap-2 rounded-full bg-fg/[0.06] pl-1 pr-2.5 text-[13px] font-medium text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-colors hover:bg-fg/[0.1]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center">
          {funding ? (
            <Spinner className="text-gold" />
          ) : persona === "wallet" ? (
            <Wallet size={15} />
          ) : persona === "account" && !account.authenticated ? (
            <UserRound size={15} />
          ) : (
            <Avatar id={activeKey} name={personaName} size={28} />
          )}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{personaName.split(" · ")[0]}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted">
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 mt-2.5 w-80 origin-top-right overflow-hidden rounded-2xl border border-line-2 bg-surface/95 p-2 text-fg shadow-[0_40px_80px_-24px_rgb(0_0_0/0.95)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {account.enabled &&
              (account.authenticated ? (
                <div className={cx("rounded-xl p-2", persona === "account" && "bg-fg/[0.04]")}>
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => pick("account")}>
                    <Avatar id={account.me?.wallet ?? "account"} name={profile?.displayName ?? account.me?.email ?? "You"} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{profile?.displayName ?? account.me?.email ?? "Your account"}</div>
                      <div className="truncate text-xs text-muted">
                        {profile?.handle ? `@${profile.handle} · ` : ""}
                        {account.role === "company" ? "Organisation" : account.role === "worker" ? "Freelancer" : "Finish setting up"}
                      </div>
                    </div>
                    {persona === "account" && <Check size={16} className="text-gold" />}
                  </button>
                  <div className="mt-3 grid grid-cols-3 gap-1">
                    {[
                      { href: account.me?.onboarded ? "/dashboard" : "/welcome", label: "Dashboard", Icon: LayoutDashboard },
                      { href: "/wallet", label: "Wallet", Icon: Wallet },
                      { href: profile?.handle ? `/u/${profile.handle}` : "/welcome", label: "Profile", Icon: UserRound },
                    ].map(({ href, label, Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center gap-1.5 rounded-lg py-2.5 text-[11.5px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
                      >
                        <Icon size={16} />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <button
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] text-muted transition-colors hover:text-red-2"
                    onClick={async () => {
                      setOpen(false);
                      await account.logout();
                    }}
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <Link
                    href="/signin"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-fg transition-colors hover:bg-fg/[0.05]"
                  >
                    <LogIn size={15} className="text-red" /> Freelancers
                  </Link>
                  <Link
                    href="/business"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-fg transition-colors hover:bg-fg/[0.05]"
                  >
                    Organisations
                  </Link>
                </div>
              ))}
            {personasOn && (
              <>
                {account.enabled && <div className="my-2 h-px bg-line" />}
                <div className="label px-2 pb-2 pt-2">Demo accounts · burner wallets</div>
                {PERSONAS.map((p, i) => (
                  <motion.button
                    key={p.id}
                    role="menuitem"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.025 * i }}
                    onClick={() => pick(p.id)}
                    className={cx("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-fg/[0.05]", persona === p.id && "bg-fg/[0.05]")}
                  >
                    <Avatar id={personaKeys[p.id] ?? p.id} name={p.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted">{p.role === "company" ? "Organisation · posts tasks" : `Freelancer · ${p.city}`}</div>
                    </div>
                    {persona === p.id && <Check size={16} className="text-gold" />}
                  </motion.button>
                ))}
                {!account.enabled && (
                  <>
                    <div className="my-2 h-px bg-line" />
                    <div className="label px-2 pb-1.5">Your own wallet</div>
                    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1" onClick={() => setPersona("wallet")}>
                      <WalletMultiButton />
                      {persona === "wallet" && <Check size={16} className="text-gold" />}
                    </div>
                  </>
                )}
                <p className="px-2 pb-1 pt-3 text-[11.5px] leading-relaxed text-faint">
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
