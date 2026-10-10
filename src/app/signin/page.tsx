"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Check, LogIn } from "lucide-react";
import { useAccount } from "@/components/auth/Account";
import { Kinetic, Magnetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Kicker } from "@/components/ui";
import { safeNext } from "@/lib/client/nav";

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
    if (!account.authenticated || !account.me) return;
    router.replace(account.me.onboarded ? next : `/welcome?next=${encodeURIComponent(next)}`);
  }, [account.authenticated, account.me, next, router]);

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div className="aura left-[-8%] top-[-10%] h-[560px] w-[560px] bg-red/20" aria-hidden />
      <div className="aura right-[-6%] top-[20%] h-[460px] w-[460px] bg-gold/15 [animation-delay:-6s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid min-h-[80vh] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div>
          <Reveal y={8}>
            <Kicker>One account · hire or get hired</Kicker>
          </Reveal>
          <Kinetic text={"Sign in.\n*Start* *earning.*"} accent="italic text-foil" className="display mt-6 text-[clamp(3rem,7.5vw,6.2rem)]" />
          <Reveal delay={0.3} className="mt-7 max-w-md text-[16.5px] leading-relaxed text-muted">
            No seed phrase, no extension: a Solana wallet is created for you the moment you sign in. You choose whether you&apos;re hiring or
            working right after.
          </Reveal>
          <Reveal delay={0.45} className="mt-9 flex flex-col gap-3.5 text-[15px] text-fg/80">
            {["Email, Google, or a wallet you already have", "Your wallet is yours: export the key any time", "Rewards arrive as USDC, seconds after judging"].map((t) => (
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
            <div className="label">Welcome to Wukong</div>
            <h2 className="display mt-3 text-[2.4rem]">Continue to your account</h2>
            {account.enabled ? (
              <>
                <Magnetic className="mt-8 block w-full" strength={0.12}>
                  <button className="btn btn-red h-14 w-full text-[16px]" onClick={account.login} disabled={!account.ready}>
                    <LogIn size={18} /> {account.ready ? "Sign in or create an account" : "Loading…"}
                  </button>
                </Magnetic>
                <p className="mt-4 text-center text-[13px] text-muted">New here? The same button creates your account.</p>
              </>
            ) : (
              <p className="well mt-6 p-4 text-[14px] leading-relaxed text-muted">
                Accounts aren&apos;t switched on for this deployment. Use the demo accounts in the menu at the top right to try everything.
              </p>
            )}
            <p className="mt-8 border-t border-line pt-5 text-[12.5px] leading-relaxed text-faint">
              By continuing you agree to Wukong&apos;s terms. Your email is never shown publicly; your profile shows only what you choose.{" "}
              <Link href="/" className="link-underline text-fg/80">
                Back home
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
