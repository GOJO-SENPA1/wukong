"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, Lock } from "lucide-react";
import { useApp } from "@/components/Providers";
import { useAccount } from "@/components/auth/Account";
import { Counter, Kinetic, Magnetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Kicker, Skeleton, Spinner, cx } from "@/components/ui";
import { CATEGORIES, categoryById } from "@/lib/categories";
import { TEMPLATES } from "@/lib/demo";
import { postJSON, runAction } from "@/lib/client/api";
import { categoryIcon } from "@/lib/fx/sprites";

type Step = "idle" | "brief" | "sign" | "done";
const EASE = [0.16, 1, 0.3, 1] as const;
const HOURS = [
  { h: 1, label: "1 hour" },
  { h: 6, label: "6 hours" },
  { h: 24, label: "24 hours" },
  { h: 72, label: "3 days" },
  { h: 168, label: "7 days" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const { signer, persona, personaName, state, refresh, role, personasOn, setPersona, identityReady } = useApp();
  const account = useAccount();
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
  const cta = useRef<HTMLButtonElement>(null);

  const fee = state.config?.feeBps ?? 1000;
  const safeReward = Number.isFinite(reward) && reward > 0 ? reward : 0;
  const pool = safeReward * (1 - fee / 10000);
  const splits = payoutMode === "topThree" ? [0.5, 0.3, 0.2] : [1];

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
    if (!signer) return setError("Your wallet is still loading. Try again in a moment.");
    setError(null);
    try {
      setStep("brief");
      const creatorName = persona === "company" ? "Himalayan Java" : persona === "wallet" ? undefined : personaName.split(" · ")[0];
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
        maxSubmissions: 256,
        entryStakeUsdc: stake,
      });
      setStep("done");
      burst(cta.current, { icons: ["coin", "coin", "lock", "monkey"], count: 30 });
      await refresh();
      setTimeout(() => router.push(`/tasks/${task}`), 900);
    } catch (err) {
      setError((err as Error).message);
      setStep("idle");
    }
  }

  if (!identityReady)
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 !rounded-[18px]" />
          <Skeleton className="h-96 !rounded-[20px]" />
        </div>
      </div>
    );
  if (role !== "company") return <PostGate signedIn={role !== null} personasOn={personasOn} onDemo={() => setPersona("company")} onSignIn={account.enabled && !account.authenticated ? account.login : undefined} />;

  const busy = step !== "idle";
  const valid =
    title.trim().length > 0 && new TextEncoder().encode(title).length <= 64 && brief.trim().length >= 10 && reward >= 1 && stake >= 0 && stake <= reward;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Reveal y={8}>
          <Kicker>New task · {personaName.split(" · ")[0]}</Kicker>
        </Reveal>
        <Kinetic text={"Post a task. *Pay* *the* *best.*"} accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]" />
        <Reveal delay={0.2} className="mt-4 text-[15px] text-muted">
          Describe the work, lock the reward, and the crowd gets to it. Five short steps.
        </Reveal>
      </div>

      <Reveal delay={0.25}>
        <div className="label mb-3">Start from a template</div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 sm:[mask-image:linear-gradient(to_right,black_88%,transparent)]">
          {TEMPLATES.map((t, i) => (
            <motion.button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05, ease: EASE, duration: 0.6 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={cx(
                "group flex w-60 shrink-0 items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-colors",
                template === t.id ? "border-gold/60 bg-gold/[0.04]" : "border-line hover:border-line-2",
              )}
            >
              <PixelIcon name={categoryIcon(t.category)} px={1.6} motion="hover" className="-ml-1 -mt-1 shrink-0" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-[14px] font-semibold leading-snug">{t.title}</span>
                <span className="mt-1 block font-mono text-[11px] text-muted">{t.rewardUsdc} USDC · {categoryById(t.category).label}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <Section n="01" title="What kind of work?">
            <LayoutGroup id="category">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <Option key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} group="category">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{c.label}</div>
                        <div className="mt-1 text-[13px] leading-snug text-muted">{c.blurb}</div>
                      </div>
                      <PixelIcon name={categoryIcon(c.id)} px={1.5} motion={category === c.id ? "bob" : "still"} className="-mr-2 -mt-2 shrink-0" />
                    </div>
                  </Option>
                ))}
              </div>
            </LayoutGroup>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <AnimatePresence mode="popLayout">
                {categoryById(category).criteria.map((c, i) => (
                  <motion.span
                    key={`${category}-${c.key}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-full bg-fg/[0.04] px-3 py-1 font-mono text-[11px] text-muted shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
                  >
                    {c.label} <span className="text-gold-2">{Math.round(c.weight * 100)}%</span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </Section>

          <Section n="02" title="The brief">
            <label className="flex flex-col gap-2">
              <span className="flex justify-between text-[14px] font-semibold">
                Title <span className={cx("font-mono text-[11px] font-normal", title.length > 56 ? "text-red-2" : "text-faint")}>{title.length}/64 · stored on-chain</span>
              </span>
              <input className="input" value={title} maxLength={64} onChange={(e) => setTitle(e.target.value)} placeholder="Launch tagline: Himalayan cold brew" />
            </label>
            <label className="mt-5 flex flex-col gap-2">
              <span className="text-[14px] font-semibold">Brief</span>
              <textarea
                className="input min-h-52 text-[15px] leading-relaxed"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What does great look like? Audience, tone, length and hard constraints."
              />
            </label>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Spell out the audience, tone, length and must-haves: the judge scores against exactly this. Once published, the brief is fingerprinted on-chain and
              can&apos;t be edited.
            </p>
          </Section>

          <Section n="03" title="Reward and payout">
            <label className="flex max-w-xs flex-col gap-2">
              <span className="text-[14px] font-semibold">Reward</span>
              <span className="relative">
                <input
                  className="input num !py-3 !pr-16 !text-[2rem]"
                  type="number"
                  min={1}
                  value={Number.isFinite(reward) ? reward : ""}
                  onChange={(e) => setReward(Number(e.target.value))}
                />
                <span className="mono-label absolute right-4 top-1/2 -translate-y-1/2 text-faint">USDC</span>
              </span>
            </label>
            <LayoutGroup id="payout">
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Option active={payoutMode === "topThree"} onClick={() => judgeMode === "aiFinal" && setPayoutMode("topThree")} group="payout" disabled={judgeMode === "creatorPicks"}>
                  <div className="font-semibold">Top 3 paid</div>
                  <div className="mt-1 text-[13px] text-muted">
                    {judgeMode === "creatorPicks" ? "Not with “AI shortlists, I pick”: you choose one winner." : "Split 50 / 30 / 20 between the three best entries."}
                  </div>
                </Option>
                <Option active={payoutMode === "winnerTakesAll"} onClick={() => setPayoutMode("winnerTakesAll")} group="payout">
                  <div className="font-semibold">Winner takes all</div>
                  <div className="mt-1 text-[13px] text-muted">The single best entry gets the whole pool.</div>
                </Option>
              </div>
            </LayoutGroup>
          </Section>

          <Section n="04" title="Who picks the winners?">
            <LayoutGroup id="judge">
              <div className="grid gap-3 sm:grid-cols-2">
                <Option active={judgeMode === "aiFinal"} onClick={() => setJudgeMode("aiFinal")} group="judge">
                  <div className="font-semibold">The AI decides</div>
                  <div className="mt-1 text-[13px] text-muted">Scores are final and winners are paid the moment judging ends.</div>
                </Option>
                <Option
                  active={judgeMode === "creatorPicks"}
                  onClick={() => {
                    setJudgeMode("creatorPicks");
                    setPayoutMode("winnerTakesAll");
                  }}
                  group="judge"
                >
                  <div className="font-semibold">AI shortlists, I pick</div>
                  <div className="mt-1 text-[13px] text-muted">You choose one winner from the top three after the deadline. Payment waits for your pick.</div>
                </Option>
              </div>
            </LayoutGroup>
          </Section>

          <Section n="05" title="Deadline and who can enter">
            <div className="text-[14px] font-semibold">Open for</div>
            <LayoutGroup id="hours">
              <div className="mt-2 flex flex-wrap gap-2">
                {HOURS.map((o) => (
                  <button key={o.h} onClick={() => setHours(o.h)} className={cx("chip relative", hours === o.h && "!text-bg !shadow-none")} aria-pressed={hours === o.h}>
                    {hours === o.h && (
                      <motion.span layoutId="hours-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 480, damping: 38 }} />
                    )}
                    <span className="relative">{o.label}</span>
                  </button>
                ))}
                {!HOURS.some((o) => o.h === hours) && <span className="chip chip-on">{hours} hours</span>}
              </div>
            </LayoutGroup>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-[14px] font-semibold">Minimum rating</span>
                <select className="input" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                  {withValue([0, 50, 100, 150, 400], minRating).map((r) => (
                    <option key={r} value={r}>
                      {r === 0 ? "Anyone" : `${r}+`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[14px] font-semibold">Entry stake</span>
                <select className="input" value={stake} onChange={(e) => setStake(Number(e.target.value))}>
                  {withValue([0, 0.5, 1, 2, 5], stake).map((v) => (
                    <option key={v} value={v}>
                      {v === 0 ? "None" : `${v} USDC`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-3 text-[13px] text-muted">A small refundable stake filters out spam. Honest entrants get it back; entries scoring under 20 lose it.</p>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Reveal delay={0.3} x={20} y={0}>
            <div className="card-gold relative overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold/15 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="label">Summary</div>
                <div className="mt-4 text-[13.5px] text-muted">Locked in escrow when you publish</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="num text-foil text-[64px]">
                    <Counter value={safeReward} decimals={2} duration={0.6} />
                  </span>
                  <span className="pb-1.5 text-sm text-muted">USDC</span>
                </div>
                <div className="mt-3 text-[13.5px] text-muted">{payoutMode === "topThree" ? "Top 3 paid" : "Winner takes all"}, after the fee</div>
                <motion.div layout className={cx("mt-4 grid gap-2", splits.length === 3 ? "grid-cols-3" : "grid-cols-1")}>
                  <AnimatePresence mode="popLayout">
                    {splits.map((s, i) => (
                      <motion.div
                        key={`${payoutMode}-${i}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: i * 0.05 }}
                        className="well px-3 py-2.5"
                      >
                        <div className={cx("mono-label !text-[9.5px]", i === 0 ? "text-gold-2" : "text-muted")}>{["1st", "2nd", "3rd"][i]}</div>
                        <div className="mt-0.5 text-[17px] font-semibold tabular-nums">
                          <Counter value={pool * s} decimals={2} duration={0.5} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
                <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4 text-[13.5px]">
                  <Row k="Platform fee" v={`${(safeReward - pool).toFixed(2)} USDC, from payouts`} />
                  <Row k="Judging" v={judgeMode === "aiFinal" ? "AI, final" : "AI shortlist, you pick"} />
                  <Row k="Open for" v={HOURS.find((o) => o.h === hours)?.label ?? `${hours} hours`} />
                  <Row k="Entry stake" v={stake ? `${stake} USDC` : "None"} />
                </dl>
                <Magnetic className="mt-5 block w-full" strength={0.15}>
                  <button ref={cta} className="btn btn-red h-12 w-full text-[15px]" disabled={!valid || busy} onClick={submit}>
                    {busy && step !== "done" ? <Spinner /> : step === "done" ? <Check size={17} /> : <Lock size={16} />}
                    {step === "done" ? "Published" : `Lock ${safeReward.toFixed(2)} USDC and publish`}
                  </button>
                </Magnetic>
                <p className="mt-3 text-[12px] leading-relaxed text-faint">
                  Refunded in full if no entry scores 25 or more. You can cancel and get it back until the first entry arrives. Signing as {personaName}.
                </p>
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl bg-red/10 p-3 text-[13px] text-red-2">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {busy && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4 text-[13px]">
                        <Progress active={step === "brief"} done={step !== "brief"} label="Brief stored, sha256 computed" />
                        <Progress active={step === "sign"} done={step === "done"} label="Signed: USDC moves into the escrow vault" />
                        <Progress active={false} done={step === "done"} label="Task live in the arena" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="label mb-2 px-1">How freelancers will see it</div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="label">{categoryById(category).label}</span>
                <span className="mono-label !text-[10px] text-red-2">{HOURS.find((o) => o.h === hours)?.label ?? `${hours}h`} left</span>
              </div>
              <div className="mt-2.5 min-h-[1.5em] text-[17px] font-semibold leading-snug">{title || <span className="text-faint">Your title</span>}</div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="num text-[2.5rem]">
                  <Counter value={safeReward} duration={0.5} />
                </span>
                <span className="text-[12px] font-semibold text-muted">USDC · {payoutMode === "topThree" ? "top 3 paid" : "winner takes all"}</span>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

/** The preset options plus the current value, so a template's value always shows. */
const withValue = (opts: number[], v: number) => (opts.includes(v) || !Number.isFinite(v) ? opts : [...opts, v].sort((a, b) => a - b));

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="card p-6 sm:p-7">
        <h2 className="mb-5 flex items-baseline gap-3 text-[19px] font-semibold tracking-tight">
          <span className="font-display text-[22px] italic text-gold">{n}</span>
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

function Option({ active, onClick, children, group, disabled }: { active: boolean; onClick: () => void; children: ReactNode; group: string; disabled?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      className={cx("relative rounded-2xl border border-line-2 bg-fg/[0.02] p-4 text-left transition-colors", disabled ? "cursor-not-allowed opacity-40" : "hover:border-fg/25")}
      aria-pressed={active}
    >
      {active && (
        <motion.span
          layoutId={`opt-${group}`}
          className="pointer-events-none absolute -inset-px rounded-2xl border border-gold/70 bg-gold/[0.05] shadow-[0_0_0_4px_rgb(216_179_108/0.08)]"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative block">{children}</span>
    </motion.button>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right text-fg/90">{v}</dd>
    </div>
  );
}

function Progress({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 items-center justify-center">
        {done ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="flex h-5 w-5 items-center justify-center rounded-full bg-green text-bg">
            <Check size={12} strokeWidth={3} />
          </motion.span>
        ) : active ? (
          <Spinner className="text-fg" />
        ) : (
          <span className="h-4 w-4 rounded-full border border-fg/25" />
        )}
      </span>
      <span className={done ? "text-fg" : "text-muted"}>{label}</span>
    </div>
  );
}

/** Freelancer accounts can't post tasks; say so, and offer the way in. */
function PostGate({ signedIn, personasOn, onDemo, onSignIn }: { signedIn: boolean; personasOn: boolean; onDemo: () => void; onSignIn?: () => void }) {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="aura left-[calc(50%-9rem)] top-1/4 h-72 w-72 bg-gold/15" aria-hidden />
      <PixelIcon name="lock" px={3.6} motion="bob" />
      <h1 className="display text-[clamp(2.6rem,6vw,4.5rem)]">
        {signedIn ? (
          <>
            Organisations <em className="text-gold-2">post tasks</em>
          </>
        ) : (
          <>
            Sign in to <em className="text-gold-2">post a task</em>
          </>
        )}
      </h1>
      <p className="max-w-md leading-relaxed text-muted">
        {signedIn
          ? "Your account is a freelancer account: you find tasks, enter them and get paid. Posting tasks is for organisation accounts."
          : "Posting a task needs an organisation account: you lock the reward, the crowd competes, the best work gets paid."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {onSignIn && (
          <button className="btn btn-red h-12 px-6" onClick={onSignIn}>
            Sign in
          </button>
        )}
        {personasOn && (
          <button className="btn btn-line h-12 px-6" onClick={onDemo}>
            Use the demo organisation
          </button>
        )}
        {signedIn && (
          <Link href="/tasks" className="btn btn-red h-12 px-6">
            Find work instead
          </Link>
        )}
      </div>
    </div>
  );
}
