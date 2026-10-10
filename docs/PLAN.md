# Hackathon plan

Colosseum deadline: **Oct 12, 2026, 11:59 PM PT.** Target: Colosseum main track + Nepal track (mark *NEPAL*, attend Demo Day), stacked with Solana Ecosystem and Public Good (frame reputation as open infrastructure), plus University if the team qualifies.

## What's built (and verified)

| Piece | Status | Evidence |
|---|---|---|
| Anchor program: escrow, entries, binding scores, on-chain podium, permissionless settlement, creator-picks mode with a pick-timeout fallback, quality-bar refund, refundable entry stakes with slashing, cancel, reputation + rating gate | ✅ | 8/8 integration tests on a local validator (`npm test`) + Rust unit tests for podium ordering and payout splits |
| AI judge: hash verification, copycat/injection/spam checks, Claude structured scoring, published penalties, report hashes on-chain, auto-settle | ✅ offline engine verified end to end · ⚠️ Claude path type-checked against the SDK but not yet run with a real key | `npm run demo:e2e`, `npm run judge:dryrun` |
| Web app: landing, arena feed, post task, live arena, sealed entries, report verification, profiles, leaderboard, agents page, personas + wallet adapter | ✅ | Browser-driven run of the full hero flow; production `next build` passes |
| x402 agent buyer: 402 → X-PAYMENT → verify/co-sign/settle → escrow → result | ✅ | `npm run agent -- --auto` end to end |
| Blinks: enter (and stake on) any open task from a Solana Actions client | ✅ | GET/POST/next verified with a signed entry landing on-chain |
| Production mode + keeper: no early closes or demo endpoints when `WUKONG_DEMO_MODE=0`; deadline-driven judging, settlement, pick timeouts, stakes | ✅ | Keeper verified on a deadline-passed task and a lapsed pick window |
| One-command local demo | ✅ | `npm run demo` |
| CI: typecheck, judge dry run, build, program unit tests, full chain suite (tests + production build + e2e + x402) | ✅ locally (`npm run ci:chain`, 1m43s) | `.github/workflows/ci.yml` |
| Devnet | ⚠️ scripted, not yet run (no devnet access from the build sandbox) | `npm run setup:devnet` |

## Next 48 hours, in priority order

Cut from the bottom if time runs short. The demo moment matters more than features.

### Day 1 (Oct 10–11): make it real
1. **Run with a real Claude key.** `npm run judge:dryrun` → check every template's ranking feels right. Tune rubric guides in `src/lib/categories.ts` if not. Decide effort (`WUKONG_JUDGE_EFFORT=low|medium`) by timing a 9-entry judge run; aim for < 20 s on stage.
2. **Devnet deploy** (one person): `anchor keys sync && npm run program:build`, fund ≥ 4 SOL, `npm run setup:devnet`, `npm run seed`. Commit the synced program id + IDL. Use a dedicated RPC (Helius/Triton) via `SOLANA_RPC_URL`; public devnet RPC rate-limits.
3. **Host it** with [DEPLOY.md](DEPLOY.md): Dockerfile + `fly.toml` are ready (app + keeper in one container, volume for content, secrets from `npm run export:env`). Not Vercel serverless as-is. Run `npm run keeper` next to it. A public URL also makes the Blinks unfurl: post a task link on X and let people enter from the post.
4. **Real users.** Post 2–3 real tasks with real (devnet) rewards in your network: a Kathmandu café tagline, a Nepali translation. Real entries make the pitch.

### Day 2 (Oct 11–12): make it land
5. Record the 3-min pitch and the 2–3 min technical demo from [DEMO.md](DEMO.md).
6. Write the Colosseum submission: problem, solution, why Solana, links (repo, live app, videos), team.
7. Polish only what shows on camera.

### Stretch (only if everything above is done)
- **Refinement round:** top 3 get the judge's coaching and resubmit once (the report already contains `improvements`).
- **Multi-model judging:** score with two models, publish the mean, flag disagreements for creator review.
- **On-chain liveness refund:** permissionless split among entrants if the judge key goes dark past deadline + grace (the keeper covers operational liveness today).

Done since the first plan: entry staking, Blinks, the keeper, production mode, CI.

## Team split (if you're 3–4 people)

| Role | Owns |
|---|---|
| Chain | Devnet deploy, program changes (staking, liveness), explorer links |
| Judge | Claude prompts/rubrics, dry runs, latency, judge consistency on real entries |
| Product | UI polish, real tasks + users, hosting |
| Story | Pitch, videos, submission text, Nepal track, Q&A prep |

## Stage failure modes

| If… | Then… |
|---|---|
| Venue internet dies | Localnet needs none. The judge falls back to offline scoring automatically and says so in the UI. |
| Claude is slow | Lower `WUKONG_JUDGE_EFFORT`; judging runs in parallel (`WUKONG_JUDGE_CONCURRENCY`). |
| A tx fails mid-demo | Every step is resumable: *Resume judging* re-scores only unscored entries; settlement is permissionless. |
| Something worse | Play the backup recording. |

## Open product questions (from the original doc) and the current answer

- **First vertical?** Copy + translation. Text in, text out, reliable AI scoring, strong Nepal story.
- **One winner or ranked?** Both, per task. Default top-3 50/30/20 for worker economics.
- **How much AI vs. human?** Per task: *AI final* or *AI shortlists, creator picks*.
- **Name?** Wukong. One word, sounds like a product, built-in story (a hundred clones, pay the best one).
- **x402?** Built: agents post and pay per task over HTTP.
- **How does a company post?** Web form today; the same server-built transactions work as an API and as Blinks.
- **Worker discovery?** Feed with filters today; reputation-based matching later (the data is already on-chain).
- **Revenue?** 10% take on payouts (configurable, capped at 20% on-chain). Later: priority judging, managed briefs, reputation API.
