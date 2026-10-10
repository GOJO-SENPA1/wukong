"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "./Account";

const OPEN = ["/welcome", "/signin", "/business"];

/** Signed in but not set up yet: send them to onboarding (once, from any page). */
export function OnboardingGate() {
  const account = useAccount();
  const path = usePathname();
  const router = useRouter();
  const pending = account.authenticated && account.me !== null && !account.me.onboarded;
  useEffect(() => {
    if (pending && !OPEN.some((p) => path.startsWith(p))) router.replace(`/welcome?next=${encodeURIComponent(path)}`);
  }, [pending, path, router]);
  return null;
}
