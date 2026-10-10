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
      { href: "/tasks/new", label: "Post a task" },
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
    ],
  },
];

export function Footer() {
  const { state } = useApp();
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="border-y border-white/10 py-4">
        <Marquee speed={40}>
          {STRIP.map((s) => (
            <span key={s.text} className="mx-8 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.16em] text-white/70">
              <PixelIcon name={s.icon} px={1.3} />
              {s.text}
            </span>
          ))}
        </Marquee>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-10 pt-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo size={30} light />
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            The competitive work marketplace. Escrowed rewards, public judging, instant USDC payouts, reputation that belongs to you.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <div className="mono-label text-white/40">{c.title}</div>
            {c.links.map((l) => (
              <Link key={l.href} href={l.href} className="link-underline w-fit text-sm text-white/80 hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="display select-none whitespace-nowrap text-center text-[22vw] leading-[0.8] text-white/[0.04]" aria-hidden>
          WUKONG
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} Wukong · wukonghq.xyz</span>
        <span>
          Program {state.deployment ? `${state.deployment.programId.slice(0, 4)}…${state.deployment.programId.slice(-4)}` : "…"} · Payouts settle on Solana in USDC
        </span>
      </div>
    </footer>
  );
}
