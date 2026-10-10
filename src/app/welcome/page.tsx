"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, LogIn, X } from "lucide-react";
import { useAccount, type Role } from "@/components/auth/Account";
import { useApp } from "@/components/Providers";
import { Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Container, Spinner, cx } from "@/components/ui";
import { safeNext } from "@/lib/client/nav";

const EASE = [0.16, 1, 0.3, 1] as const;
const SKILLS = ["Copywriting", "Translation", "Nepali", "Hindi", "TypeScript", "Python", "Data labeling", "Research", "Design", "Social media"];

export default function WelcomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}

function Welcome() {
  const account = useAccount();
  const { state } = useApp();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [emailOnWin, setEmailOnWin] = useState(true);
  const [check, setCheck] = useState<{ handle: string; available: boolean; reason: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const doneBtn = useRef<HTMLDivElement>(null);

  // Already set up: straight on to where they were going.
  useEffect(() => {
    if (account.me?.onboarded && step < 2) router.replace(safeNext(next));
  }, [account.me?.onboarded, step, next, router]);

  useEffect(() => {
    if (account.me?.email && !displayName) setDisplayName(account.me.email.split("@")[0].slice(0, 40));
  }, [account.me?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live handle check, debounced.
  const h = handle.trim().replace(/^@/, "").toLowerCase();
  useEffect(() => {
    if (!h) return setCheck(null);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handles/${encodeURIComponent(h)}`, { cache: "no-store" });
        const data = await res.json();
        setCheck({ handle: h, available: !!data.available, reason: data.reason ?? null });
      } catch {
        setCheck(null);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [h]);

  if (!account.enabled) {
    return (
      <Container>
        <div className="card mx-auto max-w-lg p-8 text-center text-muted">Accounts aren&apos;t switched on for this deployment.</div>
      </Container>
    );
  }
  if (!account.authenticated) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <PixelIcon name="monkey" px={4} motion="bob" />
        <h1 className="display text-5xl">Sign in to get started</h1>
        <button className="btn btn-red h-12 px-6" onClick={account.login}>
          <LogIn size={17} /> Sign in
        </button>
      </Container>
    );
  }

  const handleOk = check?.handle === h && check.available;
  const canSave = !!role && handleOk && displayName.trim().length > 0 && (role !== "company" || company.trim().length > 0);

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await account.tokens()) },
        body: JSON.stringify({
          handle: h,
          displayName: displayName.trim(),
          role,
          company: role === "company" ? company.trim() : undefined,
          city: city.trim() || undefined,
          skills,
          languages: [],
          emailOnWin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save your profile");
      setStep(2); // before refreshing, so the "already set up" redirect doesn't skip the last step
      await account.refresh();
      setTimeout(() => burst(doneBtn.current, { icons: ["coin", "monkey", "trophy"], count: 28 }), 300);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const addSkill = (s: string) => {
    const v = s.trim().slice(0, 30);
    if (v && !skills.includes(v) && skills.length < 12) setSkills([...skills, v]);
    setSkillDraft("");
  };
  const wallet = account.me?.wallet;

  return (
    <Container className="max-w-3xl">
      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 3`}>
        {["Role", "Profile", "Wallet"].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-full bg-paper-2">
              <motion.div className="h-full bg-red" animate={{ width: step >= i ? "100%" : "0%" }} transition={{ duration: 0.6, ease: EASE }} />
            </div>
            <span className={cx("mono-label !text-[10px]", step >= i ? "text-navy" : "text-faint")}>
              0{i + 1} {label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Step key="role">
            <Kinetic text={"How will you use\n*Wukong?*"} className="display text-[clamp(2.6rem,6vw,4.5rem)]" />
            <p className="mt-3 text-muted">This sets what your account can do. It can&apos;t be changed later, so pick the one that fits.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {(
                [
                  { id: "worker", icon: "monkey", title: "I want to work", body: "Find tasks, submit your best work, get paid in USDC when you win. Build a reputation you own." },
                  { id: "company", icon: "cash", title: "I want to hire", body: "Post tasks with a locked reward, see who entered, read the judge's reports and pay the best." },
                ] as const
              ).map((o) => (
                <motion.button
                  key={o.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRole(o.id)}
                  className={cx("relative rounded-[22px] border-2 bg-white p-6 text-left transition-colors", role === o.id ? "border-blue shadow-[0_0_0_4px_rgb(43_60_255/0.1)]" : "border-line hover:border-line-2")}
                  aria-pressed={role === o.id}
                >
                  <PixelIcon name={o.icon} px={2.6} motion={role === o.id ? "bob" : "hover"} className="-ml-2 -mt-2" />
                  <div className="mt-3 text-[20px] font-semibold">{o.title}</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{o.body}</p>
                  {role === o.id && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-blue text-white">
                      <Check size={15} strokeWidth={3} />
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button className="btn btn-red h-12 px-6" disabled={!role} onClick={() => setStep(1)}>
                Continue <ArrowRight size={17} />
              </button>
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step key="profile">
            <Kinetic text={role === "company" ? "Your *organisation*" : "Your public *profile*"} className="display text-[clamp(2.6rem,6vw,4.5rem)]" />
            <p className="mt-3 text-muted">Shown on your profile, the leaderboard and every task you {role === "company" ? "post" : "enter"}. Your email stays private.</p>
            <div className="card mt-8 flex flex-col gap-5 p-6 sm:p-8">
              <label className="flex flex-col gap-2">
                <span className="text-[14px] font-semibold">Handle</span>
                <span className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">@</span>
                  <input
                    className="input !pl-8 !pr-10"
                    value={handle}
                    maxLength={21}
                    onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                    placeholder="sita_k"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {h && check?.handle === h ? (
                      check.available ? <Check size={18} className="text-green" /> : <X size={18} className="text-red" />
                    ) : h ? (
                      <Spinner className="text-faint" />
                    ) : null}
                  </span>
                </span>
                <span className={cx("text-[12.5px]", check?.handle === h && !check.available ? "text-red" : "text-muted")}>
                  {check?.handle === h && check.reason ? check.reason : `wukonghq.xyz/@${h || "your_handle"}`}
                </span>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-[14px] font-semibold">{role === "company" ? "Your name" : "Display name"}</span>
                  <input className="input" value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} placeholder="Sita Karki" />
                </label>
                {role === "company" ? (
                  <label className="flex flex-col gap-2">
                    <span className="text-[14px] font-semibold">Organisation</span>
                    <input className="input" value={company} maxLength={60} onChange={(e) => setCompany(e.target.value)} placeholder="Himalayan Java" />
                  </label>
                ) : (
                  <label className="flex flex-col gap-2">
                    <span className="text-[14px] font-semibold">City</span>
                    <input className="input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="Pokhara" />
                  </label>
                )}
              </div>
              {role === "company" && (
                <label className="flex flex-col gap-2">
                  <span className="text-[14px] font-semibold">City</span>
                  <input className="input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="Kathmandu" />
                </label>
              )}
              {role === "worker" && (
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] font-semibold">Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                      <button key={s} className="chip !py-1.5 text-[13px] text-muted" onClick={() => addSkill(s)}>
                        + {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AnimatePresence>
                      {skills.map((s) => (
                        <motion.button
                          key={s}
                          layout
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                          className="chip !border-navy bg-navy !py-1.5 text-[13px] text-white"
                          onClick={() => setSkills(skills.filter((x) => x !== s))}
                        >
                          {s} <X size={12} />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                    <input
                      className="input !w-44 !py-1.5 text-[13px]"
                      value={skillDraft}
                      onChange={(e) => setSkillDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addSkill(skillDraft);
                        }
                      }}
                      placeholder="Add your own"
                    />
                  </div>
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-3 text-[14px]">
                <input type="checkbox" className="h-4 w-4 accent-red" checked={emailOnWin} onChange={(e) => setEmailOnWin(e.target.checked)} />
                Email me when {role === "company" ? "my tasks are judged and paid out" : "my entries are judged and paid"}
              </label>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red/10 p-3 text-[14px] text-red">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-8 flex justify-between">
              <button className="btn btn-line h-12 px-5" onClick={() => setStep(0)}>
                <ArrowLeft size={17} /> Back
              </button>
              <button className="btn btn-red h-12 px-6" disabled={!canSave || busy} onClick={save}>
                {busy ? <Spinner /> : null} Save and continue <ArrowRight size={17} />
              </button>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step key="wallet">
            <Kinetic text={"You're *in.*"} className="display text-[clamp(3rem,7vw,5.5rem)]" />
            <p className="mt-3 text-muted">Your Solana wallet is ready. Rewards and refunds land here.</p>
            <div className="card-navy relative mt-8 overflow-hidden p-6 sm:p-8">
              <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mono-label text-white/55">Your wallet address</div>
                  <div className="mt-2 break-all font-mono text-[14px]">{wallet ?? "Creating…"}</div>
                  {wallet && (
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white"
                      onClick={() => {
                        navigator.clipboard?.writeText(wallet);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy address"}
                    </button>
                  )}
                </div>
                <PixelIcon name="coin" px={3} motion="spin" />
              </div>
              {state.demoMode && (
                <p className="relative mt-5 rounded-xl bg-white/[0.07] p-3 text-[13px] text-white/70">
                  This is a demo deployment on {state.deployment?.cluster ?? "a test network"}: we&apos;ve sent your wallet test SOL for fees
                  {role === "company" ? " and test USDC for rewards" : " and a little test USDC for entry stakes"}.
                </p>
              )}
            </div>
            <div ref={doneBtn} className="mt-8 flex flex-wrap justify-end gap-3">
              <Link href="/wallet" className="btn btn-line h-12 px-5">
                Open wallet
              </Link>
              <Link href={role === "company" ? "/tasks/new" : "/tasks"} className="btn btn-red h-12 px-6">
                {role === "company" ? "Post your first task" : "Find your first task"} <ArrowRight size={17} />
              </Link>
            </div>
          </Step>
        )}
      </AnimatePresence>
    </Container>
  );
}

function Step({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="mt-12"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <Reveal y={0}>{children}</Reveal>
    </motion.div>
  );
}
