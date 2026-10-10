"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Kinetic, Magnetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[78vh] items-center overflow-hidden bg-navy text-white">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      {/* clouds drifting past */}
      {[
        { top: "14%", dur: 38, delay: 0, px: 4 },
        { top: "62%", dur: 52, delay: -20, px: 3 },
        { top: "35%", dur: 46, delay: -34, px: 2.4 },
      ].map((c, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute opacity-40"
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
          <div className="mono-label text-red-2">Error 404</div>
          <Kinetic text={"Lost in\nthe *clouds.*"} className="display mt-4 text-[clamp(3.4rem,10vw,8rem)]" accent="text-red" />
          <Reveal delay={0.4} className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65">
            Even the Monkey King somersaults past the edge of the world sometimes. This page doesn&apos;t exist, or the task was never posted.
          </Reveal>
          <Reveal delay={0.55} className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/" className="btn btn-red h-12 px-6">
                <ArrowLeft size={17} /> Back home
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tasks" className="btn btn-ghost-light h-12 px-6">
                Explore tasks
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
