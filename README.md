# 🐒 Wukong

[![CI](https://github.com/GOJO-SENPA1/wukong/actions/workflows/ci.yml/badge.svg)](https://github.com/GOJO-SENPA1/wukong/actions/workflows/ci.yml)

**Post a task. Summon the crowd. Pay the best.**

Wukong is a competitive work marketplace on Solana. A company posts a task and the USDC reward locks in an on-chain escrow before anyone starts. Many workers submit. An AI judge scores every entry against a public rubric and publishes each score on-chain. The program ranks the scores itself and releases escrow to the podium in one transaction. Every score, win and payout builds the worker's on-chain reputation, which any app can read.

> Like the Monkey King, who plucks a hair and summons a hundred copies of himself, a buyer gets a hundred attempts at the same task and pays only for the best one.

![Arena after settlement](docs/img/arena-settled.png)

## Why it's different

| | Fiverr / Upwork | 99designs / Kaggle | **Wukong** |
|---|---|---|---|
| Model | Hire one, hope | Many compete | Many compete |
| Who judges | Buyer | Buyer, by hand | **AI judge, public rubric, on-chain scores** |
| Verticals | Any | One each | **Any measurable work** |
| Payment | Platform holds funds | Platform holds funds | **Program-owned escrow, locked up front** |
| Reputation | Locked in the platform | Locked in the platform | **Portable PDA keyed by your wallet** |

## Where the chain is load-bearing

1. **Trustless escrow.** `create_task` moves the full reward into a vault PDA owned by the task. It can only leave to the podium, or back to the buyer if no entry clears the quality bar (score ≥ 25).
2. **Transparent, binding scores.** The judge can only publish a score per submission (with the sha256 of its full written report). The program maintains the top-3 podium itself as scores land, and `settle` is **permissionless**: the winner is a pure function of published scores, not anyone's say-so.
3. **Portable reputation.** A `Reputation` PDA per worker tracks submissions, scores, wins, podiums, earnings and a rating. Tasks can gate entry on it (`min_rating`). It outlives any front-end.
4. **Skin in the game.** Tasks can require a refundable entry stake. Honest work gets it back; entries scoring under 20 (spam, copies, prompt injection) are slashed to the treasury by a permissionless crank.
5. **No ghosting, either side.** Workers see the money locked before they start; in *AI shortlists, I pick* mode, a buyer who never picks loses the choice: after the grace period anyone can settle on the AI's top entry.
6. **Permissionless, global payouts.** Connect a wallet, compete, get USDC. No bank account, no withdrawal window.

## Demo in one command (local)

Prereqs: Node 22+, [Solana CLI](https://docs.anza.xyz/cli/install) (for `solana-test-validator`). Rust/Anchor are only needed if you change the program; a prebuilt binary ships in `artifacts/`.

```bash
npm install
npm run demo          # fresh validator + demo USDC + config + seeded history + web app
open http://localhost:3000
```

To use the real Claude judge instead of the offline heuristics, export a key first:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run judge:dryrun  # scores every demo crowd offline: sanity-check your key + rubric
```

Then in the app:

1. **Post a task** as *Himalayan Java* → pick the *cold brew tagline* template → *Lock 50 USDC & post*.
2. Switch persona (top right) to **Aarav** → *fill a sample* → *Submit*. The entry is committed on-chain by hash and stays sealed.
3. **Summon the crowd**: eight simulated workers submit real signed transactions, including a copycat, a prompt-injection attempt and spam.
4. Switch back to Himalayan Java → **Close & judge**. Watch the judge verify hashes, flag the cheaters, score every entry, publish each score on-chain, and release escrow to the podium.
5. Open the winner's profile: on-chain reputation updated, USDC in their wallet.
6. In a terminal: `npm run agent -- --auto` — an AI agent hits the API, gets **402 Payment Required**, pays in USDC with x402, and its task appears in the arena with escrow locked.

The hero task carries a 1 USDC entry stake: watch the copycat, the prompt-injection attempt and the spam bot lose theirs on-chain while everyone else gets theirs back.

Full click-by-click script and pitch: [docs/DEMO.md](docs/DEMO.md). Team plan and checklists: [docs/PLAN.md](docs/PLAN.md).

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js arena UI]
    P[Burner personas / wallet adapter]
  end
  subgraph Server[Next.js API routes]
    TX[tx/build + tx/send<br/>Solana Actions pattern]
    J[AI judge<br/>verify → integrity checks → Claude → publish]
    C[Crowd simulator]
    X[x402 gateway<br/>402 → verify → co-sign → escrow]
    S[(Content store<br/>briefs, entries, reports)]
  end
  subgraph Solana
    PR[wukong program]
    V[(Vault PDAs<br/>USDC escrow)]
    R[(Reputation PDAs)]
  end
  A[AI agent] -- HTTP + X-PAYMENT --> X
  UI --> TX --> PR
  P -. signs .-> TX
  J -- score_submission --> PR
  J -- settle --> PR
  PR --> V
  PR --> R
  J <--> S
  X --> PR
  Claude[(Claude API)] <--> J
```

**Content off-chain, commitments on-chain.** Briefs and entries are stored by the server and committed on-chain as sha256 hashes. The judge refuses to score content that doesn't match its on-chain hash. Every judge report is canonical JSON whose sha256 goes on-chain with the score; the browser re-hashes the report it's shown and displays *"report sha256 matches chain"*.

**Server-built transactions.** The browser never loads Anchor. The server turns an intent (`create_task`, `submit`, `close`, `settle_pick`, `cancel`) into an unsigned transaction, any signer (burner persona, Phantom, Solflare…) signs it, and the server relays it. This is the Solana Actions / Blinks pattern, so tasks are one step from being shareable Blinks.

### On-chain program (`programs/wukong`)

| Instruction | Who | What |
|---|---|---|
| `initialize_config` / `update_config` | admin | Judge oracle key, treasury, fee (≤ 20%), settlement mint (USDC) |
| `create_task` | creator | Locks the reward in a vault PDA. Title, category, brief hash, deadline, payout mode, judge mode, min rating, max entries |
| `submit_work` | worker | Commits a content hash and locks the entry stake, if any. One entry per worker per task. Creator can't enter. Checks rating gate |
| `close_submissions` | creator/judge anytime, anyone after deadline | Open → Judging, records `closed_at` |
| `score_submission` | judge only | Publishes a final score (0–10000) + report hash. Updates the on-chain podium and the worker's reputation. Scores can't be changed |
| `settle` | **anyone** | Once every entry is scored: pays the podium (winner-takes-all or 50/30/20) from the reward, fee to treasury. Refunds the buyer if nothing scored ≥ 25. In creator-picks mode, only after `pick_grace_secs` has passed since closing, paying the AI's top entry |
| `settle_pick` | creator | *AI shortlists, creator picks*: creator chooses the winner from the on-chain top 3 |
| `claim_stake` | **anyone** | After settlement: refunds an entry's stake (score ≥ 20) or slashes it to the treasury. The last claim closes the vault |
| `cancel_task` | creator | Full refund while there are zero entries |

Accounts: `Config` · `Task` (with the live `podium[3]`, entry stake, pick grace) · `Submission` (with its stake) · `Reputation` · vault token account per task. Rating: `+ (score − 50)` for entries above 50, `−10` for spam (< 20), `+100/+50/+25` for podium places.

### AI judge (`src/lib/server/judge`)

1. **Verify** every entry's content against its on-chain hash, and the brief against its hash.
2. **Deterministic integrity checks** (cheap, explainable, can't be sweet-talked): near-duplicate detection against earlier entries (first to commit keeps the credit), prompt-injection patterns, spam.
3. **Score** each entry in parallel with Claude (`claude-opus-5-5` by default) using structured outputs against the category rubric. Submissions are treated as untrusted data; manipulation attempts are flagged and zeroed. Server-side refusal fallbacks are on.
4. **Publish**: weighted rubric score → published integrity penalties → on-chain score + report hash, one transaction per entry as each verdict lands.
5. **Settle** immediately (AI-final mode) or wait for the creator's pick.

No API key? An offline heuristic judge (keyword/requirement checks, code checklists, labeling consensus, Nepali-vs-Hindi detection) takes over and labels every report `engine: heuristic`.

Rubrics live in [`src/lib/categories.ts`](src/lib/categories.ts): Copy & Content, Translation, Code, Data Labeling, Research.

### x402: AI agents as buyers

`POST /api/x402/tasks` with a brief and budget returns **402 Payment Required** with x402 `exact`-scheme requirements (asset USDC, payTo + feePayer = gateway). The agent signs a single USDC `TransferChecked` and retries with `X-PAYMENT`. The gateway verifies the transaction (one transfer, right mint, right amount, right destination, facilitator key appears in no instruction, capped priority fee), co-signs as fee payer, settles, and escrows the task on-chain. `GET /api/x402/tasks/:task` returns the winning work and judge summary once settled. See [`scripts/agent-buyer.ts`](scripts/agent-buyer.ts).

### Blinks (Solana Actions)

Every open task is a Blink. `/actions.json` maps `/tasks/<id>` to `/api/actions/tasks/<id>`: the GET returns a live card (reward in escrow, entries, deadline, stake, brief, and a rendered 1200×1200 image); the POST takes the worker's entry and wallet and returns the submit transaction, stake included, then chains to a completed card. Post a task's URL anywhere Blinks unfurl and workers can enter without opening the app. The arena page has a *Share as a Blink* card.

### Production mode and the keeper

`WUKONG_DEMO_MODE` defaults to on (faucet, simulated crowd, anyone may ask the judge to close a task early). Set `WUKONG_DEMO_MODE=0` for a real deployment: the demo endpoints refuse, and only the creator (on-chain) or the deadline closes submissions. Run `npm run keeper` alongside the app: it closes and judges tasks whose deadline passed, resumes interrupted judging, settles, pays the AI's pick when a creator's pick window lapses, and settles stakes. Nobody has to click anything.

## Scripts

| Command | What |
|---|---|
| `npm run demo` | Validator + setup + seed + app, one command |
| `npm run validator` | Local validator with the program preloaded |
| `npm run setup:localnet` / `setup:devnet` | Keys, demo USDC mint, config, protocol token accounts |
| `npm run seed` | Settled history, an open task with entries, a gated task |
| `npm run dev` | Web app |
| `npm test` | On-chain integration tests (needs `npm run validator`) |
| `npm run demo:e2e` | HTTP end-to-end: post → submit → crowd → judge → payout, with assertions |
| `npm run agent [-- --auto]` | x402 agent buyer |
| `npm run keeper [-- --once]` | Liveness loop: deadline judging, settlement, pick timeouts, stakes |
| `npm run ci:chain` | Everything CI runs on-chain: tests, fresh chain, production build, e2e, x402 |
| `npm run judge:dryrun` | Score all demo crowds offline |
| `npm run program:build` | `anchor build` + sync IDL/binary into the app |

## Deploy to devnet

```bash
anchor keys sync && npm run program:build   # your own program id
solana config set -u devnet                 # fund ~/.config/solana/id.json with ≥ 4 SOL (faucet.solana.com)
npm run setup:devnet                        # deploys, mints demo USDC, inits config
SOLANA_RPC_URL=<your devnet RPC> npm run seed
npm run dev
```

Server keys live in `.data/keys/` (or `WUKONG_<ROLE>_SECRET` env vars). Never commit them.

## Repo map

```
programs/wukong/        Anchor program (Rust)
artifacts/wukong.so     Prebuilt program binary for local demos
src/lib/wukong.ts       Isomorphic client: PDAs, decoding, instruction builders
src/lib/server/         Judge, crowd simulator, x402 gateway, faucet, content store
src/app/                Next.js pages + API routes
scripts/                demo, setup, seed, e2e, agent-buyer, judge-dryrun
tests/                  On-chain integration tests
docs/                   PLAN.md, DEMO.md, screenshots
```

## Status and honest limits

Built for the Colosseum hackathon; not audited. Known limits, in roadmap order:

- **Judge trust.** Scores are binding and public, but the judge key is a single oracle. Next: multi-model / multi-oracle consensus, staked judges, and a dispute window before settlement.
- **Liveness.** The keeper drives judging and settlement off-chain, but if the judge key itself goes dark, funds wait in escrow. Next: after deadline + grace, a permissionless on-chain split among entrants.
- **Content storage.** Server-side JSON store; move to Arweave/IPFS so content survives the operator.
- **Spec work.** Losers work unpaid. Today: small, well-scoped tasks, top-3 payouts by default, written coaching for every entry. Next: refinement rounds for the shortlist.

MIT licensed.
