// Keeper loop for container hosts (see src/lib/server/keeper.ts for the rules).
//   npm run keeper                 (every 30s)
//   npm run keeper -- --once       (single pass, e.g. from cron)
// Serverless hosts call GET /api/cron/keeper on a schedule instead.
import { keeperPass } from "../src/lib/server/keeper";

const once = process.argv.includes("--once");
const INTERVAL = Number(process.env.KEEPER_INTERVAL_MS ?? 30_000);
const log = (msg: string) => console.log(`${new Date().toISOString().slice(11, 19)} ${msg}`);

async function main() {
  log(`keeper up${once ? " (single pass)" : `, every ${INTERVAL / 1000}s`}`);
  do {
    await keeperPass(log).catch((err) => log(`pass failed: ${(err as Error).message}`));
    if (!once) await new Promise((r) => setTimeout(r, INTERVAL));
  } while (!once);
  process.exit(0);
}

main();
