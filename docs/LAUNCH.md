# Launching wukonghq.xyz

Part A is for you: accounts, keys and DNS (about an hour, mostly waiting on DNS). Part B is the build plan for whoever writes the code (you, or Claude Code): it turns [`design/`](../design/) into the real app.

Secrets rule for everything below: keys go into **Vercel → Project → Settings → Environment Variables** (and `.env.local` on your laptop, which git ignores). Never commit them and never paste them into a chat. Only variables starting with `NEXT_PUBLIC_` reach the browser; everything else stays on the server.

---

## Part A: accounts, keys and DNS

### 1. Domain on Vercel

1. Vercel → your project → **Settings → Domains** → add `wukonghq.xyz`, then `www.wukonghq.xyz` (let Vercel redirect www to the bare domain, or the other way round).
2. Vercel shows the DNS records to create (an `A` record for `@` and a `CNAME` for `www`). Add exactly those at the company you bought the domain from (its DNS settings page). Delete any old "parking" `A`/`CNAME` records on `@` and `www` first.
3. Wait until Vercel shows **Valid Configuration** (minutes to a few hours). HTTPS is automatic.

### 2. Supabase (the database)

Wukong uses Supabase as its Postgres database: user accounts, profiles, notifications. Sign-in itself is handled by Privy (step 3), so you don't need Supabase Auth.

1. **New project.** Name `wukong`. Region **South Asia (Mumbai)**, close to Nepal. Generate a strong database password and save it in your password manager.
2. **Run Vercel's functions in the same region:** Vercel → Settings → **Functions** → Function Region → **Mumbai (bom1)**. The app and the database then sit next to each other.
3. **Connection strings:** in Supabase click **Connect** (top of the project page) and copy two of them, replacing `[YOUR-PASSWORD]`:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL`. The app uses this one; it suits serverless functions.
   - **Direct connection** or **Session pooler** (port `5432`) → `DIRECT_URL`. Used only to run database migrations.
4. **API keys** (only needed if the code uses `supabase-js`, e.g. for file storage later): Project Settings → **API Keys** → the project URL as `NEXT_PUBLIC_SUPABASE_URL`, and the **secret** key (older dashboards call it `service_role`) as `SUPABASE_SECRET_KEY`. The secret key bypasses all security rules: server only, never `NEXT_PUBLIC_`.

Alternatively, Vercel → **Storage → Supabase** can connect a Supabase project and fill in these variables for you.

### 3. Privy (sign-in and wallets)

Privy gives users "Continue with Google" and email sign-in codes, creates a self-custodial Solana wallet for new users, and still lets crypto users connect Phantom, Solflare or Backpack.

1. Sign up at **dashboard.privy.io** and **create an app** called `Wukong` (web app).
2. **App ID and secret:** in the app's settings (Basics / App settings) copy the **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID` (safe to be public), and the **App secret** → `PRIVY_APP_SECRET` (server only).
3. **Login methods:** turn on **Email** and **Google**, plus **External wallets** with Solana selected. For launch, Privy's default Google setup works. Later you can add your own Google OAuth client so Google's consent screen says "Wukong".
4. **Embedded wallets:** enable **Solana** embedded wallets and set them to be **created on login for users without a wallet**. That is the "your wallet is ready" step in the design.
5. **Allowed domains / origins:** add `https://wukonghq.xyz`, `https://www.wukonghq.xyz`, your `https://<project>.vercel.app` URL, and `http://localhost:3000` for development. Sign-in fails on any domain not listed.
6. **Branding:** upload the logo, set the accent colour to `#E4261C` and the app name to Wukong, so the sign-in emails and dialogs match.

Privy sends the sign-in code emails itself; you don't need to wire email for login.

### 4. Email from @wukonghq.xyz

There are two different needs. Both can coexist on the same domain.

**a) App emails** ("you won 22.50 USDC", "your shortlist is ready"): use **Resend**.

1. Sign up at **resend.com** → **Domains → Add domain**. Use a subdomain such as `send.wukonghq.xyz`, so the app's sending reputation is kept separate from your personal inbox.
2. Resend shows DNS records, usually a TXT (SPF), a TXT (DKIM) and an MX on that subdomain. Add them at your domain's DNS exactly as shown and click **Verify**.
3. Add a DMARC record at your DNS: name `_dmarc`, type `TXT`, value `v=DMARC1; p=none; rua=mailto:you@wukonghq.xyz`. That improves inbox placement for everything sent from the domain.
4. **API Keys → Create** (sending access only) → `RESEND_API_KEY`. Set `EMAIL_FROM` to `Wukong <noreply@send.wukonghq.xyz>`.

**b) A personal inbox** like `hello@wukonghq.xyz` that you read and reply from: use a mailbox provider.

- **Zoho Mail** (free plan) or **Google Workspace** (paid): a real inbox. Follow their setup, which adds MX, SPF and DKIM records on the root domain.
- **Free alternative:** forward `hello@wukonghq.xyz` to your Gmail with **Cloudflare Email Routing** or **ImprovMX**. Then add it in Gmail under *Settings → Accounts → Send mail as*, so replies come from that address too.

Resend lives on `send.` and the inbox on the root domain, so their MX records don't clash.

### 5. Environment variables (all together)

Add these in Vercel (Production, plus Preview if you use preview deploys). Copy them into `.env.local` for local development.

| Variable | From | Public? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://wukonghq.xyz` | yes |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy → App ID | yes |
| `PRIVY_APP_SECRET` | Privy → App secret | **no** |
| `DATABASE_URL` | Supabase → Connect → Transaction pooler (6543) | **no** |
| `DIRECT_URL` | Supabase → Connect → Direct / Session (5432) | **no** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API Keys (only if supabase-js is used) | yes |
| `SUPABASE_SECRET_KEY` | Supabase → API Keys → secret (only if supabase-js is used) | **no** |
| `RESEND_API_KEY` | Resend → API Keys | **no** |
| `EMAIL_FROM` | `Wukong <noreply@send.wukonghq.xyz>` | no |

These are already set from the earlier deploy: `WUKONG_DEPLOYMENT`, `WUKONG_JUDGE_SECRET`, `WUKONG_GATEWAY_SECRET`, `SOLANA_RPC_URL`, `KV_URL` / `REDIS_URL`, `CRON_SECRET`, `WUKONG_DEMO_MODE`, `ANTHROPIC_API_KEY`. Replace `WUKONG_ADMIN_SECRET` with `WUKONG_FAUCET_SECRET` (see [SECURITY.md](SECURITY.md)). See [DEPLOY.md](DEPLOY.md).

For real users, set `WUKONG_DEMO_MODE=0`. That turns off the faucet, the simulated crowd and early closing, as the production design expects.

---

## Part B: build plan (design → app)

The target is [`design/`](../design/): previews in `design/previews/`, and sources in `design/screens/*.dc.html` with exact colours, type, spacing and copy. Rebuild the pages in `src/app` to match them. The on-chain program, the judge, x402, Blinks and the keeper stay as they are.

### Look

The app now runs on a dark theme, which replaces the light navy-and-paper palette in [`design/README.md`](../design/README.md). The tokens live in `src/app/globals.css`:

- **Colours:** background `#07080C`, surfaces `#0C0E14` / `#11141C` / `#181C26`, ivory text `#F1EDE4`, muted `#9B9DA6`, hairlines at 7.5% and 13% white. Vermilion `#F0412F` marks every action, champagne gold `#D8B36C` marks what's been won (rewards, first place, focus), and blue `#7383FF` marks anything verified on-chain.
- **Fonts:** Instrument Serif for headlines and numbers (italic gold for the accent words), Instrument Sans for the interface, JetBrains Mono for labels and hashes, Anton for the wordmark only. All load via `next/font/google`.
- **Surfaces:** `.card`, `.card-gold` (a gold-to-vermilion hairline for featured panels) and `.well`. Buttons are `.btn-red`, `.btn-ivory`, `.btn-line` and `.btn-dark`. `.num` is for figures and `.text-foil` for gold foil.
- **Shared components:** app bar, buttons, cards, chips, stat tiles, task row, the payout split block and the judge report.

### Auth (Privy)

- Replace the burner personas and wallet-adapter in `src/components/Providers.tsx` with `PrivyProvider`:
  - login methods: email, Google, Solana external wallets
  - Solana embedded wallets created on login
- Keep personas only behind `demoMode`.
- **Signing:** the server already builds every transaction (`/api/tx/build` → base64). The client signs it with the user's Privy Solana wallet (embedded or external) and relays it through `/api/tx/send`. Implement Privy as a `ClientSigner` (`src/lib/client/api.ts`), so the arena code stays unchanged.
- **Server routes:** verify the Privy access token on every authenticated API route with Privy's server SDK and `PRIVY_APP_SECRET`. Map the Privy user to a row in `users`. The wallet that signs must be that user's wallet.

### Database (Supabase Postgres)

Use the pooled `DATABASE_URL` from the app and `DIRECT_URL` for migrations. A typed query layer such as Drizzle or Prisma, with migrations checked into the repo.

- `users`:
  - `privy_id` (unique), `wallet` (unique Solana address), `email`, `handle` (unique, case-insensitive), `display_name`
  - `city`, `languages[]`, `skills[]`, `role` (`hire` | `work` | `both`), `company`
  - `onboarded_at`, `created_at`
- `notifications`: `user_id`, `kind`, `task`, `payload jsonb`, `created_at`, `read_at`, `emailed_at`.
- Enable Row Level Security on every table with no public policies. The app talks to the database from the server only.
- Reputation, scores and payouts stay on-chain. The database never becomes their source of truth: it only joins wallets to names, handles and preferences.
- Optional, later: move the off-chain content store (briefs, entries, reports, now in Redis via `src/lib/server/kv.ts`) into Postgres tables behind the same `Backend` interface.

### Screens → routes

| Design | Route |
|---|---|
| Landing | `/` |
| Sign in | `/signin` (Privy modal or a custom page) |
| Onboarding | `/welcome` (role → profile → wallet), shown until `onboarded_at` is set |
| Explore | `/tasks` |
| Task + entry | `/tasks/[task]` (worker view while open; results view once closed) |
| Post a task | `/tasks/new` |
| Results | `/tasks/[task]` once judged (company sees the full report table and the on-chain record) |
| Dashboard | `/dashboard` (Working / Hiring tabs) |
| Wallet | `/wallet` |
| Public profile | `/@[handle]` (rewrite to `/u/[handle]`), plus `/workers/[wallet]` redirecting to it |
| Leaderboard | `/leaderboard` |

### Product details the design assumes

- **Fees covered:** for signed-in users, the server (gateway key) is the fee payer on transactions it builds. Rate-limit per user, and only for Wukong's own instructions.
- **Emails:** send with Resend when a task you entered is judged (score, place, payout), when your task's shortlist is ready, and when your task settles. One email per event, with links to the task; respect a per-user "email me" setting.
- **Wallet page:**
  - USDC balance and in-escrow totals (from chain)
  - deposit address with a QR code
  - withdraw (server-built SPL transfer, signed by the user)
  - key export through Privy's export flow
  - card on-ramp left as the placeholder until a partner is chosen
- **Public profile:** on-chain reputation (`fetchReputation`) joined with the user row, and per-category averages from judged entries.
- **Leaderboard:** all-time from the reputation accounts; "this month" from indexed scores (needs an events table filled by the keeper).

### Done means

- [ ] Sign up with Google and with email on wukonghq.xyz; a Solana wallet appears; onboarding saves a profile with a unique handle.
- [ ] Post a task, enter it from another account, judge, payout: the full flow with real accounts, demo mode off.
- [ ] Every page matches its preview at desktop and phone width.
- [ ] `npm run typecheck`, `npm test` and `npm run ci:chain` pass; no secrets in the repo.
