"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Mail, Wallet, X } from "lucide-react";
import { useAccount, type LoginMethod } from "./Account";
import { Spinner } from "@/components/ui";
import { track } from "@/lib/client/analytics";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const OPTIONS: Record<LoginMethod, { label: string; icon: ReactNode }> = {
  email: { label: "Continue with email", icon: <Mail size={17} /> },
  google: { label: "Continue with Google", icon: <GoogleMark /> },
  wallet: { label: "Use a Solana wallet", icon: <Wallet size={17} /> },
};

/** Sign-in buttons, one per method, with whatever went wrong shown underneath. */
export function SignInPanel({ methods, primary = "email" }: { methods: LoginMethod[]; primary?: LoginMethod }) {
  const account = useAccount();
  if (!account.enabled) {
    return (
      <p className="well p-4 text-[14px] leading-relaxed text-muted">
        Accounts aren&apos;t switched on for this deployment. Use the demo accounts in the menu at the top right to try everything.
      </p>
    );
  }
  const busy = !account.ready || (account.authenticated && !account.me && !account.error);
  return (
    <div className="flex flex-col gap-2.5">
      {methods.map((m) => (
        <button
          key={m}
          className={m === primary ? "btn btn-ivory h-12 w-full text-[15px]" : "btn btn-line h-12 w-full text-[15px]"}
          disabled={busy}
          onClick={() => {
            track("sign_in_start", { method: m });
            account.login([m]);
          }}
        >
          {busy && m === primary ? <Spinner /> : OPTIONS[m].icon} {busy && m === primary ? (account.authenticated ? "Loading your account…" : "Loading…") : OPTIONS[m].label}
        </button>
      ))}
      <p className="mt-1 text-center text-[12.5px] leading-relaxed text-faint">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline decoration-line-2 underline-offset-2 hover:text-fg">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline decoration-line-2 underline-offset-2 hover:text-fg">
          Privacy Policy
        </Link>
        .
      </p>
      <AnimatePresence>
        {account.error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-1 flex items-start gap-2.5 rounded-xl bg-red/10 p-3 text-[13.5px] leading-relaxed text-red-2"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{account.error}</span>
            <button onClick={account.clearError} aria-label="Dismiss" className="text-red-2/70 transition-colors hover:text-red-2">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
