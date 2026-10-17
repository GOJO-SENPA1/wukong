"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Check, Copy, LogOut, Mail, Send } from "lucide-react";
import { HELP_EMAIL, useAccount } from "@/components/auth/Account";
import { SignInPanel } from "@/components/auth/SignInPanel";
import { Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Kicker, Spinner } from "@/components/ui";
import { orgRegistrationMailto } from "@/lib/contact";
import { safeNext } from "@/lib/client/nav";
import { track } from "@/lib/client/analytics";
import { toast } from "@/components/Toast";

const STEPS = [
  { title: "Tell us who you are", body: `Use the contact form, or email ${HELP_EMAIL}, with your organisation's name, website and the email you'll sign in with.` },
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
  // The account is set up automatically a moment after sign-in (once its wallet exists).
  const settingUp = account.authenticated && (!me || !me.onboarded) && !me?.walletInUse && !account.error;
  const { refresh } = account;
  useEffect(() => {
    if (isOrg) router.replace(next);
  }, [isOrg, next, router]);
  useEffect(() => {
    if (!settingUp) return;
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [settingUp, refresh]);

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
            {account.authenticated && me && !isOrg && !settingUp ? (
              <NotRegistered />
            ) : account.authenticated && (isOrg || settingUp) ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted">
                <Spinner /> {isOrg ? "Opening your organisation…" : "Setting up your account…"}
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

/** Registering means writing to us: the contact form, an email, or a copied address. */
function RegisterBlock({ email }: { email?: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-[14px] leading-relaxed text-muted">
        Organisation accounts are set up by our team. Send us a message, or email <span className="text-fg">{HELP_EMAIL}</span>, and we&apos;ll get you started.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/contact?topic=organisation" className="btn btn-red h-11 px-5" onClick={() => track("cta_click", { cta: "org_contact_form" })}>
          <Send size={16} /> Request an account
        </Link>
        <a href={orgRegistrationMailto(email)} className="btn btn-line h-11 px-4" onClick={() => track("org_request", { method: "email" })}>
          <Mail size={16} /> Email us
        </a>
        <button
          className="btn btn-line h-11 px-4"
          onClick={() => {
            navigator.clipboard?.writeText(HELP_EMAIL);
            setCopied(true);
            toast.success("Email address copied", HELP_EMAIL);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy address"}
        </button>
      </div>
    </div>
  );
}

/** Signed in, but this login isn't an approved organisation (yet). */
function NotRegistered() {
  const account = useAccount();
  const me = account.me!;
  return (
    <div>
      <div className="label">Not approved yet</div>
      <h1 className="display mt-3 text-[2.2rem] leading-tight">
        This account isn&apos;t an <em className="text-gold-2">organisation</em> yet
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        {me.email
          ? `${me.email} hasn't been approved as an organisation. Email us to register: as soon as it's approved, this same account becomes your organisation.`
          : "You signed in with a wallet. Organisations sign in with the email we approved for them."}
      </p>
      <div className="mt-6">{me.email && <RegisterBlock email={me.email} />}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-line h-11 px-4" onClick={() => account.logout()}>
          <LogOut size={15} /> Sign out
        </button>
        <Link href="/dashboard" className="btn btn-line h-11 px-4">
          Use Wukong as a freelancer <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
