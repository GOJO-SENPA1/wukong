"use client";

import { useApp } from "./Providers";

export function SetupNotice() {
  const { state } = useApp();
  return (
    <div className="card border-ember/40 p-6">
      <div className="mono-label text-ember">Waiting for the chain</div>
      <p className="mt-2 text-sm text-muted">{state.error ?? "Connecting…"}</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 font-mono text-xs leading-6 text-white/70">
        {`npm run validator          # terminal 1: local Solana with the program preloaded
npm run setup:localnet     # mint demo USDC, init config, judge + treasury keys
npm run seed               # optional: history, reputation, open tasks
npm run dev`}
      </pre>
    </div>
  );
}
