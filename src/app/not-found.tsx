import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center sm:py-28">
      <div className="relative select-none" aria-hidden>
        <span className="block font-display text-8xl font-bold leading-none text-line-2 sm:text-9xl">404</span>
      </div>
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Nothing here.{" "}
          <span className="bg-gradient-to-r from-gold-2 via-gold to-ember bg-clip-text text-transparent">
            The crowd is elsewhere.
          </span>
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          That page doesn&apos;t exist. Escrow is safe — nothing was locked and nothing moved.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/tasks" className="btn btn-gold px-5 py-3">
          <Compass size={17} /> Enter the arena
        </Link>
        <Link href="/" className="btn btn-ghost px-5 py-3">
          <ArrowLeft size={17} /> Back home
        </Link>
      </div>
    </div>
  );
}