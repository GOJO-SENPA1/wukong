"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { useAccount } from "./Account";

/** Sign-in and account problems, shown wherever they happen (the sign-in pages show them inline instead). */
export function AuthNotice() {
  const account = useAccount();
  const path = usePathname();
  const inline = ["/signin", "/business"].some((p) => path.startsWith(p));
  const show = !!account.error && !inline;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-[85] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-red/30 bg-surface/95 p-4 text-[14px] leading-relaxed shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-2" />
          <span className="flex-1 text-fg/90">{account.error}</span>
          <button onClick={account.clearError} aria-label="Dismiss" className="text-muted transition-colors hover:text-fg">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
