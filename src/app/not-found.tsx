"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Kinetic, Magnetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";

export default function NotFound() {
  return (
    <section className="relative -mt-16 flex min-h-[86vh] items-center overflow-hidden pt-16">
      <div className="aura left-[-6%] top-[0%] h-[520px] w-[520px] bg-red/20" aria-hidden />
      <div className="aura right-[0%] top-[30%] h-[440px] w-[440px] bg-gold/15 [animation-delay:-6s]" aria-hidden />
      <div className="grid-lines mask-fade absolute inset-0" aria-hidden />
      {/* clouds drifting past */}
      {[
        { top: "14%", dur: 38, delay: 0, px: 4 },
        { top: "62%", dur: 52, delay: -20, px: 3 },
        { top: "35%", dur: 46, delay: -34, px: 2.4 },
      ].map((c, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute opacity-25"
          style={{ top: c.top }}
          initial={{ x: "-20vw" }}
          animate={{ x: "110vw" }}
          transition={{ duration: c.dur, repeat: Infinity, ease: "linear", delay: c.delay }}
        >
          <PixelIcon name="cloud" px={c.px} />
        </motion.div>
      ))}
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <div className="mono-label text-gold">Error 404</div>
          <Kinetic text={"Lost in\nthe *clouds.*"} className="display mt-5 text-[clamp(3.4rem,9vw,7.4rem)]" accent="italic text-foil" />
          <Reveal delay={0.4} className="mt-7 max-w-md text-[16px] leading-relaxed text-muted">
            Even the Monkey King somersaults past the edge of the world sometimes. This page doesn&apos;t exist, or the task was never posted.
          </Reveal>
          <Reveal delay={0.55} className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/" className="btn btn-red h-12 px-6">
                <ArrowLeft size={17} /> Back home
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tasks" className="btn btn-line h-12 px-6">
                Browse the marketplace
              </Link>
            </Magnetic>
          </Reveal>
        </div>
        <motion.div
          className="relative self-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <div className="animate-float">
            <PixelIcon name="monkey" px={9} />
            <div className="-mt-[124px] ml-2">
              <PixelIcon name="cloud" px={10} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
