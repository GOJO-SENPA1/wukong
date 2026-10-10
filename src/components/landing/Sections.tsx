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

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------- proof strip with live counters */
const PROOF: { icon: SpriteName; title: string; body: string }[] = [
  { icon: "lock", title: "Escrow first", body: "The reward is locked on-chain before anyone starts working." },
  { icon: "scroll", title: "Public scores", body: "Every score is published on-chain with a hash of its written report." },
  { icon: "bolt", title: "Instant payouts", body: "Winners are paid in USDC the moment judging ends. No invoices." },
  { icon: "shield", title: "Owned reputation", body: "Every result builds a record that belongs to the worker, not to us." },
];

export function Proof() {
  const { state } = useApp();
  const s = state.stats;
  const stats = [
    { label: "USDC in escrow now", value: toUsdc(s?.escrowed ?? 0), decimals: 0 },
    { label: "USDC paid to workers", value: toUsdc(s?.paid ?? 0), decimals: 0 },
    { label: "Tasks posted", value: s?.tasks ?? 0, decimals: 0 },
    { label: "Entries submitted", value: s?.submissions ?? 0, decimals: 0 },
  ];
  return (
    <section className="relative border-b border-line bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-px overflow-hidden px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {PROOF.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08} className="group flex gap-4 py-8 md:pr-6">
            <PixelIcon name={p.icon} px={2} motion="hover" className="-ml-1 -mt-1 shrink-0" />
            <div>
              <div className="mono-label text-red">{p.title}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      {s && (
        <div className="border-t border-line bg-paper">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {stats.map((st, i) => (
              <div key={st.label} className={cx("py-7", i > 0 && "md:border-l md:border-line md:pl-8")}>
                <Counter value={st.value} decimals={st.decimals} className="display text-5xl text-navy" />
                <div className="label mt-2">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- a scroll-driven band of giant words */
export function ScrollBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]), { stiffness: 80, damping: 20 });
  const x2 = useSpring(useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]), { stiffness: 80, damping: 20 });
  const row = (words: string[], icon: SpriteName) =>
    Array.from({ length: 4 }).flatMap((_, k) =>
      words.map((w, i) => (
        <span key={`${k}-${i}`} className="flex shrink-0 items-center gap-8 pr-8">
          {w}
          <PixelIcon name={icon} px={3} motion="spin" phase={i + k} />
        </span>
      )),
    );
  return (
    <section ref={ref} className="overflow-hidden bg-paper py-16" aria-hidden>
      <motion.div style={{ x: x1 }} className="display flex whitespace-nowrap text-[clamp(3rem,9vw,8rem)] text-navy">
        {row(["Post a task", "Summon the crowd", "Pay the best"], "coin")}
      </motion.div>
      <motion.div style={{ x: x2 }} className="display -mt-2 flex whitespace-nowrap text-[clamp(3rem,9vw,8rem)] text-transparent [-webkit-text-stroke:2px_#E4261C]">
        {row(["Sealed entries", "Public scores", "Instant USDC"], "monkey")}
      </motion.div>
    </section>
  );
}

/* ---------- how it works */
const STEPS: { n: string; icon: SpriteName; title: string; body: string; foot: string }[] = [
  { n: "01", icon: "lock", title: "Lock the reward", body: "Write the brief and set the reward. The USDC moves into a program-owned vault before the task goes live.", foot: "Full refund if nothing scores 25+" },
  { n: "02", icon: "monkey", title: "The crowd competes", body: "Workers submit before the deadline. Each entry is fingerprinted on-chain and stays sealed until the task closes.", foot: "Optional entry stake keeps spam out" },
  { n: "03", icon: "scroll", title: "AI judges, in public", body: "Every entry is scored against the category's published rubric. Copycats, prompt injections and spam are caught and capped.", foot: "Every report verifiable in your browser" },
  { n: "04", icon: "trophy", title: "The best work gets paid", body: "The program ranks the scores and pays the winners in one transaction: winner takes all, or a 50 / 30 / 20 split.", foot: "Or let the AI shortlist and you pick" },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <section id="how" className="relative bg-paper py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Kicker>How it works</Kicker>
        <Kinetic
          as="h2"
          inView
          text={"One brief. Every attempt.\n*Only* *the* *best* *gets* *paid.*"}
          className="display mt-5 text-[clamp(2.6rem,6vw,5.4rem)] text-navy"
          stagger={0.05}
        />
        <div ref={ref} className="relative mt-16">
          <div className="absolute left-0 right-0 top-[52px] hidden h-[2px] bg-line md:block" aria-hidden>
            <motion.div className="h-full origin-left bg-red" style={{ scaleX: line }} />
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12} className="h-full">
                <div className="card lift group relative flex h-full flex-col p-6">
                  <div className="flex items-start justify-between">
                    <span className="display text-6xl text-red transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">{s.n}</span>
                    <PixelIcon name={s.icon} px={2.4} motion="hover" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                  <div className="mono-label mt-auto border-t border-line pt-4 !text-[10px] text-faint">{s.foot}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- companies / workers */
export function Split() {
  const sides = [
    {
      kicker: "For companies",
      title: "Pay for results,\nnot promises.",
      cls: "bg-navy text-white",
      icon: "cash" as SpriteName,
      points: [
        "See finished work before a single cent leaves escrow.",
        "Many takes on one brief, in hours instead of days.",
        "Your full reward back if nothing clears the quality bar.",
        "Let the AI pick the winners, or shortlist and choose yourself.",
      ],
      cta: { href: "/tasks/new", label: "Post your first task", cls: "btn-red" },
    },
    {
      kicker: "For workers",
      title: "Get paid for the work,\nnot the pitch.",
      cls: "bg-blue text-white",
      icon: "fire" as SpriteName,
      points: [
        "No proposals and no bidding wars. Just do the task.",
        "Entries stay sealed until the deadline, so nobody copies you.",
        "Paid in USDC to a wallet you own, seconds after judging.",
        "Written feedback on every entry, win or lose.",
      ],
      cta: { href: "/tasks", label: "Browse open tasks", cls: "btn-white" },
    },
  ];
  return (
    <section className="bg-paper pb-24 lg:pb-32">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {sides.map((s, si) => (
          <Reveal key={s.kicker} delay={si * 0.12} className="h-full">
            <Tilt max={5} className="h-full rounded-[24px]">
              <div className={cx("relative flex h-full flex-col overflow-hidden rounded-[24px] p-8 sm:p-10", s.cls)}>
                <Spotlight color="rgb(255 255 255 / 0.12)" size={380} />
                <div className="absolute -right-6 -top-4 opacity-90">
                  <PixelIcon name={s.icon} px={5} motion="bob" phase={si} />
                </div>
                <div className="mono-label relative text-white/60">{s.kicker}</div>
                <h3 className="display relative mt-4 whitespace-pre-line text-[clamp(2.2rem,4vw,3.4rem)]">{s.title}</h3>
                <ul className="relative mt-8 flex flex-col gap-3.5">
                  {s.points.map((p, i) => (
                    <motion.li
                      key={p}
                      className="flex gap-3 text-[15px] leading-relaxed text-white/85"
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.08, duration: 0.6, ease: EASE }}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {p}
                    </motion.li>
                  ))}
                </ul>
                <div className="relative mt-auto pt-10">
                  <Link href={s.cta.href} className={cx("btn h-12 px-6", s.cta.cls)}>
                    {s.cta.label} <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </Tilt>
          </Reveal>
        ))}
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
    <section className="relative overflow-hidden bg-navy py-24 text-white lg:py-32">
      <div className="grid-lines absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <Spotlight color="rgb(43 60 255 / 0.25)" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker dark>The judge</Kicker>
          <h2 className="display mt-5 text-[clamp(2.8rem,6vw,5.4rem)]">
            <Kinetic as="span" inView text="An AI judge" stagger={0.06} className="block" />
            <Reveal as="span" delay={0.25} className="serif-quote block normal-case tracking-normal text-red-2" y={20}>
              <span className="text-[1.05em] leading-none">you can audit.</span>
            </Reveal>
          </h2>
          <Reveal delay={0.2} className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/65">
            Each category has a public rubric. The judge checks every entry against its on-chain fingerprint, runs fixed integrity checks, then scores
            and explains. The score and a hash of the report are written on-chain once, and can never be edited.
          </Reveal>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            {CHECKS.map((c, i) => (
              <motion.div
                key={c.label}
                className={cx("relative flex items-center justify-between gap-4 border-white/10 px-5 py-4 text-[14.5px]", i > 0 && "border-t")}
                onHoverStart={() => setScan(i)}
                onHoverEnd={() => setScan(-1)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.09, ease: EASE, duration: 0.6 }}
              >
                <motion.span
                  className="absolute inset-y-0 left-0 bg-red/15"
                  initial={{ width: 0 }}
                  animate={{ width: scan === i ? "100%" : 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
                <span className="relative text-white/85">{c.label}</span>
                <span className="mono-label relative text-red-2">{c.result}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div ref={ref}>
          <Tilt max={6} className="rounded-[24px]">
            <div className="rounded-[24px] bg-white p-7 text-navy shadow-[0_50px_100px_-40px_rgb(0_0_0/0.8)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mono-label text-muted">Entry #7 · judge report</div>
                  <div className="mt-1 text-[17px] font-semibold">Rina T. · Pokhara</div>
                </div>
                <div className="text-right">
                  <span className="display text-[88px] leading-[0.8]">{seen ? <Counter value={88} duration={1.8} /> : "0"}</span>
                  <span className="ml-1 text-sm text-muted">/100</span>
                </div>
              </div>
              <blockquote className="serif-quote mt-6 min-h-[64px] text-[22px] leading-snug">
                {seen && (
                  <TypeLines lines={[{ text: "“Specific, warm and on-brief. The second line could be tighter.”" }]} speed={22} start={500} />
                )}
              </blockquote>
              <div className="mt-6 flex flex-col gap-3.5">
                {CRITERIA.map((c, i) => (
                  <div key={c.label} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-[13px]">
                    <span className="text-muted">
                      {c.label} <span className="text-faint">{c.w}</span>
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <motion.div
                        className="h-full rounded-full bg-navy"
                        initial={{ width: 0 }}
                        animate={seen ? { width: `${c.v * 10}%` } : undefined}
                        transition={{ delay: 0.6 + i * 0.15, duration: 1.2, ease: EASE }}
                      />
                    </div>
                    <span className="text-right font-mono font-semibold tabular-nums">{c.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] uppercase tracking-[0.12em]">
                <span className="text-muted">
                  SHA256 <Scramble text="9F3C·12A0·E7D1" duration={1600} />
                </span>
                <motion.span
                  className="flex items-center gap-1.5 text-blue"
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
    <section className="bg-paper py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Open right now</Kicker>
            <Kinetic as="h2" inView text="Pick a task. Start now." className="display mt-5 text-[clamp(2.6rem,6vw,5rem)]" />
          </div>
          <Link href="/tasks" className="group flex items-center gap-2 font-semibold text-blue">
            <span className="link-underline">Browse all tasks</span>
            <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-60" />)
            : tasks.length === 0
              ? (
                <div className="card col-span-full p-10 text-center text-muted">
                  No open tasks yet. <Link href="/tasks/new" className="font-semibold text-red">Post the first one</Link>.
                </div>
              )
              : tasks.map((t, i) => (
                  <Reveal key={t.pubkey} delay={i * 0.1} className="h-full">
                    <MiniTask task={t} />
                  </Reveal>
                ))}
        </div>
      </div>
    </section>
  );
}

function MiniTask({ task }: { task: TaskCard }) {
  const total = Math.max(1, task.deadline - task.createdAt);
  const left = Math.max(0, Math.min(1, (task.deadline - Date.now() / 1000) / total));
  return (
    <Tilt max={6} className="h-full rounded-[20px]">
      <Link href={`/tasks/${task.pubkey}`} className="card group flex h-full flex-col p-6 transition-colors hover:border-navy">
        <div className="flex items-center justify-between gap-2">
          <span className="mono-label text-muted">{task.categoryLabel}</span>
          <span className="mono-label text-red">{task.status === "open" ? <Countdown deadline={task.deadline} /> : "Judging"}</span>
        </div>
        <h3 className="mt-3 text-[19px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-red">{task.title}</h3>
        <p className="mt-1 text-[13.5px] text-muted">{task.agent ? task.agent.name : task.creatorName}</p>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-paper-2">
          <motion.div
            className="h-full rounded-full bg-red"
            initial={{ width: 0 }}
            whileInView={{ width: `${(1 - left) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE }}
          />
        </div>
        <div className="mt-auto flex items-end justify-between pt-6">
          <div className="flex items-baseline gap-1.5">
            <span className="display text-5xl leading-none">{toUsdc(task.reward).toLocaleString("en-US")}</span>
            <span className="text-[12px] font-semibold text-muted">USDC · {task.payoutMode === "topThree" ? "top 3 paid" : "winner takes all"}</span>
          </div>
          <span className="text-[12.5px] text-muted">{task.submissionCount} entries</span>
        </div>
      </Link>
    </Tilt>
  );
}

/* ---------- agents */
export function Agents() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-white py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker>For AI agents</Kicker>
          <Kinetic as="h2" inView text={"Agents can hire\n*humans* too."} className="display mt-5 text-[clamp(2.6rem,6vw,5rem)]" />
          <Reveal delay={0.15} className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted">
            Any agent can post a task with one HTTP request and pay with x402. The reward is escrowed, people compete, and the agent fetches the
            winning work when judging ends.
          </Reveal>
          <Reveal delay={0.25} className="mt-8 flex items-center gap-4">
            <Link href="/agents" className="btn btn-navy h-12 px-6">
              Read the API flow <ArrowRight size={17} />
            </Link>
            <PixelIcon name="robot" px={2.6} motion="bob" />
          </Reveal>
        </div>
        <Reveal delay={0.1} y={40}>
          <div className="overflow-hidden rounded-[20px] bg-navy shadow-[0_40px_80px_-40px_rgb(12_20_36/0.8)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-red" />
              <span className="h-3 w-3 rounded-full bg-gold" />
              <span className="h-3 w-3 rounded-full bg-green" />
              <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">agent.ts · x402</span>
            </div>
            <TypeLines
              loop
              className="min-h-[260px] p-6 font-mono text-[13.5px] leading-7"
              speed={18}
              pause={420}
              lines={[
                { text: "→ POST /api/x402/tasks", className: "text-white" },
                { text: "← 402 Payment Required · 25.00 USDC", className: "text-red-2" },
                { text: "→ X-PAYMENT: exact · 25.00 USDC (signed)", className: "text-white/70" },
                { text: "← 201 Task escrowed · vault 7xKX…Q2LM", className: "text-[#5ee6a0]" },
                { text: '  { "task": "9hX3…1x4K", "status": "open" }', className: "text-white/50" },
                { text: "→ GET /api/x402/tasks/9hX3…1x4K", className: "text-white" },
                { text: "← 200 winner: 91/100 · paid to Maya, Manila", className: "text-blue-2" },
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
    <section className="bg-paper py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Kicker>Pricing</Kicker>
          <Kinetic as="h2" inView text={"You only pay\nwhen it pays out."} className="display mt-5 text-[clamp(2.6rem,6vw,5rem)]" />
        </div>
        <Reveal y={30}>
          <div className="card relative overflow-hidden p-8 sm:p-10">
            <div className="flex flex-wrap items-end gap-5">
              <span className="display text-[clamp(6rem,14vw,9.5rem)] leading-[0.8] text-red">
                <Counter value={10} duration={1.6} suffix="%" />
              </span>
              <p className="max-w-[16rem] pb-2 text-[15px] leading-relaxed text-muted">of the reward, taken only when winners are paid.</p>
            </div>
            <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-[15px]">
              {["Workers never pay a fee.", "If nothing clears the quality bar, your full reward comes back. Fee-free.", "Entry stakes are refunded unless the entry is spam."].map((t, i) => (
                <motion.li
                  key={t}
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, ease: EASE, duration: 0.6 }}
                >
                  <Check size={18} className="mt-0.5 shrink-0 text-green" strokeWidth={3} />
                  {t}
                </motion.li>
              ))}
            </ul>
            <div className="absolute right-4 top-4">
              <PixelIcon name="coin" px={4} motion="spin" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- questions */
const FAQ = [
  {
    q: "Do I need crypto to use Wukong?",
    a: "No. Sign up with Google or email and a Solana wallet is created for you. Add USDC by transfer, or connect Phantom if you already have a wallet.",
  },
  {
    q: "What if no entry is good enough?",
    a: "Every task has a quality bar. If no entry scores 25 or more, the whole reward goes back to you from escrow, with no fee.",
  },
  {
    q: "Who is the judge, and can it be gamed?",
    a: "An AI judge applies the category's public rubric to every entry. Integrity checks run first: copies, hidden instructions and spam are capped. Each score and a hash of its report go on-chain, so anyone can verify them.",
  },
  {
    q: "How do workers cash out?",
    a: "Winnings arrive as USDC in the worker's own wallet the moment judging ends. From there they can hold, send or cash out through any exchange.",
  },
  {
    q: "Which tasks work best?",
    a: "Anything where many attempts beat one: copy and taglines, translation, small coding tasks, data labeling and research.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-paper pb-24 lg:pb-32">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Kinetic as="h2" inView text="Questions" className="display text-[clamp(2.4rem,5vw,4rem)]" />
        <div className="mt-10 flex flex-col">
          {FAQ.map((f, i) => (
            <div key={f.q} className="border-b border-line-2">
              <button
                className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-semibold"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className="transition-colors group-hover:text-red">{f.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", open === i ? "bg-red text-white" : "bg-white")}
                >
                  <Plus size={18} />
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
                    <p className="max-w-2xl pb-6 text-[15.5px] leading-relaxed text-muted">{f.a}</p>
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
  return (
    <section className="relative overflow-hidden bg-red text-white">
      <Spotlight color="rgb(255 255 255 / 0.18)" size={600} />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <Kinetic as="h2" inView text={"Your next hire\nis a crowd."} className="display text-[clamp(3.4rem,10vw,9rem)]" stagger={0.07} />
        <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
          <Magnetic>
            <Link
              href="/tasks/new"
              className="btn btn-navy h-14 px-7 text-base"
              onMouseEnter={(e) => burst(e.currentTarget, { count: 8 })}
            >
              Post a task <ArrowRight size={18} />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/tasks" className="btn btn-ghost-light h-14 px-7 text-base">
              Find work
            </Link>
          </Magnetic>
        </Reveal>
      </div>
      <div className="relative pb-6 pt-10" aria-hidden>
        <Marquee speed={22}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="mx-3">
              <PixelIcon name={i % 4 === 3 ? "coin" : "monkey"} px={3} motion="bob" phase={i * 0.7} />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
