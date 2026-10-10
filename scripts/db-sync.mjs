// Build step: bring the accounts database up to prisma/schema.prisma and make
// sure row level security is on (prisma/rls.sql). Runs only when DATABASE_URL is
// set, so local and demo builds without a database skip it. `prisma db push`
// refuses changes that would lose data, so a destructive schema edit fails the
// build instead of dropping columns.
// Opt out with WUKONG_SKIP_DB_SYNC=1.
import { execFileSync } from "node:child_process";

if (process.env.WUKONG_SKIP_DB_SYNC === "1") {
  console.log("db-sync: skipped (WUKONG_SKIP_DB_SYNC=1)");
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.log("db-sync: no DATABASE_URL, skipping");
  process.exit(0);
}
if (!process.env.DIRECT_URL) {
  // A database without its schema and row level security applied is worse than a failed build.
  console.error("db-sync: DATABASE_URL is set but DIRECT_URL isn't. Add DIRECT_URL (Supabase session pooler) or set WUKONG_SKIP_DB_SYNC=1.");
  process.exit(1);
}

/**
 * The connection to change the schema over. Supabase's direct host (db.<ref>.supabase.co)
 * only has an IPv6 address, and build machines such as Vercel's have no IPv6. When
 * DIRECT_URL points there and DATABASE_URL is the Supavisor pooler, use the pooler's
 * session mode instead: same host and user, port 5432. It speaks IPv4 and supports
 * schema changes.
 */
function syncUrl() {
  let direct, pooled;
  try {
    direct = new URL(process.env.DIRECT_URL);
    pooled = new URL(process.env.DATABASE_URL);
  } catch {
    return { url: process.env.DIRECT_URL, via: "DIRECT_URL" };
  }
  if (/^db\.[a-z0-9]+\.supabase\.co$/.test(direct.hostname) && pooled.hostname.endsWith(".pooler.supabase.com")) {
    pooled.port = "5432";
    pooled.search = "";
    return { url: pooled.toString(), via: `Supabase session pooler (${pooled.hostname}:5432)` };
  }
  return { url: process.env.DIRECT_URL, via: "DIRECT_URL" };
}

const { url, via } = syncUrl();
console.log(`db-sync: applying schema via ${via}`);
// The URL goes to Prisma through the environment, never on the command line or in the log.
const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
const run = (args) => execFileSync("npx", ["prisma", ...args], { stdio: "inherit", env });
try {
  run(["db", "push", "--skip-generate"]);
  run(["db", "execute", "--file", "prisma/rls.sql", "--schema", "prisma/schema.prisma"]);
} catch {
  console.error(
    [
      "db-sync: couldn't apply the schema (see Prisma's error above).",
      "If it says it can't reach the database server: in Supabase open Connect, copy the",
      "Session pooler string (host *.pooler.supabase.com, port 5432) into DIRECT_URL, and",
      "the Transaction pooler string (port 6543) into DATABASE_URL. Direct db.*.supabase.co",
      "hosts are IPv6-only and unreachable from Vercel builds.",
    ].join("\n"),
  );
  process.exit(1);
}
console.log("db-sync: schema and row level security applied");
