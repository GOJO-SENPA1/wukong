# Security

Two adversarial audits covered the whole stack: the web app and its APIs, and the on-chain program. This page lists what was found, what was fixed, how it was verified, and what still needs action on your side.

## What you need to do

1. **Upgrade the program on devnet.** The fixes in "On-chain program" below are in `programs/wukong`. Until you redeploy, devnet runs the old rules. From the machine that holds the upgrade authority (your Solana CLI wallet):
   ```bash
   npm run program:build
   solana program deploy target/deploy/wukong.so --program-id target/deploy/wukong-keypair.json -u devnet
   ```
   Account layouts are unchanged, so existing tasks keep working.
2. **Take the admin key off the web host.** Run `npx tsx scripts/faucet-key.ts` (it gives the demo faucet its own key and hands it the demo mint), then `npm run export:env`. In Vercel, delete `WUKONG_ADMIN_SECRET` and add `WUKONG_FAUCET_SECRET`.
3. **Set `CRON_SECRET`** in Vercel if it isn't set: the keeper route now refuses without it in production.
4. **Rotate the secrets that were pasted into chat** (the Supabase database password and the Privy app secret), then update `DATABASE_URL`, `DIRECT_URL` and `PRIVY_APP_SECRET` in Vercel.
5. Optional: set `WUKONG_PUBLIC_RPC_URL` to a domain-restricted RPC for browsers. Without it, browsers use the cluster's public endpoint, and your keyed `SOLANA_RPC_URL` stays server-side.

## Fixed: web app and APIs

| Severity | Issue | Fix |
|---|---|---|
| High | **x402 could drain the gateway's SOL.** A 0-unit "payment" or a dust reward made the gateway pay fees and rent for junk tasks. | Minimum reward 1 USDC, whole micro-units only. The payment may contain only a compute-unit limit (≤200k), a capped priority fee and one `TransferChecked`. Exactly two signers, no lookup tables, no ATA instructions. Per-IP rate limit. |
| High | **Demo mode failed open** (`WUKONG_DEMO_MODE=false` turned it on), and while on, anyone could close any task early to win alone. | Strict parsing (`1`/`true` only), never on mainnet, off when the deployment can't be read. The server closes early only the seeded demo companies' and x402 tasks. Everyone else's task closes by its creator's own signature or at the deadline. |
| High | **The admin key lived on the web host** (upgrade, config and mint authority). | `export:env` leaves it out. The faucet uses its own key (`scripts/faucet-key.ts`), which holds only a little SOL and the demo mint. |
| Medium | **Anyone could rewrite attribution:** rename any wallet, overwrite a task's creator, or inject fake activity rows. | `/api/names` is demo-only, capped, and first-write-wins. Briefs and stored entries are first-write-wins. The relay reads what a transaction did from the transaction itself, and records a task's author only if that transaction created it. With accounts on, names come from verified profiles. |
| Medium | **x402 took payment before validating, with no idempotency.** | Everything the program would reject (title bytes, rating range, deadline) is checked before payment. Each payment can be used once, claimed in Redis before co-signing. A failed task creation refunds the payer. |
| Medium | **The AI judge's prompt boundary could be broken.** | Brief and entry are wrapped in tags carrying a random per-request token. The injection scan normalizes Unicode and strips zero-width characters first, and catches tag breakouts. Engines are never mixed within a task: a failed Claude call leaves the entry for the next pass; a firm refusal scores it as unsafe. |
| Medium | **Unbounded writes and request bodies.** | Body size limits on every POST, entry caps, and per-IP rate limits on every route, backed by Redis so they hold across serverless instances. |
| Medium | **The paid RPC URL (with its API key) was sent to browsers.** | Browsers get `WUKONG_PUBLIC_RPC_URL` or the public endpoint; the keyed URL stays server-side. |
| Medium | **Every tab's state poll did a full chain scan, and the cron route was open without a secret.** | `/api/state` is cached for 3 s and rate-limited. Cron requires `CRON_SECRET` in production, compared in constant time. |
| Medium | **Open redirect after sign-in** (`/signin?next=/%09/evil.com`). | `next` is resolved against this origin and kept only if it stays here; control characters and backslashes are refused. |
| Low | No security headers. | CSP (still allows Privy, Turnstile and wallets), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policies, HSTS. `X-Powered-By` removed. |
| Low | Internal errors returned verbatim, and a misconfigured key could echo its first characters. | Errors that look internal are logged and replaced with a generic message. Key parsing never echoes its input. |
| Low | The judge lock could expire mid-run, and reports were recomputed. | Lock TTL raised to 45 minutes. A report computed on an earlier pass is reused. |
| Low | RLS covered only named tables; the build could skip it silently. | Every table in `public` gets RLS, grants are revoked for the anon and authenticated roles (including future tables), and the build fails if `DATABASE_URL` is set without `DIRECT_URL`. Verified locally: the anon role is denied. |
| Low | Docker image could include `.env*`; the container ran as root. | `.dockerignore` excludes them; the container runs as `node`. |

**Roles are enforced on the server, not just in the UI.** Organisations exist only by invitation: an account becomes one only through an unused `CompanyInvite` for its Privy-verified email (claimed in the same transaction that saves the profile), and its name comes from the invitation. Only organisation accounts can build or store a task. Only freelancer accounts can build or store an entry, and only for their own wallet. The judge treats an entry with no stored work as missing. Blinks refuse organisation wallets.

## Fixed: on-chain program

No critical bug was found: no unprivileged signer can redirect, double-spend or over-withdraw escrow. These design-level risks are fixed in the program (deploy it as above):

| Severity | Issue | Fix |
|---|---|---|
| High | **Slot-stuffing:** filling a small entry cap with throwaway wallets to be the only real entry. | A cap below 256 needs an entry stake of at least reward ÷ cap. The app now defaults to 256 slots. |
| Medium-high | **Creator picks their own sock-puppet:** in creator-picks mode, closing early while a favoured entry is on the shortlist. | Creators can't close creator-picks tasks early (only at the deadline or when full). |
| Medium | **The judge going dark locked funds forever.** | New permissionless `expire_judging`: 7 days after close with entries still unscored, the reward goes back to the creator. Unscored stakes are refunded. The keeper does it automatically. |
| Medium | **Cheap reputation farming with dust tasks.** | Minimum reward of 1 USDC. |
| Low-medium | The pick window ran while scoring was still going on. | The keeper starts the window from the last score. |
| Low | Unbounded deadline locked stakes. | Deadline at most 90 days away. |
| Low | Creator-picks silently ignored the top-3 split. | That combination is rejected; the form switches to winner takes all. |
| High (deploy-time) | `initialize_config` could be front-run on a fresh deploy. | `setup.ts` now aborts instead of continuing with someone else's config. |

All 13 program tests pass (18 tests in total), including new ones for each rule. The HTTP end-to-end run and the x402 agent run pass against the hardened server.

## Known, accepted

- Admin rotation, a per-task treasury snapshot and a multi-judge setup need account-layout changes: planned for the next program version. Use a multisig for the admin.
- `npm audit` reports advisories in the wallet and Prisma CLI dependency trees; none is reachable with attacker-controlled input on the server.
- Blink entries travel in the action URL, as the Blinks spec requires, so they can appear in host logs before judging.
