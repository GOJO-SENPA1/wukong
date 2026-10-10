# Colosseum submission draft

Copy-paste material for the submission form. Fill the `[brackets]`, cut to each field's limit, and keep every claim true to what you demo.

**Project name:** Wukong

**One-liner:** Post a task. Summon the crowd. Pay the best: a competitive work marketplace where USDC escrow locks before anyone works, an AI judge scores every entry on-chain, and reputation belongs to the worker.

**Tracks:** Main track · Nepal track (*NEPAL*) · [University, if eligible]

**Links**
- Live app: [https://<app>.fly.dev]
- Repo: https://github.com/GOJO-SENPA1/wukong
- Pitch video (3 min): [link]. Open it with the 60-second film: [`media/wukong-film.mp4`](media/wukong-film.mp4)
- Technical demo (2–3 min): [link]. A captioned walkthrough is ready: [`media/wukong-demo.mp4`](media/wukong-demo.mp4)
- Social: vertical reel for X / Instagram: [`media/wukong-reel.mp4`](media/wukong-reel.mp4)
- Program id (devnet): [id from `anchor keys sync`]

## Short description (≈ 100 words)

Freelancing is a one-to-one bet: you hire one person and hope. Wukong flips it. A company posts a task and the USDC reward locks in an on-chain escrow before anyone starts. Many workers compete; each entry is committed by hash and sealed. An AI judge scores every entry against a public rubric, catches copycats, prompt-injection attempts and spam, and publishes each score on-chain. The program ranks the scores itself and pays the top three in one transaction. Cheaters lose their entry stake. Every result builds the worker's portable on-chain reputation. AI agents can buy human work too, paying over x402.

## Problem

The freelance market (~$1.5T) runs on one-to-one hiring. Buyers carry the risk of a bad hire or a ghosted contract and pay again to start over. Workers carry the rest: unpaid invoices, slow withdrawals, opaque ranking, and a reputation locked inside a platform that can ban them. Competitive submission fixes the buyer side (99designs, Kaggle, HackerOne, Topcoder proved it), but every version is locked to one vertical and judged by hand.

## Solution

- **Escrow first:** `create_task` moves the full reward into a program-owned vault. It can only leave to the winners, or back to the buyer if nothing scores 25 or more.
- **Binding, public scores:** the judge can only publish one final score per entry, with the sha256 of its written report. The program maintains the top-3 podium as scores land, and anyone can trigger settlement: the winner is a function of published scores, not of anyone's say-so.
- **AI judge you can audit:** verifies every entry against its on-chain hash, runs deterministic copycat / injection / spam checks, then scores with Claude against a public, per-category rubric using structured output. Penalties are deterministic and published; the browser re-hashes each report against the chain.
- **Skin in the game:** optional refundable entry stakes, slashed on-chain for entries scoring under 20.
- **No ghosting, either side:** in "AI shortlists, I pick" mode, a buyer who never picks loses the choice after a grace period; anyone can then settle on the AI's top entry.
- **Portable reputation:** a PDA per worker (submissions, scores, wins, earnings, rating) that gates higher-value tasks and that any app can read.
- **Agents as buyers:** `POST /api/x402/tasks` answers 402 Payment Required; an agent pays in USDC with an x402 `exact` payment, the gateway escrows the task, and the agent polls for the winning work.
- **Blinks:** every open task is a Solana Action, so workers can enter (and stake) straight from a post.

## Why Solana

Sub-cent fees make per-entry commitments, per-score transactions and per-stake claims practical; fast finality makes judging feel live on stage; USDC and wallets make payouts global and instant; Actions/Blinks and x402 bring the buyers and the workers to where they already are.

## Tech

Anchor 0.32 program (10 instructions, 11 integration tests on a local validator), Next.js 16 app with server-built transactions any wallet can sign, Claude judge (`claude-opus-5-5`, structured outputs, offline heuristic fallback), x402 facilitator, Solana Actions, a keeper for deadline-driven judging and settlement, and CI running the whole chain suite (tests → fresh chain → production build → end-to-end → x402).

## Business model

10% of every payout, enforced on-chain at settlement (capped at 20% by the program). Next: agents paying per task over x402, priority judging, managed briefs, and a reputation API for other platforms.

## Nepal angle

First vertical: copy and Nepali localization for Kathmandu businesses (tourism, cafés, fintech), where reliable freelance payouts and portable reputation matter most. [Real tasks/users you ran: …]

## What's next

Devnet launch with real tasks from Kathmandu businesses; refinement rounds for the top three; multi-model, multi-oracle judging; an on-chain liveness refund if a judge goes dark; reputation API.

## Team

[Names, roles, links]
