"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Spinner, Usdc, cx } from "@/components/ui";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { TEMPLATES } from "@/lib/demo";
import { postJSON, runAction } from "@/lib/client/api";

type Step = "idle" | "brief" | "sign" | "done";

export default function NewTaskPage() {
  const router = useRouter();
  const { signer, persona, personaName, state, refresh } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(0);
  const [brief, setBrief] = useState("");
  const [reward, setReward] = useState(50);
  const [hours, setHours] = useState(24);
  const [payoutMode, setPayoutMode] = useState<"winnerTakesAll" | "topThree">("topThree");
  const [judgeMode, setJudgeMode] = useState<"aiFinal" | "creatorPicks">("aiFinal");
  const [minRating, setMinRating] = useState(0);
  const [stake, setStake] = useState(0);
  const [template, setTemplate] = useState<string | undefined>();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const fee = state.config?.feeBps ?? 1000;
  const pool = reward * (1 - fee / 10000);
  const cat = categoryById(category);

  function applyTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setTemplate(t.id);
    setTitle(t.title);
    setCategory(t.category);
    setBrief(t.brief);
    setReward(t.rewardUsdc);
    setHours(t.hours);
    setPayoutMode(t.payoutMode);
    setJudgeMode(t.judgeMode);
    setMinRating(t.minRating);
    setStake(t.entryStakeUsdc);
  }

  async function submit() {
    if (!signer) return setError("Pick a persona or connect a wallet first.");
    setError(null);
    try {
      setStep("brief");
      const creatorName = persona === "company" ? "Himalayan Java" : persona === "wallet" ? undefined : personaName;
      const { hash } = await postJSON<{ hash: string }>("/api/briefs", { title, category, brief, creatorName, template });
      setStep("sign");
      const { task } = await runAction(signer, {
        kind: "create_task",
        title,
        category,
        briefHash: hash,
        rewardUsdc: reward,
        hours,
        payoutMode,
        judgeMode,
        minRating,
        maxSubmissions: 32,
        entryStakeUsdc: stake,
      });
      setStep("done");
      await refresh();
      router.push(`/tasks/${task}`);
    } catch (err) {
      setError((err as Error).message);
      setStep("idle");
    }
  }

  const busy = step !== "idle";
  const valid =
    title.trim().length > 0 && title.length <= 64 && brief.trim().length >= 10 && reward > 0 && stake >= 0 && stake <= reward;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-4xl font-bold">Post a task</h1>
          <p className="mt-1 text-muted">Lock the reward, describe the outcome, let the crowd compete.</p>
        </div>

        <div className="card p-4">
          <div className="label mb-2 flex items-center gap-1.5">
            <Sparkles size={13} /> Demo templates
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={cx(
                  "rounded-full border px-3 py-1 text-sm",
                  template === t.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted hover:text-text",
                )}
              >
                {categoryById(t.category).emoji} {t.title}
              </button>
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="label">Title ({title.length}/64, stored on-chain)</span>
            <input className="input" value={title} maxLength={64} onChange={(e) => setTitle(e.target.value)} placeholder="Launch tagline for our cold brew" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="label">Category (sets the judge's rubric)</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cx("rounded-xl border px-3 py-1.5 text-sm", category === c.id ? "border-gold bg-gold/10 text-gold" : "border-line-2 text-muted")}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {cat.criteria.map((c) => (
                <span key={c.key} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-muted">
                  {c.label} {Math.round(c.weight * 100)}%
                </span>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="label">Brief (hashed on-chain, judge verifies it)</span>
            <textarea className="input min-h-48 font-mono text-[13px] leading-relaxed" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What does great look like? Audience, tone, hard constraints…" />
          </label>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="label">Reward (USDC)</span>
              <input className="input" type="number" min={1} value={reward} onChange={(e) => setReward(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Open for (hours)</span>
              <input className="input" type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Min. reputation</span>
              <input className="input" type="number" min={0} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Entry stake (USDC)</span>
              <input className="input" type="number" min={0} step={0.5} value={stake} onChange={(e) => setStake(Number(e.target.value))} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="label">Payout</span>
              <Segmented
                value={payoutMode}
                onChange={setPayoutMode}
                options={[
                  { value: "topThree", label: "Top 3 · 50/30/20" },
                  { value: "winnerTakesAll", label: "Winner takes all" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="label">Final call</span>
              <Segmented
                value={judgeMode}
                onChange={setJudgeMode}
                options={[
                  { value: "aiFinal", label: "AI score is final" },
                  { value: "creatorPicks", label: "AI shortlists, I pick" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <div className="label">You lock now</div>
          <Usdc base={reward * 1_000_000} className="font-display text-4xl font-bold text-gold" />
          <div className="mt-4 space-y-1.5 text-sm">
            <Row k="Worker pool" v={<Usdc base={pool * 1_000_000} decimals={2} />} />
            <Row k={`Platform fee (${fee / 100}%)`} v={<Usdc base={(reward - pool) * 1_000_000} decimals={2} />} />
            {payoutMode === "topThree" && (
              <Row k="1st / 2nd / 3rd" v={`${(pool * 0.5).toFixed(2)} / ${(pool * 0.3).toFixed(2)} / ${(pool * 0.2).toFixed(2)}`} />
            )}
            <Row k="If nothing scores ≥ 25" v="full refund" />
            {stake > 0 && <Row k={`Entry stake ${stake} USDC`} v="slashed if spam" />}
          </div>
          <button className="btn btn-gold mt-5 w-full py-3 text-base" disabled={!valid || busy} onClick={submit}>
            {busy ? <Spinner /> : <Lock size={16} />} Lock {reward} USDC & post
          </button>
          <p className="mt-2 text-center text-xs text-faint">Signing as {personaName}</p>
          {error && <p className="mt-3 rounded-lg bg-crimson/10 p-2 text-sm text-crimson">{error}</p>}
        </div>
        {busy && (
          <div className="card animate-rise space-y-2 p-4 text-sm">
            <Progress active={step === "brief"} done={step !== "brief"} label="Brief stored, sha256 computed" />
            <Progress active={step === "sign"} done={step === "done"} label="create_task signed: USDC → escrow vault" />
            <Progress active={false} done={step === "done"} label="Task live in the arena" />
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-xl border border-line-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx("flex-1 rounded-lg px-2 py-1.5 text-sm", value === o.value ? "bg-gold/15 font-semibold text-gold" : "text-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Progress({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done ? <Check size={16} className="text-jade" /> : active ? <Spinner className="text-gold" /> : <span className="h-4 w-4 rounded-full border border-line-2" />}
      <span className={done ? "text-text" : "text-muted"}>{label}</span>
    </div>
  );
}
