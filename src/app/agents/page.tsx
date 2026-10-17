"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useApp } from "@/components/Providers";
import { toast } from "@/components/Toast";
import { track } from "@/lib/client/analytics";
import { TaskCard } from "@/components/TaskCard";
import { Kinetic, Reveal, Spotlight, TypeLines } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Empty, Kicker, cx } from "@/components/ui";
import type { SpriteName } from "@/lib/fx/sprites";

const STEPS: { icon: SpriteName; title: string; body: string }[] = [
  { icon: "robot", title: "The agent asks", body: "POST /api/x402/tasks with a brief and a budget. No account, no API key." },
  { icon: "lock", title: "402, then it pays", body: "The server answers 402 Payment Required. The agent signs a USDC transfer and retries with X-PAYMENT." },
  { icon: "coin", title: "Escrow locks it", body: "The gateway settles the payment into on-chain escrow. The task appears in the arena for the crowd." },
  { icon: "monkey", title: "Humans compete", body: "People around the world do the work. The AI judge scores every entry on-chain." },
  { icon: "scroll", title: "The agent gets the best", body: "The agent polls its status URL and receives the winning work plus the judge's report." },
];

export default function AgentsPage() {
  const { state } = useApp();
  const agentTasks = (state.tasks ?? []).filter((t) => t.origin === "x402");
  const [origin, setOrigin] = useState("https://wukonghq.xyz");
  useEffect(() => setOrigin(window.location.origin), []);
  const cluster = state.deployment?.cluster ?? "devnet";

  return (
    <div className="flex flex-col gap-14">
      <div className="max-w-4xl">
        <Reveal y={10}>
          <Kicker>x402 · HTTP 402 Payment Required</Kicker>
        </Reveal>
        <Kinetic text={"Agents can hire\n*humans* too."} accent="italic text-gold-2" className="display mt-6 text-[clamp(3rem,7vw,5.6rem)]" />
        <Reveal delay={0.3} className="mt-7 max-w-2xl text-[16.5px] leading-relaxed text-muted">
          Agents need people for what models can&apos;t verify alone: cultural review, local language, taste, ground truth. Wukong turns that into an API that speaks
          x402. Payment is the authentication; escrow is the receipt.
        </Reveal>
      </div>

      <Flow />

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Terminal
            title="1 · Ask"
            copyText={`curl -i -X POST ${origin}/api/x402/tasks -H 'content-type: application/json' -d '{"title":"Nepali welcome note","rewardUsdc":25,"brief":"Translate ... into warm Nepali (Devanagari)","category":1,"agentName":"TrekBot"}'`}
            lines={[
              { text: `$ curl -i -X POST ${origin.replace(/^https?:\/\//, "")}/api/x402/tasks \\`, className: "text-fg" },
              { text: `    -d '{"title":"Nepali welcome note","rewardUsdc":25,`, className: "text-muted" },
              { text: `         "category":1,"agentName":"TrekBot", ...}'`, className: "text-muted" },
              { text: "HTTP/1.1 402 Payment Required", className: "text-red-2" },
              { text: `{"x402Version":1,"accepts":[{"scheme":"exact",`, className: "text-faint" },
              { text: `  "network":"solana-${cluster}","maxAmountRequired":"25000000",`, className: "text-faint" },
              { text: `  "asset":"<USDC mint>","payTo":"<gateway>"}]}`, className: "text-faint" },
            ]}
          />
        </Reveal>
        <Reveal delay={0.1}>
          <Terminal
            title="2 · Pay and get a task"
            copyText="npm run agent -- --auto"
            lines={[
              { text: `$ curl -X POST .../api/x402/tasks -H "X-PAYMENT: eyJ4NDAy..."`, className: "text-fg" },
              { text: "HTTP/1.1 201 Created", className: "text-green" },
              { text: "X-PAYMENT-RESPONSE: eyJzdWNjZXNzIjp0cnVlLC...", className: "text-faint" },
              { text: `{"task":"9xQ…","escrowTx":"4Lm…","status":".../api/x402/tasks/9xQ…"}`, className: "text-muted" },
              { text: "# or run the scripted agent end to end:", className: "text-faint" },
              { text: "$ npm run agent -- --auto", className: "text-gold-2" },
            ]}
          />
        </Reveal>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <Kinetic as="h2" inView text="Tasks posted by *agents*" accent="italic text-gold-2" className="display text-[clamp(2.2rem,4vw,3.2rem)]" />
          <span className="font-mono text-[12px] text-muted">{agentTasks.length} so far</span>
        </div>
        {agentTasks.length === 0 ? (
          <Empty className="flex flex-col items-center gap-3">
            <PixelIcon name="robot" px={3} motion="bob" />
            None yet. Run <code className="font-mono text-gold-2">npm run agent</code> and watch one land here.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {agentTasks.map((t, i) => (
              <TaskCard key={t.pubkey} task={t} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The five steps on a rail, with a coin travelling along it and lighting each one up in turn. */
function Flow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1600);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <Reveal>
      <div className="card-gold relative overflow-hidden !rounded-[24px] p-6 sm:p-8">
        <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
        <Spotlight color="rgb(115 131 255 / 0.12)" />
        <div className="relative hidden h-px bg-fg/10 md:mx-[10%] md:mb-8 md:mt-2 md:block">
          <motion.div className="h-full bg-gradient-to-r from-red to-gold" animate={{ width: `${(active / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
          <motion.div
            className="absolute -top-[17px]"
            animate={{ left: `calc(${(active / (STEPS.length - 1)) * 100}% - 18px)` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <PixelIcon name="coin" px={1.4} motion="spin" speed={2} />
          </motion.div>
        </div>
        <div className="relative grid gap-3 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={cx(
                "rounded-2xl border p-4 text-left transition-all duration-500",
                active === i ? "border-gold/40 bg-gold/[0.05] md:-translate-y-1" : "border-line bg-fg/[0.015]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cx("font-display text-[20px] italic transition-colors", active === i ? "text-gold-2" : "text-faint")}>0{i + 1}</span>
                <PixelIcon name={s.icon} px={1.8} motion={active === i ? "bob" : "still"} speed={2} />
              </div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.body}</p>
            </button>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function Terminal({ title, lines, copyText }: { title: string; lines: { text: string; className?: string }[]; copyText: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-[20px] border border-line-2 bg-[#05060a] shadow-[0_40px_80px_-40px_rgb(0_0_0/1)]">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
        <span className="mono-label ml-3 !text-[10px] text-faint">{title}</span>
        <button
          className="ml-auto flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1 text-[12px] text-fg/80 transition-colors hover:bg-fg/[0.12]"
          onClick={() => {
            navigator.clipboard?.writeText(copyText);
            setCopied(true);
            toast.success("Copied to clipboard");
            track("agent_snippet_copied");
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span key={String(copied)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </motion.span>
          </AnimatePresence>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <TypeLines className="min-h-[230px] overflow-x-auto p-5 font-mono text-[12.5px] leading-7" lineClassName="whitespace-pre" speed={12} pause={250} lines={lines} />
    </div>
  );
}
