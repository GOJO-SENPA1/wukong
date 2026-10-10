"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { Container } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="animate-float">
        <PixelIcon name="fire" px={5} motion="bob" />
      </div>
      <h1 className="display text-[clamp(2.6rem,6vw,4.5rem)]">
        Something <em className="text-gold-2">broke.</em>
      </h1>
      <p className="max-w-md leading-relaxed text-muted">
        {error.message || "An unexpected error stopped this page."} Your funds are safe: escrow lives on-chain, not in this page.
      </p>
      <div className="flex gap-3">
        <button className="btn btn-red h-12 px-6" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
        <Link href="/" className="btn btn-line h-12 px-6">
          Back home
        </Link>
      </div>
    </Container>
  );
}
