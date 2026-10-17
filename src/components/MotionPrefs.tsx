"use client";

import { MotionConfig } from "motion/react";

/**
 * Every motion animation on the site follows the visitor's "reduce motion"
 * setting: movement and scaling are skipped, fades stay. CSS animations are
 * handled in globals.css, canvas effects by prefersReducedMotion().
 */
export function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
