"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Counter, Kinetic, Magnetic, Marquee, Reveal, Scramble, Spotlight, Tilt, TypeLines } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Countdown, Kicker, Skeleton, cx } from "@/components/ui";
import { toUsdc } from "@/lib/format";
import type { SpriteName } from "@/lib/fx/sprites";
import type { TaskCard } from "@/lib/server/views";
import { FAQ } from "@/lib/faq";
import { track } from "@/lib/client/analytics";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------- live numbers and the four promises */
const PROOF: { icon: SpriteName; title: string; body: string }[] = [
  { icon: "lock", title: "Escrow first", body: "The reward is locked on-chain before anyone starts working." },
  { icon: "scroll", title: "Public scores", body: "Every score is published on-chain with a hash of its written report." },
  { icon: "bolt", title: "Instant payouts", body: "Winners are paid in USDC the moment judging ends. No invoices." },
  { icon: "shield", title: "Owned reputation", body: "Every result builds a record that belongs to the freelancer, not to us." },
];

export function Proof() {
  const { state } = useApp();
  const s = state.stats;
  const stats = [
    { label: "USDC in escrow now", value: toUsdc(s?.escrowed ?? 0) },
    { label: "USDC paid to freelancers", value: toUsdc(s?.paid ?? 0) },
    { label: "Tasks posted", value: s?.tasks ?? 0 },
    { label: "Entries submitted", value: s?.submissions ?? 0 },
  ];
  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((st, i) => (
          <div key={st.label} className={cx("py-10 md:py-14", i % 2 === 1 && "border-l border-line pl-6 md:pl-8", i >= 2 && "md:border-l md:border-line md:pl-8")}>
            {s ? <Counter value={st.value} className="num text-[clamp(2.6rem,5vw,4.2rem)] text-fg" /> : <Skeleton className="h-14 w-24" />}
            <div className="label mt-3">{st.label}</div>
          </div>
        ))}
      </div>
      <div className="rule mx-auto max-w-7xl" />
      <div className="mx-auto grid w-full max-w-7xl gap-x-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {PROOF.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.06} className="group flex gap-4 py-10">
            <PixelIcon name={p.icon} px={1.9} motion="hover" className="-ml-1 -mt-1 shrink-0 opacity-90" />
            <div>
              <div className="text-[15px] font-semibold tracking-tight">{p.title}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="rule mx-auto max-w-7xl" />
    </section>
  );
}

/* ---------- a scroll-driven band of giant words */
export function ScrollBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]), { stiffness: 80, damping: 22 });
  const x2 = useSpring(useTransform(scrollYProgress, [0, 1], ["-25%", "0%"]), { stiffness: 80, damping: 22 });
  const row = (words: string[], icon: SpriteName) =>
    Array.from({ length: 4 }).flatMap((_, k) =>
      words.map((w, i) => (
        <span key={`${k}-${i}`} className="flex shrink-0 items-center gap-10 pr-10">
          {w}
          <PixelIcon name={icon} px={2.6} motion="spin" phase={i + k} />
        </span>
      )),
    );
  return (
    <section ref={ref} className="overflow-hidden border-y border-line py-14" aria-hidden>
      <motion.div style={{ x: x1 }} className="display flex whitespace-nowrap text-[clamp(3rem,8.5vw,7.5rem)] text-fg/90">
        {row(["Post a task", "Summon the crowd", "Pay the best"], "coin")}
      </motion.div>
      <motion.div
        style={{ x: x2 }}
        className="display mt-1 flex whitespace-nowrap text-[clamp(3rem,8.5vw,7.5rem)] italic text-transparent [-webkit-text-stroke:1px_rgb(216_179_108/0.7)]"
      >
        {row(["Sealed entries", "Public scores", "Instant USDC"], "monkey")}
      </motion.div>
    </section>
  );
}

/* ---------- how it works */
const STEPS: { n: string; icon: SpriteName; title: string; body: string; foot: string }[] = [
  { n: "01", icon: "lock", title: "Lock the reward", body: "Write the brief and set the reward. The USDC moves into a program-owned vault before the task goes live.", foot: "Full refund if nothing scores 25+" },
  { n: "02", icon: "monkey", title: "The crowd competes", body: "Freelancers submit before the deadline. Each entry is fingerprinted on-chain and stays sealed until the task closes.", foot: "Optional entry stake keeps spam out" },
  { n: "03", icon: "scroll", title: "AI judges, in public", body: "Every entry is scored against the category's published rubric. Copycats, prompt injections and spam are caught and capped.", foot: "Every report verifiable in your browser" },
  { n: "04", icon: "trophy", title: "The best work gets paid", body: "The program ranks the scores and pays the winners in one transaction: winner takes all, or a 50 / 30 / 20 split.", foot: "Or let the AI shortlist and you pick" },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <section id="how" className="relative py-28 lg:py-36">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <Kicker>How it works</Kicker>
            <Kinetic
              as="h2"
              inView
              text={"One brief. Every attempt.\n*Only* *the* *best* *gets* *paid.*"}
              className="display mt-6 text-[clamp(2.6rem,5.6vw,5rem)]"
              accent="italic text-gold-2"
              stagger={0.045}
            />
          </div>
          <Reveal delay={0.2} className="max-w-md text-[16px] leading-relaxed text-muted lg:justify-self-end">
            Instead of hiring one person on a promise, you see finished work from many and pay only for the best. Every step is enforced by a
            Solana program, not by us.
          </Reveal>
        </div>
        <div ref={ref} className="relative mt-16">
          <div className="absolute left-0 right-0 top-0 hidden h-px bg-line md:block" aria-hidden>
            <motion.div className="h-full origin-left bg-gradient-to-r from-red via-gold to-gold-2" style={{ scaleX: line }} />
          </div>
          <div className="grid gap-px md:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1} className="h-full">
                <div className="group relative flex h-full flex-col border-line pb-8 pt-8 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0">
                  <div className="flex items-center justify-between">
                    <span className="display text-[3.4rem] italic leading-none text-gold/80 transition-colors duration-500 group-hover:text-gold-2">{s.n}</span>
                    <PixelIcon name={s.icon} px={2.2} motion="hover" />
                  </div>
                  <h3 className="mt-6 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                  <div className="label mt-auto pt-6 !text-[10px] !text-faint">{s.foot}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- organisations / freelancers */
export function Split() {
  const { role, identityReady } = useApp();
  const r = identityReady ? role : null;
  const sides = [
    {
      key: "company",
      kicker: "For organisations",
      title: "Pay for results,",
      em: "not promises.",
      icon: "cash" as SpriteName,
      points: [
        "See finished work before a single cent leaves escrow.",
        "Many takes on one brief, in hours instead of days.",
        "Your full reward back if nothing clears the quality bar.",
        "Track every live task, who entered and every judge's report.",
      ],
      cta: r === "company" ? { href: "/dashboard", label: "Open my tasks" } : { href: "/business", label: "Register your organisation" },
      card: "card-gold",
      glow: "bg-red/20",
      check: "bg-red/15 text-red-2",
    },
    {
      key: "worker",
      kicker: "For freelancers",
      title: "Get paid for the work,",
      em: "not the pitch.",
      icon: "fire" as SpriteName,
      points: [
        "No proposals and no bidding wars. Just do the task.",
        "Entries stay sealed until the deadline, so nobody copies you.",
        "Paid in USDC to a wallet you own, seconds after judging.",
        "Written feedback on every entry, win or lose.",
      ],
      cta: r === "worker" ? { href: "/dashboard", label: "Open my work" } : { href: "/signin", label: "Join as a freelancer" },
      card: "card",
      glow: "bg-blue/20",
      check: "bg-blue/15 text-blue-2",
    },
  ];
  return (
    <section className="pb-28 lg:pb-36">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex items-center gap-4">
          <span className="label">Two sides, one marketplace</span>
          <span className="h-px flex-1 bg-line" />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {sides.map((s, si) => {
            const mine = r === s.key;
            return (
              <Reveal key={s.key} delay={si * 0.1} className="h-full">
                <div className={cx("relative flex h-full flex-col overflow-hidden !rounded-[24px] p-8 sm:p-10", s.card)}>
                  <div className={cx("pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl", s.glow)} aria-hidden />
                  <Spotlight size={420} />
                  <div className="absolute right-6 top-6 opacity-90">
                    <PixelIcon name={s.icon} px={3.6} motion="bob" phase={si} />
                  </div>
                  <div className="relative flex items-center gap-3">
                    <span className="label">{s.kicker}</span>
                    {mine && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-gold-2">You</span>}
                  </div>
                  <h3 className="display relative mt-5 text-[clamp(2.2rem,3.6vw,3.2rem)]">
                    {s.title}
                    <br />
                    <em className="text-gold-2">{s.em}</em>
                  </h3>
                  <ul className="relative mt-8 flex flex-col gap-3.5">
                    {s.points.map((p, i) => (
                      <motion.li
                        key={p}
                        className="flex gap-3 text-[15px] leading-relaxed text-fg/80"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.07, duration: 0.6, ease: EASE }}
                      >
                        <span className={cx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", s.check)}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                        {p}
                      </motion.li>
                    ))}
                  </ul>
                  <div className="relative mt-auto pt-10">
                    <Link href={s.cta.href} className={cx("btn h-12 px-6", si === 0 ? "btn-red" : "btn-ivory")}>
                      {s.cta.label} <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- the judge */
const CHECKS = [
  { label: "Copy of an earlier entry", result: "Capped at 10" },
  { label: "Prompt injection", result: "Scored 0" },
  { label: "Spam or low effort", result: "Capped at 15" },
  { label: "Wrong language", result: "Capped at 25" },
];
const CRITERIA = [
  { label: "Brief fit", w: "35%", v: 9.2 },
  { label: "Craft", w: "30%", v: 8.7 },
  { label: "Originality", w: "20%", v: 8.5 },
  { label: "Constraints", w: "15%", v: 9.8 },
];

export function Judge() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [scan, setScan] = useState(-1);
  return (
    <section className="relative overflow-hidden border-y border-line bg-surface/60 py-28 lg:py-36">
      <div className="aura left-[40%] top-[10%] h-[520px] w-[520px] bg-blue/20" aria-hidden />
      <div className="grid-lines mask-fade-b absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker>The judge</Kicker>
          <h2 className="display mt-6 text-[clamp(2.8rem,5.6vw,5rem)]">
            <Kinetic as="span" inView text="An AI judge" stagger={0.06} className="block" />
            <Reveal as="span" delay={0.25} className="block italic text-blue-2" y={16}>
              you can audit.
            </Reveal>
          </h2>
          <Reveal delay={0.2} className="mt-7 max-w-lg text-[16px] leading-relaxed text-muted">
            Each category has a public rubric. The judge checks every entry against its on-chain fingerprint, runs fixed integrity checks, then scores
            and explains. The score and a hash of the report are written on-chain once, and can never be edited.
          </Reveal>
          <div className="mt-9 overflow-hidden rounded-2xl border border-line-2">
            {CHECKS.map((c, i) => (
              <motion.div
                key={c.label}
                className={cx("relative flex items-center justify-between gap-4 border-line px-5 py-4 text-[14.5px]", i > 0 && "border-t")}
                onHoverStart={() => setScan(i)}
                onHoverEnd={() => setScan(-1)}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12 + i * 0.08, ease: EASE, duration: 0.6 }}
              >
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red/15 to-red/0"
                  initial={{ width: 0 }}
                  animate={{ width: scan === i ? "100%" : 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
                <span className="relative text-fg/85">{c.label}</span>
                <span className="mono-label relative !text-[10.5px] text-red-2">{c.result}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div ref={ref}>
          <Tilt max={5} className="rounded-[24px]">
            <div className="card-gold !rounded-[24px] p-7 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="label">Entry #7 · judge report</div>
                  <div className="mt-1.5 text-[17px] font-semibold">Rina T. · Pokhara</div>
                </div>
                <div className="text-right">
                  <span className="num text-foil text-[88px]">{seen ? <Counter value={88} duration={1.8} /> : "0"}</span>
                  <span className="ml-1 text-sm text-muted">/100</span>
                </div>
              </div>
              <blockquote className="serif-quote mt-6 min-h-[64px] text-[23px] leading-snug text-fg/90">
                {seen && <TypeLines lines={[{ text: "“Specific, warm and on-brief. The second line could be tighter.”" }]} speed={22} start={500} />}
              </blockquote>
              <div className="mt-7 flex flex-col gap-4">
                {CRITERIA.map((c, i) => (
                  <div key={c.label} className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-[13px]">
                    <span className="text-muted">
                      {c.label} <span className="text-faint">{c.w}</span>
                    </span>
                    <div className="h-1 overflow-hidden rounded-full bg-fg/[0.07]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold-2"
                        initial={{ width: 0 }}
                        animate={seen ? { width: `${c.v * 10}%` } : undefined}
                        transition={{ delay: 0.6 + i * 0.15, duration: 1.2, ease: EASE }}
                      />
                    </div>
                    <span className="text-right font-mono font-medium tabular-nums">{c.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-line pt-4 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                <span className="text-faint">
                  SHA256 <Scramble text="9F3C·12A0·E7D1" duration={1600} />
                </span>
                <motion.span
                  className="flex items-center gap-1.5 text-blue-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={seen ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ delay: 2.2, type: "spring", stiffness: 400, damping: 18 }}
                >
                  <Check size={13} strokeWidth={3} /> Matches the chain
                </motion.span>
              </div>
            </div>
          </Tilt>
        </div>
      </div>
    </section>
  );
}

/* ---------- live tasks */
export function LiveTasks() {
  const { state } = useApp();
  const tasks = (state.tasks ?? []).filter((t) => t.status === "open" || t.status === "judging").slice(0, 3);
  const loading = !state.tasks;
  return (
    <section className="py-28 lg:py-36">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Open right now</Kicker>
            <Kinetic as="h2" inView text="Pick a task. *Start* *now.*" accent="italic text-gold-2" className="display mt-6 text-[clamp(2.6rem,5.6vw,4.8rem)]" />
          </div>
          <Link href="/tasks" className="btn btn-line h-11 px-5">
            Browse the marketplace <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-60 !rounded-[20px]" />)
          ) : tasks.length === 0 ? (
            <div className="card col-span-full p-12 text-center text-muted">
              No open tasks yet.{" "}
              <Link href="/tasks/new" className="font-semibold text-fg underline decoration-gold/60 underline-offset-4">
                Post the first one
              </Link>
              .
            </div>
          ) : (
            tasks.map((t, i) => (
              <Reveal key={t.pubkey} delay={i * 0.08} className="h-full">
                <MiniTask task={t} />
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MiniTask({ task }: { task: TaskCard }) {
  const total = Math.max(1, task.deadline - task.createdAt);
  const left = Math.max(0, Math.min(1, (task.deadline - Date.now() / 1000) / total));
  return (
    <Link href={`/tasks/${task.pubkey}`} className="card lift group relative flex h-full flex-col overflow-hidden !rounded-[20px] p-6">
      <Spotlight size={360} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="label">{task.categoryLabel}</span>
        <span className="mono-label !text-[10px] text-red-2">{task.status === "open" ? <Countdown deadline={task.deadline} /> : "Judging"}</span>
      </div>
      <h3 className="relative mt-4 text-[19px] font-semibold leading-snug tracking-tight">{task.title}</h3>
      <p className="relative mt-1 text-[13.5px] text-muted">{task.agent ? task.agent.name : task.creatorName}</p>
      <div className="relative mt-5 h-px overflow-hidden bg-line">
        <motion.div
          className="h-full bg-gradient-to-r from-red to-gold"
          initial={{ width: 0 }}
          whileInView={{ width: `${(1 - left) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
      <div className="relative mt-auto flex items-end justify-between pt-7">
        <div className="flex items-baseline gap-2">
          <span className="num text-[3.2rem] text-fg transition-colors duration-500 group-hover:text-gold-2">{toUsdc(task.reward).toLocaleString("en-US")}</span>
          <span className="text-[12px] font-medium text-muted">USDC · {task.payoutMode === "topThree" ? "top 3 paid" : "winner takes all"}</span>
        </div>
        <span className="text-[12.5px] text-muted">{task.submissionCount} entries</span>
      </div>
    </Link>
  );
}

/* ---------- agents */
export function Agents() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-surface/60 py-28 lg:py-36">
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker>For AI agents</Kicker>
          <Kinetic as="h2" inView text={"Agents can hire\n*humans* too."} accent="italic text-gold-2" className="display mt-6 text-[clamp(2.6rem,5.6vw,4.8rem)]" />
          <Reveal delay={0.15} className="mt-7 max-w-lg text-[16px] leading-relaxed text-muted">
            Any agent can post a task with one HTTP request and pay with x402. The reward is escrowed, people compete, and the agent fetches the
            winning work when judging ends.
          </Reveal>
          <Reveal delay={0.25} className="mt-9 flex items-center gap-5">
            <Link href="/agents" className="btn btn-dark h-12 px-6">
              Read the API flow <ArrowRight size={17} />
            </Link>
            <PixelIcon name="robot" px={2.4} motion="bob" />
          </Reveal>
        </div>
        <Reveal delay={0.1} y={24}>
          <div className="overflow-hidden rounded-[20px] border border-line-2 bg-[#05060a] shadow-[0_50px_100px_-40px_rgb(0_0_0/1)]">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
              <span className="ml-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">agent.ts · x402</span>
            </div>
            <TypeLines
              loop
              className="min-h-[260px] p-6 font-mono text-[13px] leading-7"
              speed={18}
              pause={420}
              lines={[
                { text: "→ POST /api/x402/tasks", className: "text-fg" },
                { text: "← 402 Payment Required · 25.00 USDC", className: "text-red-2" },
                { text: "→ X-PAYMENT: exact · 25.00 USDC (signed)", className: "text-muted" },
                { text: "← 201 Task escrowed · vault 7xKX…Q2LM", className: "text-green" },
                { text: '  { "task": "9hX3…1x4K", "status": "open" }', className: "text-faint" },
                { text: "→ GET /api/x402/tasks/9hX3…1x4K", className: "text-fg" },
                { text: "← 200 winner: 91/100 · paid to Maya, Manila", className: "text-gold-2" },
              ]}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- pricing */
export function Pricing() {
  return (
    <section className="py-28 lg:py-36">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker>Pricing</Kicker>
          <Kinetic as="h2" inView text={"You only pay\n*when* *it* *pays* *out.*"} accent="italic text-gold-2" className="display mt-6 text-[clamp(2.6rem,5.6vw,4.8rem)]" />
        </div>
        <Reveal y={20}>
          <div className="card-gold relative overflow-hidden !rounded-[24px] p-8 sm:p-10">
            <div className="flex flex-wrap items-end gap-6">
              <span className="num text-foil text-[clamp(6rem,13vw,9rem)] !leading-[0.8]">
                <Counter value={10} duration={1.6} suffix="%" />
              </span>
              <p className="max-w-[16rem] pb-2 text-[15px] leading-relaxed text-muted">of the reward, taken only when winners are paid.</p>
            </div>
            <ul className="mt-9 flex flex-col gap-3.5 border-t border-line pt-7 text-[15px] text-fg/85">
              {["Freelancers never pay a fee.", "If nothing clears the quality bar, your full reward comes back. Fee-free.", "Entry stakes are refunded unless the entry is spam."].map(
                (t, i) => (
                  <motion.li
                    key={t}
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, ease: EASE, duration: 0.6 }}
                  >
                    <Check size={17} className="mt-0.5 shrink-0 text-gold" strokeWidth={2.5} />
                    {t}
                  </motion.li>
                ),
              )}
            </ul>
            <div className="absolute right-6 top-6">
              <PixelIcon name="coin" px={3.4} motion="spin" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- questions */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="border-t border-line py-28 lg:py-36">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <div>
          <Kicker>Questions</Kicker>
          <Kinetic as="h2" inView text={"Asked, and\n*answered.*"} accent="italic text-gold-2" className="display mt-6 text-[clamp(2.4rem,4.6vw,4rem)]" />
        </div>
        <div className="flex flex-col border-t border-line">
          {FAQ.map((f, i) => (
            <div key={f.q} className="border-b border-line">
              <button
                className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[16.5px] font-medium"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className={cx("transition-colors duration-300", open === i ? "text-fg" : "text-fg/80 group-hover:text-fg")}>{f.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    open === i ? "bg-fg text-bg" : "text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.13)]",
                  )}
                >
                  <Plus size={16} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-muted">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- final call to action */
export function FinalCta() {
  const { role, identityReady } = useApp();
  const r = identityReady ? role : null;
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div className="aura left-[-5%] top-[0%] h-[560px] w-[560px] bg-red/30" aria-hidden />
      <div className="aura right-[0%] top-[20%] h-[480px] w-[480px] bg-gold/20 [animation-delay:-5s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-28 text-center sm:px-6 lg:px-8 lg:pt-40">
        <Kinetic
          as="h2"
          inView
          text={"Your next hire\n*is* *a* *crowd.*"}
          accent="text-foil italic"
          className="display mx-auto text-[clamp(3.4rem,9vw,8.4rem)] !leading-[0.9]"
          stagger={0.06}
        />
        <Reveal delay={0.3} className="mt-12 flex flex-wrap justify-center gap-3">
          {r !== "worker" && (
            <Magnetic strength={0.2}>
              <Link
                href={r === "company" ? "/tasks/new" : "/business"}
                className="btn btn-red h-13 px-7 text-[15px]"
                onMouseEnter={(e) => burst(e.currentTarget, { count: 8 })}
                onClick={() => track("cta_click", { cta: r === "company" ? "final Post a task" : "final Hire the crowd" })}
              >
                {r === "company" ? "Post a task" : "Hire the crowd"} <ArrowRight size={18} />
              </Link>
            </Magnetic>
          )}
          {r !== "company" && (
            <Link href="/tasks" className={cx("btn h-13 px-7 text-[15px]", r === "worker" ? "btn-red" : "btn-line")} onClick={() => track("cta_click", { cta: "final Find work" })}>
              Find work
            </Link>
          )}
        </Reveal>
      </div>
      <div className="relative pb-8 pt-12 opacity-80" aria-hidden>
        <Marquee speed={26}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="mx-4">
              <PixelIcon name={i % 4 === 3 ? "coin" : "monkey"} px={2.6} motion="bob" phase={i * 0.7} />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
