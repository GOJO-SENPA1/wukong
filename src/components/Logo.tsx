"use client";

import { PixelIcon } from "@/components/fx/PixelIcon";
import { cx } from "@/components/ui";

/** The wordmark: WUK, a pixel coin for the O, NG. The coin flips on hover. */
export function Logo({ size = 26, className, light = false }: { size?: number; className?: string; light?: boolean }) {
  const px = size / 17;
  return (
    <span className={cx("group inline-flex items-center gap-2", className)} aria-label="Wukong">
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-red" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-red" />
      </span>
      <span className={cx("display flex items-center leading-none", light ? "text-white" : "text-navy")} style={{ fontSize: size }} aria-hidden>
        WUK
        <PixelIcon name="coin" px={px} motion="hover" className="-mx-[0.12em] -my-[0.3em]" />
        NG
      </span>
    </span>
  );
}
