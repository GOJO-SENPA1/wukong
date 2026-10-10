"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PERSONAS } from "@/lib/demo";
import { useApp } from "./Providers";
import { Avatar, EngineBadge, Spinner, cx } from "./ui";

const LINKS = [
  { href: "/tasks", label: "Arena" },
  { href: "/tasks/new", label: "Post a task" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/agents", label: "Agents · x402" },
];

export function Nav() {
  const path = usePathname();
  const { state } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🐒
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            WU<span className="text-gold">KONG</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href === "/tasks" ? path === "/tasks" || /^\/tasks\/(?!new)/.test(path) : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-white/[0.06] text-text" : "text-muted hover:text-text",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {state.deployment && (
            <span className="hidden rounded-full border border-line-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted lg:inline">
              {state.deployment.cluster}
            </span>
          )}
          <span className="hidden lg:inline">
            <EngineBadge />
          </span>
          <PersonaSwitcher />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-4 py-1.5 md:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 rounded-lg px-3 py-1 text-sm text-muted">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function PersonaSwitcher() {
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
      <button className="btn btn-ghost h-9 px-2.5" onClick={() => setOpen((o) => !o)}>
        {funding ? <Spinner className="text-gold" /> : persona === "wallet" ? <Wallet size={16} /> : <Avatar id={activeKey} name={personaName} size={22} />}
        <span className="hidden max-w-36 truncate text-sm sm:inline">{personaName}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-72 animate-rise p-2 shadow-2xl shadow-black/60">
          <div className="label px-2 pb-1 pt-1">Demo personas (burner wallets)</div>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPersona(p.id);
                setOpen(false);
              }}
              className={cx(
                "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5",
                persona === p.id && "bg-white/[0.06]",
              )}
            >
              <Avatar id={personaKeys[p.id] ?? p.id} name={p.name} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted">
                  {p.role === "company" ? "Company · posts tasks" : `Worker · ${p.city}`}
                </div>
              </div>
              {persona === p.id && <span className="h-2 w-2 rounded-full bg-gold" />}
            </button>
          ))}
          <div className="my-2 border-t border-line" />
          <div className="label px-2 pb-1">Real wallet</div>
          <div
            className="flex items-center justify-between gap-2 rounded-xl px-2 py-1"
            onClick={() => setPersona("wallet")}
          >
            <WalletMultiButton />
            {persona === "wallet" && <span className="h-2 w-2 rounded-full bg-gold" />}
          </div>
          <p className="px-2 pt-2 text-[11px] leading-relaxed text-faint">
            Personas are local burner keys, auto-funded with gas (and demo USDC for the company) by the
            demo faucet. Every action is a real signed transaction.
          </p>
        </div>
      )}
    </div>
  );
}

