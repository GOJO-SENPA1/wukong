// Build step: bring the accounts database up to prisma/schema.prisma and make
// sure row level security is on (prisma/rls.sql). Runs only when DIRECT_URL is
// set (the Supabase direct connection), so local and demo builds without a
// database skip it. `prisma db push` refuses changes that would lose data, so a
// destructive schema edit fails the build instead of dropping columns.
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
  console.error("db-sync: DATABASE_URL is set but DIRECT_URL isn't. Add DIRECT_URL (Supabase direct/session connection) or set WUKONG_SKIP_DB_SYNC=1.");
  process.exit(1);
}

const run = (args) => execFileSync("npx", ["prisma", ...args], { stdio: "inherit" });
run(["db", "push", "--skip-generate"]);
run(["db", "execute", "--file", "prisma/rls.sql", "--schema", "prisma/schema.prisma"]);
console.log("db-sync: schema and row level security applied");
