"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Droplets, KeyRound, LogIn, Send } from "lucide-react";
import QRCode from "qrcode";
import { PublicKey } from "@solana/web3.js";
import { useApp } from "@/components/Providers";
import { useAccount } from "@/components/auth/Account";
import { Counter, Kinetic, Reveal } from "@/components/fx/motion";
import { PixelIcon } from "@/components/fx/PixelIcon";
import { burst } from "@/components/fx/Overlay";
import { Container, ExplorerLink, Kicker, Skeleton, Spinner, cx } from "@/components/ui";
import { getJSON, postJSON, runAction } from "@/lib/client/api";
import { toUsdc } from "@/lib/format";

interface Balances {
  address: string;
  usdcAccount: string;
  sol: number;
  usdc: number;
  escrowed: number;
  openTasks: number;
}

export default function WalletPage() {
  const { signer, role, persona, state, identityReady } = useApp();
  const account = useAccount();
  const address = signer?.publicKey.toBase58() ?? null;
  const [bal, setBal] = useState<Balances | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    if (!address) return;
    getJSON<Balances>(`/api/wallet/${address}`).then(setBal).catch(() => {});
  }, [address]);
  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => {
    if (!address) return setQr(null);
    QRCode.toDataURL(address, { margin: 1, width: 360, color: { dark: "#07080C", light: "#F1EDE4" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [address]);

  if (!identityReady) {
    return (
      <Container className="flex flex-col gap-8">
        <Skeleton className="h-20 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 !rounded-[18px]" />
          ))}
        </div>
      </Container>
    );
  }
  if (!address) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <PixelIcon name="coin" px={3.6} motion="spin" />
        <h1 className="display text-[clamp(2.6rem,6vw,4.2rem)]">
          Your <em className="text-gold-2">wallet</em>
        </h1>
        <p className="max-w-md leading-relaxed text-muted">{account.enabled ? "Sign in to see your balance, deposit and withdraw." : "Pick a demo account at the top right."}</p>
        {account.enabled && !account.authenticated && (
          <Link href="/signin?next=/wallet" className="btn btn-red h-12 px-6">
            <LogIn size={17} /> Sign in
          </Link>
        )}
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-8">
      <div>
        <Reveal y={8}>
          <Kicker>{role === "company" ? "Organisation wallet" : "Your earnings"}</Kicker>
        </Reveal>
        <Kinetic text="Your *wallet*" accent="italic text-gold-2" className="display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]" />
        <Reveal delay={0.2} className="mt-4 text-[15px] text-muted">
          A Solana wallet {persona === "account" ? "that belongs to you" : "for this demo account"}. Rewards, refunds and stakes move through it.
        </Reveal>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Reveal>
          <div className="card-gold relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/15 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="label">USDC balance</div>
              <div className="num text-foil mt-3 text-[64px]">
                <Counter value={toUsdc(bal?.usdc ?? 0)} decimals={2} />
              </div>
              <div className="mt-3 text-[13px] text-muted">
                <Counter value={bal?.sol ?? 0} decimals={4} /> SOL for network fees
              </div>
            </div>
            <div className="absolute bottom-4 right-4">
              <PixelIcon name="coin" px={2.8} motion="spin" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="card h-full p-6">
            <div className="label">{role === "company" ? "Locked in your open tasks" : "Locked in escrow"}</div>
            <div className="num mt-3 text-[52px]">
              <Counter value={toUsdc(bal?.escrowed ?? 0)} decimals={2} />
            </div>
            <div className="mt-3 text-[13px] text-muted">
              {bal?.openTasks ? `${bal.openTasks} open ${bal.openTasks === 1 ? "task" : "tasks"}` : "Nothing locked right now"}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="card h-full p-6">
            <div className="label">Network</div>
            <div className="num mt-3 text-[44px] capitalize">{state.deployment?.cluster ?? "…"}</div>
            <div className="mt-3 text-[13px] text-muted">
              <ExplorerLink kind="address" id={address}>
                View on Solana Explorer
              </ExplorerLink>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="card p-6 sm:p-7">
            <h2 className="text-[19px] font-semibold tracking-tight">Deposit</h2>
            <p className="mt-1 text-[14px] text-muted">Send USDC (and a little SOL for fees) on Solana {state.deployment?.cluster} to this address.</p>
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-2xl bg-fg p-2.5 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)]">
                {qr ? (
                  <img src={qr} alt="QR code of your wallet address" width={164} height={164} className="block rounded-lg" />
                ) : (
                  <div className="h-[164px] w-[164px] animate-pulse rounded-lg bg-bg/10" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="label">Your address</div>
                <div className="mt-2 break-all font-mono text-[13px] leading-relaxed text-fg/90">{address}</div>
                <button
                  className="btn btn-line mt-4 h-10"
                  onClick={() => {
                    navigator.clipboard?.writeText(address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy address"}
                </button>
                <p className="well mt-4 p-3 text-[12.5px] leading-relaxed text-muted">
                  Card top-ups are coming. Until then, send USDC from an exchange or another Solana wallet.
                </p>
              </div>
            </div>
            {state.demoMode && <Faucet address={address} company={role === "company"} onDone={load} />}
          </div>
        </Reveal>
        <div className="flex flex-col gap-6">
          <Withdraw max={bal?.usdc ?? 0} onDone={load} />
          {persona === "account" && account.embedded && (
            <Reveal delay={0.1}>
              <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="max-w-sm">
                  <div className="text-[17px] font-semibold">Export your key</div>
                  <p className="mt-1 text-[13.5px] text-muted">Take your wallet to Phantom or Backpack. The key is shown in a secure Privy window; Wukong never sees it.</p>
                </div>
                <button className="btn btn-line h-11" onClick={() => account.exportWallet()}>
                  <KeyRound size={16} /> Export key
                </button>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </Container>
  );
}

function Withdraw({ max, onDone }: { max: number; onDone: () => void }) {
  const { signer } = useApp();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; sig?: string } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  let validTo = false;
  try {
    validTo = !!to && PublicKey.isOnCurve(new PublicKey(to).toBytes());
  } catch {
    validTo = false;
  }
  const n = Number(amount);
  const validAmount = Number.isFinite(n) && n > 0 && n * 1_000_000 <= max;
  async function send() {
    if (!signer || !validTo || !validAmount) return;
    setBusy(true);
    setMsg(null);
    try {
      const { sig } = await runAction(signer, { kind: "withdraw", to, amountUsdc: Math.floor(n * 1_000_000) / 1_000_000 });
      setMsg({ ok: true, text: `Sent ${n} USDC.`, sig });
      burst(btn.current, { count: 14 });
      setAmount("");
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Reveal>
      <div className="card p-6 sm:p-7">
        <h2 className="text-[19px] font-semibold tracking-tight">Withdraw</h2>
        <p className="mt-1 text-[14px] text-muted">Send USDC to any Solana address. You sign it; network fees come from your SOL.</p>
        <label className="mt-5 flex flex-col gap-2">
          <span className="text-[14px] font-semibold">To address</span>
          <input className={cx("input font-mono text-[13px]", to && !validTo && "!border-red/60")} value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="Solana address" spellCheck={false} />
        </label>
        <label className="mt-4 flex flex-col gap-2">
          <span className="flex justify-between text-[14px] font-semibold">
            Amount
            <button className="text-[12.5px] font-normal text-gold-2 transition-colors hover:text-fg" onClick={() => setAmount(String(toUsdc(max)))} type="button">
              Max {toUsdc(max).toFixed(2)}
            </button>
          </span>
          <span className="relative">
            <input className={cx("input num !pr-16 !text-[1.4rem]", amount && !validAmount && "!border-red/60")} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            <span className="mono-label absolute right-4 top-1/2 -translate-y-1/2 text-faint">USDC</span>
          </span>
        </label>
        <button ref={btn} className="btn btn-ivory mt-5 h-12 w-full" disabled={!validTo || !validAmount || busy || !signer} onClick={send}>
          {busy ? <Spinner /> : <Send size={16} />} Send USDC
        </button>
        <AnimatePresence>
          {msg && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cx("mt-4 rounded-xl p-3 text-[14px]", msg.ok ? "bg-green/10 text-green" : "bg-red/10 text-red-2")}
            >
              {msg.text} {msg.sig && <ExplorerLink id={msg.sig}>tx</ExplorerLink>}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

function Faucet({ address, company, onDone }: { address: string; company: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      <p className="max-w-xs text-[13px] text-muted">
        {err ?? `Demo network: top up with test SOL${company ? " and test USDC" : " and a little test USDC"}.`}
      </p>
      <button
        ref={btn}
        className="btn btn-line h-10"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await postJSON("/api/faucet", { address, role: company ? "company" : "worker" });
            setDone(true);
            burst(btn.current, { count: 12 });
            onDone();
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Spinner /> : done ? <Check size={15} /> : <Droplets size={15} />} {done ? "Sent" : "Get test funds"}
      </button>
    </div>
  );
}
