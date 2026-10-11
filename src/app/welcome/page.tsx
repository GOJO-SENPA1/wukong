"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LogIn, LogOut, RotateCcw } from "lucide-react";
import { HELP_EMAIL, useAccount } from "@/components/auth/Account";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Container, Spinner } from "@/components/ui";
import { safeNext } from "@/lib/client/nav";

/**
 * Right after the first sign-in. The profile is set up automatically as soon as the
 * new account's Solana wallet exists (a few seconds), so this page just waits for
 * that, then carries on to where the user was going.
 */
export default function WelcomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}

function Welcome() {
  const account = useAccount();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const me = account.me;
  const { refresh } = account;

  useEffect(() => {
    if (me?.onboarded) router.replace(next);
  }, [me?.onboarded, next, router]);

  // Keep checking while the wallet (and with it the profile) is being created.
  const waiting = account.authenticated && !me?.onboarded && !me?.walletInUse;
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [waiting, refresh]);

  if (!account.enabled) {
    return (
      <Container>
        <div className="card mx-auto max-w-lg p-8 text-center text-muted">Accounts aren&apos;t switched on for this deployment.</div>
      </Container>
    );
  }
  if (!account.authenticated) {
    return (
      <Shell icon="monkey" title={<>Sign in to <em className="text-gold-2">get started</em></>}>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signin" className="btn btn-red h-12 px-6">
            <LogIn size={17} /> Freelancer sign in
          </Link>
          <Link href="/business" className="btn btn-line h-12 px-6">
            Organisation sign in
          </Link>
        </div>
      </Shell>
    );
  }
  if (me?.walletInUse) {
    return (
      <Shell icon="lock" title={<>This wallet is <em className="text-gold-2">already linked</em></>}>
        <p className="max-w-md leading-relaxed text-muted">
          The wallet you signed in with belongs to another Wukong account. Sign in with that account instead, or email {HELP_EMAIL} and we&apos;ll
          sort it out.
        </p>
        <button className="btn btn-line h-11 px-5" onClick={() => account.logout()}>
          <LogOut size={15} /> Sign out
        </button>
      </Shell>
    );
  }
  if (account.error && !me?.onboarded) {
    return (
      <Shell icon="fire" title={<>Your account didn&apos;t <em className="text-gold-2">load</em></>}>
        <p className="max-w-md leading-relaxed text-red-2">{account.error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className="btn btn-red h-11 px-5"
            onClick={() => {
              account.clearError();
              void refresh();
            }}
          >
            <RotateCcw size={15} /> Try again
          </button>
          <button className="btn btn-line h-11 px-5" onClick={() => account.logout()}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </Shell>
    );
  }
  return (
    <Shell icon="coin" title={<>Setting up your <em className="text-gold-2">account</em></>}>
      <p className="flex items-center gap-3 text-muted">
        <Spinner className="text-gold" /> Creating your wallet and profile. This takes a few seconds.
      </p>
    </Shell>
  );
}

function Shell({ icon, title, children }: { icon: "monkey" | "lock" | "fire" | "coin"; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <Container className="relative flex min-h-[64vh] flex-col items-center justify-center gap-6 text-center">
      <div className="aura left-[calc(50%-9rem)] top-1/4 h-72 w-72 bg-gold/15" aria-hidden />
      <PixelIcon name={icon} px={3.6} motion={icon === "coin" ? "spin" : "bob"} />
      <h1 className="display text-[clamp(2.6rem,6vw,4.2rem)]">{title}</h1>
      {children}
    </Container>
  );
}
