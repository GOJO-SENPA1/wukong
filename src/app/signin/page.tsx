"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useAccount } from "@/components/auth/Account";
import { SignInPanel } from "@/components/auth/SignInPanel";
import { Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Kicker } from "@/components/ui";
import { safeNext } from "@/lib/client/nav";

/** Freelancers sign in or sign up here. Organisations have their own page, /business. */
export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const account = useAccount();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  useEffect(() => {
    const me = account.me;
    if (!account.authenticated || !me) return;
    router.replace(me.onboarded ? next : `/welcome?next=${encodeURIComponent(next)}`);
  }, [account.authenticated, account.me, next, router]);

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div className="aura left-[-8%] top-[-10%] h-[560px] w-[560px] bg-blue/15" aria-hidden />
      <div className="aura right-[-6%] top-[20%] h-[460px] w-[460px] bg-gold/15 [animation-delay:-6s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid min-h-[80vh] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div>
          <Reveal y={8}>
            <Kicker>For freelancers</Kicker>
          </Reveal>
          <Kinetic text={"Get paid for the work,\n*not* *the* *pitch.*"} accent="italic text-foil" className="display mt-6 text-[clamp(2.8rem,6.4vw,5.6rem)]" />
          <Reveal delay={0.3} className="mt-7 max-w-md text-[16.5px] leading-relaxed text-muted">
            Sign in, or create your free account in a few seconds. A Solana wallet is made for you, so there&apos;s no seed phrase and no
            extension to install.
          </Reveal>
          <Reveal delay={0.45} className="mt-9 flex flex-col gap-3.5 text-[15px] text-fg/80">
            {["Enter any open task, no proposals or bidding", "Paid in USDC seconds after judging", "Written feedback on every entry, win or lose"].map((t) => (
              <span key={t} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-gold-2">
                  <Check size={12} strokeWidth={3} />
                </span>
                {t}
              </span>
            ))}
          </Reveal>
        </div>
        <Reveal delay={0.2} y={24}>
          <div className="card-gold relative !rounded-[26px] p-8 sm:p-10">
            <div className="absolute -right-3 -top-9">
              <PixelIcon name="monkey" px={3.6} motion="bob" />
            </div>
            <div className="label">Freelancer account</div>
            <h1 className="display mt-3 text-[2.4rem]">Sign in or sign up</h1>
            <p className="mt-2 text-[14px] text-muted">New here? The same buttons create your account.</p>
            <div className="mt-7">
              <SignInPanel methods={["email", "google", "wallet"]} />
            </div>
            <Link
              href="/business"
              className="group mt-7 flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-[13.5px] transition-colors hover:border-line-2 hover:bg-fg/[0.02]"
            >
              <span>
                <span className="text-muted">Hiring?</span> <span className="font-semibold">Organisations sign in here</span>
              </span>
              <ArrowRight size={15} className="text-gold transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-6 text-[12.5px] leading-relaxed text-faint">
              By continuing you agree to Wukong&apos;s terms. Your email is never shown publicly; your profile shows only what you choose.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
