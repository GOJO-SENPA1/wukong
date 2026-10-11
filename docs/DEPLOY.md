# Deploying Wukong (devnet + a public URL)

A public deployment is what makes the demo reachable by judges and makes Blinks unfurl. Plan on about 30 minutes the first time.

The pieces: the **Solana program** (deployed once from your laptop), the **web app + keeper**, somewhere to keep **off-chain content** (briefs, entries, judge reports), and **secrets** (deployment info + server keys) as environment variables. Two ways to host the app:

- **Vercel** (section 3a): serverless. Content goes to a Redis store; the keeper runs on a cron and whenever an overdue task is viewed.
- **A container** (section 3b, Fly.io or any Docker host): one always-on machine with a volume; the keeper runs as a loop beside the app.

## 1. Deploy the program and mint demo USDC (your laptop)

Needs the Solana CLI and Anchor (`anchor --version` → 0.32.1).

```bash
anchor keys sync && npm run program:build   # your own program id
solana config set -u devnet
solana address                              # fund this with ≥ 4 SOL at https://faucet.solana.com
SOLANA_RPC_URL=<your devnet RPC> npm run setup:devnet
git add -A && git commit -m "Devnet program id"   # the synced id + IDL, so the team shares one deployment
```

Use a dedicated devnet RPC (Helius, Triton, QuickNode free tiers) for `SOLANA_RPC_URL`; the public endpoint rate-limits a judging run.

## 2. Export secrets

```bash
npx tsx scripts/faucet-key.ts   # demo deploys: give the faucet its own key + the demo mint authority
npm run export:env        # writes .data/deploy.env: deployment info, judge, gateway and faucet keys (never the admin)
```

`.data/deploy.env` holds private keys. It is gitignored. Import it as secrets; never commit it or paste it anywhere else. The admin key (program upgrade, config and mint authority) is deliberately left out: the web host never needs it. If you deployed before, delete `WUKONG_ADMIN_SECRET` from your host's env and add `WUKONG_FAUCET_SECRET` instead.

## 3a. Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) (framework: Next.js, defaults are fine). Don't deploy yet, or let the first deploy fail.
2. **Add a Redis store:** project → **Storage** → create **Upstash for Redis** (free tier is plenty) and connect it to the project. That sets `KV_URL` / `REDIS_URL`; Wukong uses either.
3. **Environment variables** (project → Settings → Environment Variables), for Production:
   - every line of `.data/deploy.env` (`WUKONG_DEPLOYMENT`, `WUKONG_JUDGE_SECRET`, `WUKONG_GATEWAY_SECRET`, `WUKONG_FAUCET_SECRET`): paste the file into the first field and Vercel splits it
   - `SOLANA_RPC_URL` = your devnet RPC
   - `WUKONG_DEMO_MODE` = `1` (judges can summon the crowd and judge; `0` for real usage)
   - `CRON_SECRET` = any long random string (required in production: `/api/cron/keeper` refuses without it)
   - `WUKONG_PUBLIC_RPC_URL` = an RPC URL browsers may use (optional; defaults to the cluster's public endpoint, so your keyed `SOLANA_RPC_URL` never reaches the browser)
   - `ANTHROPIC_API_KEY` (optional: without it the offline judge scores)
4. **Deploy** (Deployments → Redeploy), then **seed** the arena into the same Redis from your laptop:
   ```bash
   REDIS_URL="<the KV_URL / REDIS_URL value from Vercel>" SOLANA_RPC_URL=<devnet RPC> npx tsx scripts/seed.ts
   ```
5. **Check it:** `WUKONG_URL=https://<project>.vercel.app npm run demo:e2e`.

The keeper: `vercel.json` schedules `/api/cron/keeper` once a day (the most a Hobby plan allows), and every task view runs any overdue keeper work right after responding, so deadlines are honored as soon as someone looks. For exact timing, point a scheduler (a Pro-plan cron, or a free one like cron-job.org) at `GET /api/cron/keeper` with `Authorization: Bearer $CRON_SECRET` every minute. The judge and crowd routes allow up to 300 s per request.

## 3b. Fly.io (container)

```bash
fly launch --no-deploy --copy-config      # pick a unique app name; keeps fly.toml (region bom)
fly volumes create wukong_data --size 1 --region bom
fly secrets import < .data/deploy.env
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  SOLANA_RPC_URL=<your devnet RPC> \
  WUKONG_DEMO_MODE=1                       # judges can summon the crowd and judge; 0 for real usage
fly deploy
```

The container runs `scripts/start-prod.sh`: `next start` plus the keeper. `fly.toml` keeps one machine always on, because the keeper needs to run.

Seed the arena **on the server**, so the briefs and entries land on its volume:

```bash
fly ssh console -C "npx tsx scripts/seed.ts"
```

## 4. Check it

```bash
open https://<app>.fly.dev
WUKONG_URL=https://<app>.fly.dev npm run demo:e2e           # full flow against the live app
WUKONG_URL=https://<app>.fly.dev npm run agent -- --auto     # x402 agent against the live app
```

Then share a task as a Blink: open an open task → *Share as a Blink* → *Open in dial.to*, or post `https://<app>.fly.dev/tasks/<id>` on X.

## Other hosts

Any container host with a persistent volume works (Railway, Render, a VPS):

```bash
docker build -t wukong .
docker run -p 3000:3000 -v wukong-data:/data --env-file .data/deploy.env \
  -e ANTHROPIC_API_KEY=sk-ant-... -e SOLANA_RPC_URL=... -e WUKONG_DEMO_MODE=1 wukong
docker exec -it <container> npx tsx scripts/seed.ts
```

Without Redis the app keeps content in a JSON file on the volume; set `REDIS_URL` to use Redis there too.

## Environment reference

| Variable | Default | Meaning |
|---|---|---|
| `WUKONG_DEPLOYMENT` | `.data/deployment.json` | Cluster, RPC, program id, mint, judge, treasury, gateway (JSON) |
| `WUKONG_JUDGE_SECRET` / `WUKONG_GATEWAY_SECRET` / `WUKONG_FAUCET_SECRET` | `.data/keys/*.json` | Server keys as JSON byte arrays (the admin key stays off the web host) |
| `REDIS_URL` / `KV_URL` | unset → JSON file in `WUKONG_DATA_DIR` | Redis for content and the judge lock (required on Vercel) |
| `WUKONG_DATA_DIR` | `./.data` (`/data` in Docker) | Content store and judge locks when there's no Redis |
| `WUKONG_SIM_SEED` | the judge key | Seed for demo keys (simulated workers, seeded creators) that have no key file |
| `CRON_SECRET` | required in production | Bearer token `/api/cron/keeper` requires (compared in constant time) |
| `WUKONG_PUBLIC_RPC_URL` | the cluster's public RPC | The RPC URL sent to browsers |
| `SOLANA_RPC_URL` | the deployment's `rpcUrl` | Server-side RPC override |
| `ANTHROPIC_API_KEY` | unset → offline judge | Enables the Claude judge |
| `WUKONG_JUDGE_MODEL` / `WUKONG_JUDGE_EFFORT` / `WUKONG_JUDGE_CONCURRENCY` | `claude-opus-5-5` / `medium` / `8` | Judge tuning |
| `WUKONG_DEMO_MODE` | on for localnet only; `1` turns it on elsewhere; never on mainnet | Without sign-in: burner personas, the faucet button, the seeded demo tasks, simulated crowd, early close of the seeded demo companies' and x402 tasks. With sign-in (Privy + database): none of that is shown; signed-in accounts' wallets are quietly topped up with the network's test SOL (and organisations' with test USDC) when they run low |
| `KEEPER` / `KEEPER_INTERVAL_MS` | `1` / `30000` | Run the keeper loop in the container, and how often |
