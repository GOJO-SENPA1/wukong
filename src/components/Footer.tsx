"use client";

import Link from "next/link";
import { useApp } from "./Providers";
import { shortAddr } from "@/lib/format";
import { cx } from "./ui";

const LINKS = [
  { href: "/tasks", label: "Arena" },
  { href: "/tasks/new", label: "Post a task" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/agents", label: "Agents · x402" },
];

export function Footer() {
  const { state } = useApp();
  return (
    <footer className="mt-auto border-t border-line/70 bg-ink/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              🐒
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              WU<span className="text-gold">KONG</span>
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Post a task. Summon the crowd. Pay the best. USDC escrow and on-chain reputation on Solana.
          </p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm text-faint">
          {state.deployment ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted">Cluster</dt>
              <dd className="font-mono text-xs uppercase tracking-wider">{state.deployment.cluster}</dd>
              <dt className="text-muted">Program</dt>
              <dd className="font-mono text-xs">{shortAddr(state.deployment.programId, 4)}</dd>
              <dt className="text-muted">Escrow</dt>
              <dd className="font-mono text-xs">USDC (SPL)</dd>
            </dl>
          ) : (
            <p className={cx("max-w-52 leading-relaxed")}>
              Not connected to a cluster. Run <span className="font-mono text-muted">npm run setup:localnet</span>{" "}
              to bring the chain up.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}