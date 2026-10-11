"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Building2, Check, LogIn, X } from "lucide-react";
import { HELP_EMAIL, useAccount, type MeProfile } from "@/components/auth/Account";
import { Kinetic, Reveal } from "@/components/fx/motion";
import { burst } from "@/components/fx/Overlay";
import { Container, Kicker, Skeleton, Spinner, cx } from "@/components/ui";
import { postJSON } from "@/lib/client/api";

const SKILLS = ["Copywriting", "Translation", "Nepali", "Hindi", "TypeScript", "Python", "Data labeling", "Research", "Design", "Social media"];

/** Edit your profile: everything on it except which side you're on. */
export default function SettingsPage() {
  const account = useAccount();
  const profile = account.me?.profile;
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
        <h1 className="display text-[clamp(2.6rem,6vw,4.2rem)]">
          Sign in to edit your <em className="text-gold-2">profile</em>
        </h1>
        <Link href="/signin?next=/settings" className="btn btn-red h-12 px-6">
          <LogIn size={17} /> Sign in
        </Link>
      </Container>
    );
  }
  if (!profile || !account.me?.onboarded) {
    return (
      <Container className="flex max-w-3xl flex-col gap-6">
        {account.error ? <p className="text-red-2">{account.error}</p> : <Skeleton className="h-20 w-2/3" />}
        <Skeleton className="h-96 !rounded-[18px]" />
      </Container>
    );
  }
  return <Editor profile={profile} />;
}

function Editor({ profile }: { profile: MeProfile }) {
  const account = useAccount();
  const org = profile.role === "company";
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [emailOnWin, setEmailOnWin] = useState(profile.emailOnWin);
  const [check, setCheck] = useState<{ handle: string; available: boolean; reason: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live handle check, debounced (your current handle is always fine).
  const h = handle.trim().replace(/^@/, "").toLowerCase();
  const unchanged = h === profile.handle;
  useEffect(() => {
    if (!h || unchanged) return setCheck(null);
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
  }, [h, unchanged]);

  const handleOk = unchanged || (check?.handle === h && check.available);
  const dirty =
    displayName !== profile.displayName ||
    !unchanged ||
    city !== (profile.city ?? "") ||
    bio !== (profile.bio ?? "") ||
    emailOnWin !== profile.emailOnWin ||
    skills.join("|") !== profile.skills.join("|");
  const canSave = dirty && handleOk && displayName.trim().length > 0 && !busy;

  async function save(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    setBusy(true);
    setError(null);
    try {
      await postJSON("/api/me", {
        handle: h,
        displayName: displayName.trim(),
        role: profile.role,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: org ? [] : skills,
        languages: profile.languages,
        emailOnWin,
      });
      await account.refresh();
      setSaved(true);
      burst(btn, { count: 10 });
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const addSkill = (s: string) => {
    const v = s.trim().slice(0, 30);
    if (v && !skills.includes(v) && skills.length < 12) setSkills([...skills, v]);
    setSkillDraft("");
  };

  return (
    <Container className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Reveal y={8}>
            <Kicker>{org ? "Organisation" : "Freelancer"} · settings</Kicker>
          </Reveal>
          <Kinetic text="Your *profile*" accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.4rem)]" />
        </div>
        {profile.handle && (
          <Link href={`/u/${profile.handle}`} className="btn btn-line h-10 px-4">
            View public profile <ArrowUpRight size={15} />
          </Link>
        )}
      </div>

      <div className="card flex flex-col gap-5 p-6 sm:p-8">
        {org && (
          <div className="well flex items-start gap-3 p-4">
            <Building2 size={18} className="mt-0.5 shrink-0 text-gold" />
            <div>
              <div className="text-[15px] font-semibold">{profile.company}</div>
              <div className="mt-0.5 text-[13px] leading-relaxed text-muted">Your organisation&apos;s name is set when it&apos;s approved. To change it, email {HELP_EMAIL}.</div>
            </div>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">{org ? "Your name" : "Display name"}</span>
            <input className="input" value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Handle</span>
            <span className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">@</span>
              <input
                className="input !pl-8 !pr-10"
                value={handle}
                maxLength={21}
                onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {unchanged ? null : check?.handle === h ? (
                  check.available ? <Check size={18} className="text-green" /> : <X size={18} className="text-red-2" />
                ) : h ? (
                  <Spinner className="text-faint" />
                ) : null}
              </span>
            </span>
            <span className={cx("text-[12.5px]", !unchanged && check?.handle === h && !check.available ? "text-red-2" : "text-muted")}>
              {!unchanged && check?.handle === h && check.reason ? check.reason : `wukonghq.xyz/@${h || "your_handle"}`}
            </span>
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">City</span>
          <input className="input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder={org ? "Kathmandu" : "Pokhara"} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-[14px] font-semibold">
            Bio <span className="font-mono text-[11px] font-normal text-faint">{bio.length}/280</span>
          </span>
          <textarea
            className="input min-h-24 leading-relaxed"
            value={bio}
            maxLength={280}
            onChange={(e) => setBio(e.target.value)}
            placeholder={org ? "What your organisation does, in a sentence or two." : "What you're good at, in a sentence or two."}
          />
        </label>
        {!org && (
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Skills</span>
            <div className="flex flex-wrap items-center gap-2">
              <AnimatePresence>
                {skills.map((s) => (
                  <motion.button
                    key={s}
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="chip chip-on !py-1.5 text-[13px]"
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
            <div className="flex flex-wrap gap-2">
              {SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                <button key={s} className="chip !py-1.5 text-[13px] text-muted" onClick={() => addSkill(s)}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
          <div>
            <div className="text-[14px] font-semibold">Result emails</div>
            <div className="mt-0.5 text-[13px] text-muted">
              {org ? "When your tasks are judged, shortlisted or paid out" : "When your entries are judged or paid"}, sent to {account.me?.email ?? "your email"}.
            </div>
          </div>
          <button
            role="switch"
            aria-checked={emailOnWin}
            aria-label="Result emails"
            onClick={() => setEmailOnWin((v) => !v)}
            className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", emailOnWin ? "bg-green/80" : "bg-fg/15")}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cx("absolute top-1 h-5 w-5 rounded-full bg-fg shadow", emailOnWin ? "right-1" : "left-1")}
            />
          </button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red/10 p-3 text-[14px] text-red-2" role="alert">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-end gap-3">
        <AnimatePresence>
          {saved && (
            <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[13.5px] text-green">
              <Check size={15} /> Saved
            </motion.span>
          )}
        </AnimatePresence>
        <button className="btn btn-red h-12 px-6" disabled={!canSave} onClick={save}>
          {busy && <Spinner />} Save changes
        </button>
      </div>
    </Container>
  );
}
