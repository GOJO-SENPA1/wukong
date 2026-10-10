"use client";

import { useApp } from "./Providers";

export function SetupNotice() {
  const { state } = useApp();
  return (
    <div className="card !border-ember/30 p-6">
      <div className="mono-label text-ember">Waiting for the chain</div>
      <p className="mt-2 text-sm text-muted">{state.error ?? "Connecting…"}</p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-[#05060a] p-4 font-mono text-xs leading-6 text-muted">
        {`npm run validator          # terminal 1: local Solana with the program preloaded
npm run setup:localnet     # mint demo USDC, init config, judge + treasury keys
npm run seed               # optional: history, reputation, open tasks
npm run dev`}
      </pre>
    </div>
  );
}
