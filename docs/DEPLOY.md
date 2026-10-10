# Deploying Wukong (devnet + a public URL)

A public deployment is what makes the demo reachable by judges and makes Blinks unfurl. Plan on about 30 minutes the first time.

The pieces: the **Solana program** (deployed once from your laptop), the **web app + keeper** (one container), a small **volume** for off-chain content, and **secrets** (deployment info + server keys) as environment variables.

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
npm run export:env        # writes .data/deploy.env: deployment info, judge, gateway and admin keys
```

`.data/deploy.env` holds private keys. It is gitignored. Import it as secrets; never commit it or paste it anywhere else. The admin key is included because the demo faucet mints demo USDC with it (`--no-admin` for a production deploy without the faucet).

## 3. Fly.io

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

Serverless platforms (Vercel, Netlify functions) don't fit as-is: the app keeps content on disk and the keeper is a long-running process.

## Environment reference

| Variable | Default | Meaning |
|---|---|---|
| `WUKONG_DEPLOYMENT` | `.data/deployment.json` | Cluster, RPC, program id, mint, judge, treasury, gateway (JSON) |
| `WUKONG_JUDGE_SECRET` / `WUKONG_GATEWAY_SECRET` / `WUKONG_ADMIN_SECRET` | `.data/keys/*.json` | Server keys as JSON byte arrays |
| `WUKONG_DATA_DIR` | `./.data` (`/data` in Docker) | Content store, simulated-worker keys, judge locks |
| `SOLANA_RPC_URL` | the deployment's `rpcUrl` | Server-side RPC override |
| `ANTHROPIC_API_KEY` | unset → offline judge | Enables the Claude judge |
| `WUKONG_JUDGE_MODEL` / `WUKONG_JUDGE_EFFORT` / `WUKONG_JUDGE_CONCURRENCY` | `claude-opus-5-5` / `medium` / `8` | Judge tuning |
| `WUKONG_DEMO_MODE` | on for localnet only | Faucet, simulated crowd, early close by anyone |
| `KEEPER` / `KEEPER_INTERVAL_MS` | `1` / `30000` | Run the keeper in the container, and how often |
