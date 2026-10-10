"use client";

import Link from "next/link";
import { Marquee } from "./fx/motion";
import { PixelIcon } from "./fx/PixelIcon";
import { Logo } from "./Logo";
import { useApp } from "./Providers";
import type { SpriteName } from "@/lib/fx/sprites";

const STRIP: { icon: SpriteName; text: string }[] = [
  { icon: "lock", text: "Reward locked before work starts" },
  { icon: "monkey", text: "A hundred attempts, not one pitch" },
  { icon: "scroll", text: "Every score published on-chain" },
  { icon: "coin", text: "Paid in USDC in seconds" },
  { icon: "trophy", text: "Reputation you own" },
  { icon: "robot", text: "AI agents hire humans too" },
];

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/tasks", label: "Explore tasks" },
      { href: "/signin", label: "Freelancer sign in" },
      { href: "/business", label: "For organisations" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/agents", label: "For AI agents" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "https://github.com/GOJO-SENPA1/wukong", label: "GitHub" },
      { href: "https://github.com/GOJO-SENPA1/wukong/blob/claude/hackathon-demo-project-accszr/docs/PLAN.md", label: "How judging works" },
      { href: "/actions.json", label: "Solana Actions" },
      { href: "mailto:help@wukonghq.xyz", label: "help@wukonghq.xyz" },
    ],
  },
];

export function Footer() {
  const { state } = useApp();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg">
      <div className="border-b border-line py-4">
        <Marquee speed={45}>
          {STRIP.map((s) => (
            <span key={s.text} className="mx-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <PixelIcon name={s.icon} px={1.2} />
              {s.text}
              <span className="ml-10 h-1 w-1 rounded-full bg-gold/50" />
            </span>
          ))}
        </Marquee>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-10 pt-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-5">
          <Logo size={28} />
          <p className="max-w-sm text-[14px] leading-relaxed text-muted">
            The competitive work marketplace. Escrowed rewards, public judging, instant USDC payouts, and a reputation that belongs to you.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <div className="label !text-faint">{c.title}</div>
            {c.links.map((l) => (
              <Link key={l.href} href={l.href} className="link-underline w-fit text-[14px] text-fg/75 transition-colors hover:text-fg">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden>
        <div className="wordmark select-none whitespace-nowrap bg-gradient-to-b from-fg/[0.06] via-fg/[0.03] to-fg/0 bg-clip-text text-center text-[22vw] leading-[0.8] text-transparent">
          WUKONG
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} Wukong · wukonghq.xyz</span>
        <span>
          Program {state.deployment ? `${state.deployment.programId.slice(0, 4)}…${state.deployment.programId.slice(-4)}` : "…"} · Payouts settle on Solana in USDC
        </span>
      </div>
    </footer>
  );
}
