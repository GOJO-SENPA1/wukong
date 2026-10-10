#!/usr/bin/env bash
# Production entrypoint: the web app and the keeper side by side. If either
# exits, the container exits so the platform restarts it.
#   KEEPER=0 to run the web app alone.
set -uo pipefail
cd "$(dirname "$0")/.."

npx next start -p "${PORT:-3000}" &
WEB=$!
PIDS="$WEB"
if [ "${KEEPER:-1}" != "0" ]; then
  npx tsx scripts/keeper.ts &
  PIDS="$PIDS $!"
fi
trap 'kill $PIDS 2>/dev/null' TERM INT EXIT
wait -n
echo "a process exited; stopping" >&2
exit 1
