"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Check, Copy, LogOut, Mail } from "lucide-react";
import { HELP_EMAIL, useAccount } from "@/components/auth/Account";
import { SignInPanel } from "@/components/auth/SignInPanel";
import { Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Kicker, Spinner } from "@/components/ui";
import { orgRegistrationMailto } from "@/lib/contact";
import { safeNext } from "@/lib/client/nav";

const STEPS = [
  { title: "Email us", body: `Send your organisation's name, website and the email you'll sign in with to ${HELP_EMAIL}.` },
  { title: "We approve it", body: "We check every organisation by hand, usually within one working day, and reply when you're in." },
  { title: "Sign in and post", body: "Sign in here with that email (or its Google account), lock a reward and post your first task." },
];

/**
 * Organisations sign in here. They can't sign themselves up: an organisation
 * account exists once we've approved it (a CompanyInvite row for its email).
 */
export default function BusinessPage() {
  return (
    <Suspense>
      <Business />
    </Suspense>
  );
}

function Business() {
  const account = useAccount();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const me = account.me;
  const isOrg = !!me?.onboarded && me.profile?.role === "company";
  const invited = !!me && !me.onboarded && !!me.invite;
  useEffect(() => {
    if (isOrg) router.replace(next);
    else if (invited) router.replace(`/welcome?next=${encodeURIComponent(next)}`);
  }, [isOrg, invited, next, router]);

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div className="aura left-[-8%] top-[-10%] h-[560px] w-[560px] bg-red/20" aria-hidden />
      <div className="aura right-[-6%] top-[20%] h-[460px] w-[460px] bg-gold/15 [animation-delay:-6s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid min-h-[80vh] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div>
          <Reveal y={8}>
            <Kicker>For organisations</Kicker>
          </Reveal>
          <Kinetic text={"Hire the crowd.\n*Pay* *the* *best.*"} accent="italic text-foil" className="display mt-6 text-[clamp(2.8rem,6.4vw,5.6rem)]" />
          <Reveal delay={0.3} className="mt-7 max-w-md text-[16.5px] leading-relaxed text-muted">
            Post a brief, lock the reward in escrow and get many finished takes back, judged in public. Organisation accounts are by
            invitation, so every task on Wukong comes from a real, verified organisation.
          </Reveal>
          <ol className="mt-10 flex max-w-lg flex-col gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={0.4 + i * 0.08} className="flex gap-4">
                <span className="display w-8 shrink-0 text-[1.9rem] italic leading-none text-gold">0{i + 1}</span>
                <span>
                  <span className="block text-[15px] font-semibold">{s.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-muted">{s.body}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal delay={0.2} y={24}>
          <div className="card-gold relative !rounded-[26px] p-8 sm:p-10">
            <div className="absolute -right-3 -top-9">
              <PixelIcon name="cash" px={3.4} motion="bob" />
            </div>
            {account.authenticated && me && !isOrg && !invited ? (
              <NotRegistered />
            ) : account.authenticated && (isOrg || invited) ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted">
                <Spinner /> Opening your organisation…
              </div>
            ) : (
              <>
                <div className="label">Registered organisations</div>
                <h1 className="display mt-3 text-[2.4rem]">Sign in</h1>
                <p className="mt-2 text-[14px] text-muted">Use the email we registered for your organisation, or its Google account.</p>
                <div className="mt-7">
                  <SignInPanel methods={["email", "google"]} />
                </div>
                <div className="my-7 flex items-center gap-3 text-[12px] text-faint">
                  <span className="h-px flex-1 bg-line" /> New to Wukong? <span className="h-px flex-1 bg-line" />
                </div>
                <RegisterBlock />
              </>
            )}
            <Link
              href="/signin"
              className="group mt-7 flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-[13.5px] transition-colors hover:border-line-2 hover:bg-fg/[0.02]"
            >
              <span>
                <span className="text-muted">Looking for work?</span> <span className="font-semibold">Freelancers sign in here</span>
              </span>
              <ArrowRight size={15} className="text-gold transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Registering means emailing us; this makes that one click (or one copy). */
function RegisterBlock({ email }: { email?: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-[14px] leading-relaxed text-muted">
        Organisation accounts are set up by our team. Email <span className="text-fg">{HELP_EMAIL}</span> and we&apos;ll get you started.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={orgRegistrationMailto(email)} className="btn btn-red h-11 px-5">
          <Mail size={16} /> Email us to register
        </a>
        <button
          className="btn btn-line h-11 px-4"
          onClick={() => {
            navigator.clipboard?.writeText(HELP_EMAIL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy address"}
        </button>
      </div>
    </div>
  );
}

/** Signed in, but this login isn't an approved organisation. */
function NotRegistered() {
  const account = useAccount();
  const me = account.me!;
  const freelancer = me.onboarded && me.profile?.role === "worker";
  return (
    <div>
      <div className="label">{freelancer ? "Freelancer account" : "Not registered yet"}</div>
      <h1 className="display mt-3 text-[2.2rem] leading-tight">
        {freelancer ? (
          <>
            You&apos;re signed in as a <em className="text-gold-2">freelancer</em>
          </>
        ) : (
          <>
            This email isn&apos;t an <em className="text-gold-2">organisation</em> yet
          </>
        )}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        {freelancer
          ? `@${me.profile?.handle ?? "you"} is a freelancer account. Organisations use a separate account: sign out, then sign in with your organisation's registered email.`
          : me.email
            ? `${me.email} hasn't been registered as an organisation. If you've already emailed us, we'll reply as soon as it's approved.`
            : "You signed in with a wallet. Organisations sign in with the email we registered for them."}
      </p>
      <div className="mt-6">{!freelancer && <RegisterBlock email={me.email} />}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-line h-11 px-4" onClick={() => account.logout()}>
          <LogOut size={15} /> Sign out
        </button>
        <Link href={freelancer ? "/dashboard" : "/welcome"} className="btn btn-line h-11 px-4">
          {freelancer ? "Go to my work" : "Continue as a freelancer"} <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
