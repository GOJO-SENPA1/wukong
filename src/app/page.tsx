"use client";

import { Hero } from "@/components/landing/Hero";
import { Agents, Faq, FinalCta, HowItWorks, Judge, LiveTasks, Pricing, Proof, ScrollBand, Split } from "@/components/landing/Sections";
import { SetupNotice } from "@/components/SetupNotice";
import { useApp } from "@/components/Providers";

export default function Home() {
  const { state } = useApp();
  return (
    <>
      <Hero />
      {!state.ready && state.error && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <SetupNotice />
        </div>
      )}
      <Proof />
      <HowItWorks />
      <Split />
      <Judge />
      <ScrollBand />
      <LiveTasks />
      <Agents />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
