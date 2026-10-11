"use client";

import { PixelIcon } from "@/components/fx/PixelIcon";
import { cx } from "@/components/ui";

/** The wordmark: WUK, a pixel coin for the O, NG. The coin flips on hover. */
export function Logo({ size = 26, className }: { size?: number; className?: string; light?: boolean }) {
  const px = size / 17;
  return (
    <span className={cx("group inline-flex items-center gap-2", className)} aria-label="Wukong">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-red" />
        <span className="relative h-2 w-2 rounded-full bg-red shadow-[0_0_12px_rgb(240_65_47/0.8)]" />
      </span>
      <span className="wordmark flex items-center leading-none text-fg" style={{ fontSize: size }} aria-hidden>
        WUK
        <PixelIcon name="coin" px={px} motion="hover" className="-mx-[0.1em] -my-[0.3em] translate-y-[0.06em]" />
        NG
      </span>
    </span>
  );
}
