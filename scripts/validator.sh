#!/usr/bin/env bash
# Local Solana validator with the Wukong program preloaded at genesis.
# Usage: npm run validator   (leave running in its own terminal)
set -euo pipefail
cd "$(dirname "$0")/.."
PROGRAM_ID=$(node -e "console.log(require('./src/lib/idl/wukong.json').address)")
if [ ! -f target/deploy/wukong.so ]; then
  echo "target/deploy/wukong.so missing - run 'npm run program:build' first" >&2
  exit 1
fi
mkdir -p .anchor
exec solana-test-validator \
  --reset \
  --ledger .anchor/test-ledger \
  --bpf-program "$PROGRAM_ID" target/deploy/wukong.so \
  --quiet "$@"
