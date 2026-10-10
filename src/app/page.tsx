"use client";

import Link from "next/link";
import { ArrowRight, Bot, Coins, Eye, Globe2, Lock, Scale, Sparkles, Users } from "lucide-react";
import { useApp } from "@/components/Providers";
import { TaskCard } from "@/components/TaskCard";
import { Stat, Usdc } from "@/components/ui";
import { SetupNotice } from "@/components/SetupNotice";

const FLOW = [
  { icon: Lock, title: "Post + lock", body: "Company posts a brief. The full USDC reward locks in a program-owned vault before anyone lifts a finger." },
  { icon: Users, title: "Crowd competes", body: "Anyone can enter. Each entry is committed on-chain by hash; the content stays sealed until judging." },
  { icon: Scale, title: "AI judges", body: "Claude scores every entry against a public rubric. Copycats, prompt-injection and spam get caught." },
  { icon: Coins, title: "Best gets paid", body: "Scores land on-chain, the program ranks them, and escrow releases to the podium in one transaction." },
  { icon: Sparkles, title: "Rep compounds", body: "Every score and win accrues to the worker's on-chain reputation. Portable to any app." },
];

const PILLARS = [
  { icon: Lock, title: "Trustless escrow", body: "Money is visibly locked before work starts and can only leave to the winners, or back to the buyer if nothing clears the quality bar. No ghosting, no chargebacks." },
  { icon: Eye, title: "Transparent scoring", body: "Every score is published on-chain with the hash of a full written report. The winner is a pure function of those scores: the program, not a person, picks it." },
  { icon: Sparkles, title: "Portable reputation", body: "Submissions, scores, wins and earnings live in a PDA keyed by your wallet. Any platform can read it with one RPC call. Your track record outlives us." },
  { icon: Globe2, title: "Permissionless + global", body: "Connect a wallet and compete. A developer in Lagos or a translator in Kathmandu gets paid in USDC instantly. No bank, no 14-day hold." },
];

export default function Home() {
  const { state } = useApp();
  const tasks = state.tasks ?? [];
  const live = tasks.filter((t) => t.status === "open" || t.status === "judging").slice(0, 3);

  return (
    <div className="flex flex-col gap-16">
      <section className="relative pt-10 sm:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> Live on Solana {state.deployment?.cluster ?? ""}
        </div>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Post a task.
          <br />
          Summon the crowd.
          <br />
          <span className="bg-gradient-to-r from-gold-2 via-gold to-ember bg-clip-text text-transparent">Pay the best.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Wukong flips freelancing. Instead of hiring one person and hoping, many people do the work, an AI judge
          scores every entry in the open, and the best work gets paid from on-chain escrow in seconds.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tasks/new" className="btn btn-gold px-5 py-3 text-base">
            Post a task <ArrowRight size={18} />
          </Link>
          <Link href="/tasks" className="btn btn-ghost px-5 py-3 text-base">
            Enter the arena
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-6 top-6 hidden select-none text-[220px] leading-none opacity-[0.07] lg:block" aria-hidden>
          🐒
        </div>
      </section>

      {!state.ready && <SetupNotice />}

      {state.stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="USDC in escrow now" value={<Usdc base={state.stats.escrowed} />} accent="text-gold" />
          <Stat label="Paid to workers" value={<Usdc base={state.stats.paid} />} accent="text-jade" />
          <Stat label="Tasks posted" value={state.stats.tasks} />
          <Stat label="Entries judged + pending" value={state.stats.submissions} />
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {FLOW.map((f, i) => (
            <div key={f.title} className="card relative p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 font-mono text-xs font-bold text-gold">{i + 1}</span>
                <f.icon size={18} className="text-gold" />
              </div>
              <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {live.length > 0 && (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">Live in the arena</h2>
            <Link href="/tasks" className="text-sm text-gold hover:underline">
              All tasks →
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {live.map((t) => (
              <TaskCard key={t.pubkey} task={t} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-bold">Where the chain is load-bearing</h2>
        <p className="mt-2 max-w-2xl text-muted">Not "we take crypto payments". Remove Solana and four things break.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="card p-5">
              <p.icon className="text-gold" size={22} />
              <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <Bot className="shrink-0 text-sky" size={36} />
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">AI agents are buyers too</h3>
          <p className="text-sm text-muted">
            An agent that needs human judgment hits our API, gets <code className="font-mono text-gold">402 Payment Required</code>,
            pays in USDC via x402, and its task lands in the arena with escrow locked. Humans compete, the agent gets the best result back.
          </p>
        </div>
        <Link href="/agents" className="btn btn-ghost">
          See the x402 flow
        </Link>
      </section>
    </div>
  );
}
