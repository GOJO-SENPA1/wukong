# Colosseum submission draft

Copy-paste material for the Crypto World's Fair submission form (due **Oct 12, 2026, 11:59 PM PT**, which is Oct 13, 06:59 UTC). Fill the `[brackets]`, cut to each field's limit, and keep every claim true to what you demo. Run the pitch past Colosseum Copilot before submitting.

**Project name:** Wukong

**One-liner:** Post a task, let the crowd compete, and an AI judge picks the best entry and pays the winner automatically.

**Tracks:** General prizes · Solana track · Nepal Startup Track · [any Superteam Earn side track that fits: payments, AI/agents, x402] · [Public Good / University, if eligible]

**Links**
- Live app: https://wukonghq.xyz
- Judge benchmark: https://wukonghq.xyz/benchmarks
- Repo: https://github.com/GOJO-SENPA1/wukong
- Pitch video (under 3 min): [link]. Open with the 60-second film: [`media/wukong-film.mp4`](media/wukong-film.mp4)
- Technical demo (2–3 min): [link]. A captioned walkthrough is ready: [`media/wukong-demo.mp4`](media/wukong-demo.mp4)
- Social: vertical reel for X / Instagram: [`media/wukong-reel.mp4`](media/wukong-reel.mp4)
- Program id (devnet): `5BWF3ueP3ccwFMRv23nn1p1yFUA8hRsqrXy8cQye5zKk`

## Short description (about 100 words)

Hiring is a one-to-one bet: you pick one freelancer and hope. Wukong lets a business post a task to a crowd instead. The USDC reward locks in on-chain escrow before anyone starts. Many people compete, and each entry is sealed by hash. An AI judge scores every entry against a public rubric, catches copies, spam and prompt-injection attempts, and writes feedback for every entrant. Each score goes on-chain with a hash of its report, and the program pays the top three automatically. Every result builds the worker's portable on-chain reputation. AI agents can post tasks too, paying over x402.

## Problem

Freelance work runs on one-to-one hiring. Buyers carry the risk of a bad hire and pay again to start over. Workers carry the rest: unpaid invoices, slow withdrawals, opaque ranking, and a reputation locked inside one platform.

Competitions fix the buyer side: 99designs, Kaggle, Topcoder and competitive audits all prove it. But each one is locked to a single vertical and judged by hand, which takes days to weeks. Colosseum's own spring hackathon had 2,857 submissions; at ten minutes each, that is about 476 judge-hours. Superteam Earn shows the demand on Solana, but it is a job board for web3 teams, and sponsors still read every entry themselves.

## Solution

- **Escrow first.** `create_task` moves the full reward into a program-owned vault. It can only leave to the winners, or back to the buyer if no entry scores 25 or more.
- **A judge that is hard to fool and easy to check.**
  - The brief is compiled into facts that code measures exactly: word limits, required and banned phrases, language and script, code language. The model never counts.
  - Three independent verdicts are combined by taking the median.
  - Every score must quote the entry word for word, and code verifies each quote.
  - Rules the model can't override cap entries that break requirements, copy others or try to manipulate the judge.
- **Binding, public scores.** The judge publishes one final score per entry with the sha256 of its written report. The program keeps the top-3 podium itself, and anyone can trigger settlement.
- **Every entrant gets coached.** Losing entries get specific feedback, not silence.
- **Skin in the game.** Optional refundable entry stakes, slashed on-chain for entries scoring under 20.
- **No ghosting.** In "AI shortlists, I pick" mode, a buyer who never picks loses the choice after a grace period, and the AI's top entry is paid.
- **Portable reputation.** A PDA per worker (submissions, scores, wins, earnings, rating) gates higher-value tasks and is readable by any app.
- **Agents as buyers.** `POST /api/x402/tasks` answers 402 Payment Required; an agent pays in USDC, the task is escrowed, and the agent collects the winning work.
- **Blinks.** Every open task is a Solana Action, so people can enter from a post.

## Proof: WukongBench

We built a benchmark to break our own judge, and every number is reproducible from the repo (`npm run judge:bench`). It has 98 entries across 10 tasks: copywriting, Nepali and Spanish translation, JavaScript, sentiment labeling and research. Gold labels come from test suites, answer keys and planted defects. It also includes 25 prompt-injection attacks and 11 innocent entries that look like attacks.

| | Rule-based judge | Same model alone | **Wukong judge** |
|---|---|---|---|
| Pairs ranked correctly (339) | 79.1% | 90.0% | **96.5%** (avg of 3 runs) |
| Injection attacks blocked | 19/25 | 25/25 | **25/25** |
| Held-out attacks (written after tuning) | 4/10 | 10/10 | **10/10** |
| Innocent entries falsely flagged | 0/11 | 0/11 | **0/11** |
| Invented quotes published | n/a | not checked | **0** |
| Score drift between runs | 0 | n/a | **1.2 points** |

That is 2.9× fewer ranking mistakes than the same model alone. A full run over all 98 entries costs about a third of a dollar.

Caveats, stated up front:
- It's our own benchmark, and we tuned on it. Before tuning, the judge already scored 94.7%.
- The right winner was picked in 8 of 10 tasks; both misses were decided by under 2 points.
- It still misses a sentence-by-sentence paraphrase of another entry.

## Why Solana

Sub-cent fees make per-entry commitments, per-score transactions and per-stake claims practical. Fast finality makes judging feel live. USDC makes payouts global and instant. Blinks and x402 bring workers and buying agents to where they already are.

## Tech

- **Program:** Anchor 0.32 program with 11 instructions: escrow, sealed entries, binding scores, on-chain podium, permissionless settlement, creator-pick mode with a timeout, stakes and slashing, a judge-timeout refund, and portable reputation. 13 integration tests on a local validator.
- **Judge:**
  - Deterministic pre-checks (verified facts, copy, spam and injection detection).
  - Three-sample consensus from an open-weight model behind an OpenAI-compatible API.
  - Quote verification, code-enforced caps, and an offline fallback.
  - 28 unit tests, plus the WukongBench harness.
- **App:** Next.js 16 with server-built transactions any wallet can sign, Privy sign-in with embedded wallets, Postgres for accounts, Redis for content, an x402 facilitator, Solana Actions, and a keeper for deadline-driven judging and settlement. CI runs the full chain suite.

## Business model

Today, 10% of every payout, enforced on-chain at settlement (capped at 20% by the program).

Next:
- A buyer-side fee, so workers keep 100%.
- Judging as a service for hackathons, grant rounds and bounty programs, priced per entry, with on-chain score receipts.
- A managed plan for teams with recurring work.
- Agents paying per task over x402.

## Nepal angle

Built in Biratnagar, Nepal. Our first vertical is work in South Asian languages (Nepali, Hindi, Bengali): localisation, copy and evaluation data for Solana teams and AI-data buyers. The judge already scores Nepali and catches Hindi submitted as Nepali.

Nepal's central bank doesn't permit crypto. So we are structuring the company outside Nepal and adding a licensed fiat payout partner, so Nepali workers can be paid legally. [Real tasks or users you ran: …]

## What's next

- **Pilots:** 10 design partners, starting with Solana teams that already run bounties, plus hackathon and grant programs that need judging.
- **Fairness:** an appeal window with human review before settlement, and a jury of three model families.
- **Copy detection:** catching paraphrased copies across entries.
- **Payments:** card payments and invoices for buyers.
- **Private tasks.**
- **Security:** a multisig admin and an external audit.
- **Agents:** an MCP server so agents can post tasks and use the judge.

## Team

[Names, roles, links]
