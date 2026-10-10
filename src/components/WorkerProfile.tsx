"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Link2 } from "lucide-react";
import { Counter, Kinetic, Reveal, Scramble, Spotlight } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Avatar, Container, Empty, ExplorerLink, ScoreBar, Skeleton, TierBadge, cx } from "@/components/ui";
import { getJSON } from "@/lib/client/api";
import { useApp } from "@/components/Providers";
import { TaskCard } from "@/components/TaskCard";
import { TIERS, fmtUsdc, shortAddr, tierFor, toUsdc } from "@/lib/format";
import type { ReputationView, SubmissionView, TaskStatus } from "@/lib/wukong";

interface PublicProfile {
  handle: string | null;
  displayName: string;
  role: "worker" | "company";
  company: string | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
  wallet: string;
  joined: string;
}

interface WorkerPayload {
  worker: string;
  name?: string;
  profile?: PublicProfile | null;
  usdc: number;
  reputation: ReputationView | null;
  reputationAccount: string;
  history: (SubmissionView & { taskTitle: string; taskStatus?: TaskStatus; category: string; summary?: string })[];
}

const EASE = [0.16, 1, 0.3, 1] as const;
const PLACE = ["", "1st", "2nd", "3rd"];

/** A public profile: a freelancer's record, or an organisation's tasks. Keyed by wallet. */
export function WorkerProfile({ worker }: { worker: string }) {
  const [data, setData] = useState<WorkerPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    const load = () =>
      getJSON<WorkerPayload>(`/api/workers/${worker}`)
        .then(setData)
        .catch((e) => setErr(e.message));
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [worker]);

  const copy = (what: "link" | "code", text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1400);
  };

  if (err && !data)
    return (
      <Container>
        <Empty>{err}</Empty>
      </Container>
    );
  if (!data) {
    return (
      <>
        <div className="h-64 bg-navy" />
        <Container className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </Container>
      </>
    );
  }

  const rep = data.reputation;
  const rating = rep?.rating ?? 0;
  const tier = tierFor(rating);
  const next = TIERS.find((t) => t.min > rating);
  const prof = data.profile;
  const [nameWho, nameCity] = (data.name ?? "").split(" · ");
  const who = prof ? (prof.role === "company" ? prof.company || prof.displayName : prof.displayName) : nameWho;
  const city = prof?.city ?? nameCity;
  const display = who || shortAddr(data.worker, 6);
  if (prof?.role === "company") return <OrgProfile profile={prof} wallet={data.worker} display={display} />;
  const scored = data.history.filter((h) => h.scored);
  const byCat = Object.entries(
    scored.reduce<Record<string, number[]>>((acc, h) => {
      (acc[h.category || "Other"] ??= []).push(h.score);
      return acc;
    }, {}),
  )
    .map(([cat, s]) => ({ cat, avg: s.reduce((a, b) => a + b, 0) / s.length }))
    .sort((a, b) => b.avg - a.avg);
  const snippet = `// Read this worker's reputation from any app, no Wukong API needed
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("reputation"), new PublicKey("${data.worker}").toBuffer()],
  WUKONG_PROGRAM_ID,
);
const rep = await program.account.reputation.fetch(pda);`;

  const stats = [
    { label: "Rating", value: rating, cls: "text-red" },
    { label: "Wins", value: rep?.wins ?? 0 },
    { label: "Top-3 finishes", value: rep?.podiums ?? 0 },
    { label: "Entries", value: rep?.submissions ?? 0 },
    { label: "Average score", value: rep?.scored ? Math.round(rep.avgScore / 100) : 0 },
    { label: "Earned", value: toUsdc(rep?.totalEarned ?? 0), decimals: 2 },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_20%_50%,black,transparent_75%)]" aria-hidden />
        <Spotlight color="rgb(228 38 28 / 0.16)" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
          <motion.div initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="relative w-fit">
            <Avatar id={data.worker} name={data.name} size={112} />
            <span className="absolute -bottom-2 -right-3">
              <PixelIcon name={rep?.wins ? "trophy" : "monkey"} px={2} motion="bob" />
            </span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <Kinetic text={display} className="display text-[clamp(2.8rem,6vw,4.8rem)]" />
            <Reveal delay={0.2} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-white/70">
              {prof?.handle && <span className="font-semibold text-white">@{prof.handle}</span>}
              {city && <span>{city}</span>}
              <span className="font-mono text-[13px]">
                <Scramble text={shortAddr(data.worker, 6)} trigger="mount" />
              </span>
              <TierBadge rating={rating} />
            </Reveal>
            {(prof?.bio || (prof?.skills.length ?? 0) > 0) && (
              <Reveal delay={0.25} className="mt-4 max-w-xl">
                {prof?.bio && <p className="text-[15px] leading-relaxed text-white/70">{prof.bio}</p>}
                {prof && prof.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {prof.skills.map((s) => (
                      <span key={s} className="mono-label rounded-md bg-white/10 px-2 py-1 !text-[10px] text-white/80">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </Reveal>
            )}
            {next && (
              <Reveal delay={0.3} className="mt-4 max-w-md">
                <div className="flex justify-between text-[12.5px] text-white/55">
                  <span>{tier.name}</span>
                  <span>
                    {next.min - rating} to {next.name}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: tier.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((rating - tier.min) / (next.min - tier.min)) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1.2, ease: EASE }}
                  />
                </div>
              </Reveal>
            )}
          </div>
          <Reveal delay={0.3} className="flex flex-col items-start gap-3 md:items-end">
            <button className="btn btn-ghost-light h-11" onClick={() => copy("link", window.location.href)}>
              <AnimatePresence mode="wait">
                <motion.span key={copied === "link" ? "ok" : "link"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  {copied === "link" ? <Check size={16} /> : <Link2 size={16} />}
                </motion.span>
              </AnimatePresence>
              {copied === "link" ? "Copied" : "Copy profile link"}
            </button>
            <span className="text-[13px] text-white/50">
              Wallet balance <b className="font-mono text-white">{fmtUsdc(data.usdc, { decimals: 2 })} USDC</b>
            </span>
          </Reveal>
        </div>
      </section>

      <Container className="flex flex-col gap-6 !pt-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="card lift p-5">
                <div className="label">{s.label}</div>
                <div className={cx("display mt-2 text-[44px] leading-none", s.cls)}>
                  <Counter value={s.value} decimals={s.decimals ?? 0} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <Reveal>
            <div className="card p-6 sm:p-7">
              <h2 className="text-[19px] font-semibold tracking-tight">Results</h2>
              {data.history.length === 0 ? (
                <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center text-muted">
                  <PixelIcon name="monkey" px={3} motion="bob" />
                  No entries yet.
                </div>
              ) : (
                <div className="mt-4 flex flex-col">
                  {data.history.map((h, i) => (
                    <motion.div
                      key={h.pubkey}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.6, ease: EASE }}
                    >
                      <Link href={`/tasks/${h.task}`} className="group grid grid-cols-[72px_1fr_auto] gap-4 border-t border-line py-5 transition-colors hover:bg-paper/60 sm:px-2">
                        <span className={cx("display text-[46px] leading-[0.9]", h.scored ? "text-navy" : "text-faint")}>{h.scored ? Math.round(h.score / 100) : "–"}</span>
                        <div className="min-w-0">
                          <div className="font-semibold leading-snug transition-colors group-hover:text-red">{h.taskTitle}</div>
                          <div className="mt-0.5 text-[13px] text-muted">
                            {h.category}
                            {h.taskStatus === "open" ? " · sealed, awaiting close" : h.taskStatus === "judging" ? " · being judged" : ""}
                          </div>
                          {h.summary && <p className="serif-quote mt-2 text-[17px] leading-snug text-navy/80">“{h.summary}”</p>}
                        </div>
                        <div className="text-right">
                          {h.rank > 0 && <div className="mono-label !text-[10px] text-red">{PLACE[h.rank]}</div>}
                          <div className="mt-0.5 font-semibold tabular-nums">{h.payout > 0 ? `+${fmtUsdc(h.payout, { decimals: 2 })}` : "—"}</div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            {byCat.length > 0 && (
              <Reveal delay={0.1}>
                <div className="card p-6">
                  <div className="text-[16px] font-semibold">Strongest in</div>
                  <div className="mt-4 flex flex-col gap-4">
                    {byCat.map((c, i) => (
                      <div key={c.cat}>
                        <div className="flex justify-between text-[14px]">
                          <span>{c.cat}</span>
                          <span className="font-semibold">avg {Math.round(c.avg / 100)}</span>
                        </div>
                        <ScoreBar score={c.avg} tone="navy" className="mt-2" delay={i * 0.1} />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
            <Reveal delay={0.2}>
              <div className="relative overflow-hidden rounded-[18px] bg-blue p-6 text-white">
                <Spotlight color="rgb(255 255 255 / 0.15)" size={300} />
                <div className="mono-label relative text-white/70">On-chain reputation</div>
                <p className="relative mt-3 text-[15px] leading-relaxed">
                  Every score and payout above is recorded on Solana in an account {display} owns. If Wukong disappears tomorrow, it survives. Any app can read it.
                </p>
                <div className="relative mt-4 flex items-center justify-between gap-3 font-mono text-[12px] text-white/80">
                  <span>Reputation account</span>
                  <ExplorerLink kind="address" id={data.reputationAccount} className="!text-white" />
                </div>
                <div className="relative mt-4">
                  <pre className="overflow-x-auto rounded-xl bg-navy/60 p-3.5 font-mono text-[10.5px] leading-relaxed text-white/75">{snippet}</pre>
                  <button
                    className="absolute right-2 top-2 rounded-lg bg-white/10 p-1.5 text-white/80 transition-colors hover:bg-white/20"
                    onClick={() => copy("code", snippet)}
                    aria-label="Copy snippet"
                  >
                    {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.3} className="px-1 text-[12.5px] leading-relaxed text-muted">
              Rating = quality above 50, plus podium bonuses (100 / 50 / 25). Spam costs 10. Best score {rep?.bestScore ? (rep.bestScore / 100).toFixed(1) : "–"}.
            </Reveal>
          </aside>
        </div>
      </Container>
    </>
  );
}

/** An organisation's public page: who they are and the tasks they've posted. */
function OrgProfile({ profile, wallet, display }: { profile: PublicProfile; wallet: string; display: string }) {
  const { state } = useApp();
  const tasks = (state.tasks ?? []).filter((t) => t.creator === wallet).sort((a, b) => b.createdAt - a.createdAt);
  const live = tasks.filter((t) => t.status === "open" || t.status === "judging");
  const stats = [
    { label: "Tasks posted", value: tasks.length },
    { label: "Live now", value: live.length },
    { label: "USDC paid to workers", value: toUsdc(tasks.reduce((a, t) => a + t.paidOut, 0)), decimals: 2 },
    { label: "Entries received", value: tasks.reduce((a, t) => a + t.submissionCount, 0) },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_20%_50%,black,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
          <Avatar id={wallet} name={display} size={112} />
          <div className="min-w-0 flex-1">
            <div className="mono-label text-white/55">Organisation</div>
            <Kinetic text={display} className="display mt-2 text-[clamp(2.8rem,6vw,4.8rem)]" />
            <Reveal delay={0.2} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-white/70">
              {profile.handle && <span className="font-semibold text-white">@{profile.handle}</span>}
              {profile.city && <span>{profile.city}</span>}
              <span>Joined {new Date(profile.joined).toLocaleDateString([], { month: "long", year: "numeric" })}</span>
            </Reveal>
            {profile.bio && <Reveal delay={0.25} className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">{profile.bio}</Reveal>}
          </div>
        </div>
      </section>
      <Container className="flex flex-col gap-6 !pt-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="card lift p-5">
                <div className="label">{s.label}</div>
                <div className="display mt-2 text-[44px] leading-none">
                  <Counter value={s.value} decimals={s.decimals ?? 0} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-[19px] font-semibold tracking-tight">Tasks</div>
          {tasks.length === 0 ? <Empty>No tasks posted yet.</Empty> : tasks.map((t, i) => <TaskCard key={t.pubkey} task={t} index={i} />)}
        </div>
      </Container>
    </>
  );
}
