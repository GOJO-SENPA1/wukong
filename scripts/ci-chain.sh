#!/usr/bin/env bash
# Full chain suite on a throwaway local validator (CI and local).
#  1. on-chain integration tests on a fresh validator
#  2. a second fresh validator: setup + seed + production build of the app
#  3. HTTP end-to-end test, then the x402 agent end to end
set -euo pipefail
cd "$(dirname "$0")/.."
RPC=http://127.0.0.1:8899
PORT=${PORT:-3100}
LOG=.anchor/ci
mkdir -p "$LOG"

wait_rpc() {
  for _ in $(seq 1 60); do
    curl -s -X POST -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC" | grep -q '"ok"' && return 0
    sleep 1
  done
  echo "validator did not come up" >&2; exit 1
}
start_validator() {
  bash scripts/validator.sh > "$LOG/validator-$1.log" 2>&1 &
  VALIDATOR=$!
  wait_rpc
}
stop_validator() { kill "$VALIDATOR" 2>/dev/null || true; wait "$VALIDATOR" 2>/dev/null || true; }
# The app runs in its own process group (npx spawns the actual server), so
# kill the whole group or a stale server outlives the run.
cleanup() { stop_validator; [ -n "${APP:-}" ] && kill -- -"$APP" 2>/dev/null || true; }
trap cleanup EXIT

echo "::group::program integration tests"
start_validator tests
npm test
stop_validator
echo "::endgroup::"

echo "::group::setup + seed on a fresh chain"
rm -f .data/store.json .data/deployment.json
start_validator demo
npx tsx scripts/setup.ts --cluster localnet
npx tsx scripts/seed.ts
echo "::endgroup::"

echo "::group::app"
if curl -s -o /dev/null "http://localhost:$PORT"; then
  echo "port $PORT is already in use; stop that server or set PORT" >&2; exit 1
fi
npx next build > "$LOG/build.log" 2>&1 || { tail -50 "$LOG/build.log"; exit 1; }
setsid npx next start -p "$PORT" > "$LOG/app.log" 2>&1 &
APP=$!
for _ in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT/api/state" && break; sleep 1; done
echo "::endgroup::"

echo "::group::end-to-end"
WUKONG_URL="http://localhost:$PORT" npx tsx scripts/e2e.ts
WUKONG_URL="http://localhost:$PORT" npx tsx scripts/agent-buyer.ts --auto
echo "::endgroup::"
echo "✅ chain suite passed"
