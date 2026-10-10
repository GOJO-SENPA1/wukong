"use client";

import { useApp } from "./Providers";

export function SetupNotice() {
  const { state } = useApp();
  return (
    <div className="card border-ember/40 p-5">
      <div className="font-display font-semibold text-ember">Waiting for the chain</div>
      <p className="mt-1 text-sm text-muted">{state.error ?? "Connecting…"}</p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 font-mono text-xs text-muted">
        {`npm run validator          # terminal 1: local Solana with the program preloaded
npm run setup:localnet     # mint demo USDC, init config, judge + treasury keys
npm run seed               # optional: history, reputation, open tasks
npm run dev`}
      </pre>
    </div>
  );
}
