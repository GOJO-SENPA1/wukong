"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Check, LogIn } from "lucide-react";
import { useAccount } from "@/components/auth/Account";
import { Kinetic, Magnetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
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
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" aria-hidden />
      <div className="relative mx-auto grid min-h-[78vh] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div>
          <Kinetic text={"Sign in.\n*Start* *earning.*"} className="display text-[clamp(3rem,8vw,6.5rem)]" />
          <Reveal delay={0.3} className="mt-6 max-w-md text-[17px] leading-relaxed text-white/65">
            One account for working and hiring on Wukong. No seed phrase, no extension: a Solana wallet is created for you the moment you sign in.
          </Reveal>
          <Reveal delay={0.45} className="mt-8 flex flex-col gap-3 text-[15px] text-white/75">
            {["Email, Google, or a wallet you already have", "Your wallet is yours: export the key any time", "Rewards arrive as USDC, seconds after judging"].map((t) => (
              <span key={t} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <Check size={13} strokeWidth={3} />
                </span>
                {t}
              </span>
            ))}
          </Reveal>
        </div>
        <Reveal delay={0.2} y={40}>
          <div className="relative rounded-[24px] bg-white p-8 text-navy shadow-[0_50px_100px_-40px_rgb(0_0_0/0.8)] sm:p-10">
            <div className="absolute -right-4 -top-8">
              <PixelIcon name="monkey" px={4} motion="bob" />
            </div>
            <div className="mono-label text-muted">Welcome to Wukong</div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight">Continue to your account</h2>
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
              <p className="mt-6 rounded-xl bg-paper p-4 text-[14px] leading-relaxed text-muted">
                Accounts aren&apos;t switched on for this deployment. Use the demo accounts in the menu at the top right to try everything.
              </p>
            )}
            <p className="mt-8 border-t border-line pt-5 text-[12.5px] leading-relaxed text-muted">
              By continuing you agree to Wukong&apos;s terms. Your email is never shown publicly; your profile shows only what you choose.{" "}
              <Link href="/" className="link-underline text-blue">
                Back home
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
