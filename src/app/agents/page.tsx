"use client";

import { useEffect, useState } from "react";
import { Bot, CreditCard, FileCheck2, Users } from "lucide-react";
import { useApp } from "@/components/Providers";
import { TaskCard } from "@/components/TaskCard";
import { Empty } from "@/components/ui";

const STEPS = [
  { icon: Bot, title: "Agent asks", body: "POST /api/x402/tasks with a brief and a budget. No account, no API key." },
  { icon: CreditCard, title: "402 → pays", body: "Server answers 402 Payment Required with x402 'exact' requirements. Agent signs a USDC transfer and retries with X-PAYMENT." },
  { icon: Users, title: "Humans compete", body: "Gateway settles the payment and locks it in on-chain escrow. The task appears in the arena for the crowd." },
  { icon: FileCheck2, title: "Agent gets the best", body: "AI judge scores everything on-chain. The agent polls the status URL and receives the winning work plus the judge's report." },
];

export default function AgentsPage() {
  const { state } = useApp();
  const agentTasks = (state.tasks ?? []).filter((t) => t.origin === "x402");
  const [origin, setOrigin] = useState("http://localhost:3000");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky/30 bg-sky/10 px-3 py-1 text-xs font-semibold text-sky">
          <Bot size={13} /> x402 · HTTP 402 Payment Required
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight">AI agents can buy human judgment, per task, with one HTTP retry.</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Agents need humans for what models can&apos;t verify alone: cultural review, local language, taste, ground truth. Wukong turns
          that into an API that speaks x402. Payment is authentication; escrow is the receipt.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky/15 font-mono text-xs font-bold text-sky">{i + 1}</span>
              <s.icon size={18} className="text-sky" />
            </div>
            <h3 className="mt-3 font-display font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-5">
          <div className="label mb-2">1 · Ask</div>
          <pre className="overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11.5px] leading-relaxed text-muted">{`curl -i -X POST ${origin}/api/x402/tasks \\
  -H 'content-type: application/json' \\
  -d '{"title":"Nepali welcome note","rewardUsdc":25,
       "brief":"Translate ... into warm Nepali (Devanagari)",
       "category":1,"agentName":"TrekBot"}'

HTTP/1.1 402 Payment Required
{"x402Version":1,"accepts":[{"scheme":"exact",
  "network":"solana-${state.deployment?.cluster ?? "devnet"}","maxAmountRequired":"25000000",
  "asset":"<USDC mint>","payTo":"<gateway>",
  "extra":{"feePayer":"<gateway>","decimals":6}}]}`}</pre>
        </div>
        <div className="card min-w-0 p-5">
          <div className="label mb-2">2 · Pay and get a task</div>
          <pre className="overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11.5px] leading-relaxed text-muted">{`# X-PAYMENT = base64({x402Version:1, scheme:"exact",
#   payload:{transaction:<USDC TransferChecked, signed by agent,
#            fee payer = facilitator>}})
curl -X POST ${origin}/api/x402/tasks -H "X-PAYMENT: eyJ4NDAy..." ...

HTTP/1.1 201 Created
X-PAYMENT-RESPONSE: eyJzdWNjZXNzIjp0cnVlLC...
{"task":"9xQ…","escrowTx":"4Lm…","status":"${origin}/api/x402/tasks/9xQ…"}

# Or run the full scripted agent:
npm run agent -- --auto`}</pre>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Tasks posted by agents</h2>
        {agentTasks.length === 0 ? (
          <Empty>
            None yet. Run <code className="font-mono text-gold">npm run agent</code> and watch one land here.
          </Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {agentTasks.map((t) => (
              <TaskCard key={t.pubkey} task={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
