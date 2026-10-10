"use client";

import { motion, useReducedMotion } from "motion/react";

// Re-mounted on every navigation: the page fades up while a hairline of light sweeps across the top.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-px origin-left bg-gradient-to-r from-red via-gold-2 to-red"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }, opacity: { delay: 0.5, duration: 0.35 } }}
      />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </motion.div>
    </>
  );
}
