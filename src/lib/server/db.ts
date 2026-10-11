import { PrismaClient } from "@prisma/client";

const g = globalThis as { __wukongPrisma?: PrismaClient };

/**
 * DATABASE_URL as Prisma needs it. Supabase's transaction pooler (port 6543) can't
 * hold prepared statements across transactions, so Prisma must be told it's behind
 * PgBouncer. A serverless instance can serve a few requests at once, so it gets a
 * few connections, and connecting or waiting for one is time-boxed.
 */
export function runtimeUrl(raw = process.env.DATABASE_URL): string | undefined {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") {
      if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
      if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
      if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "10");
      if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "10");
      return url.toString();
    }
  } catch {
    /* not a URL Prisma would accept either; let it report the error */
  }
  return raw;
}

export function db(): PrismaClient {
  if (!g.__wukongPrisma) {
    const url = runtimeUrl();
    g.__wukongPrisma = new PrismaClient(url ? { datasourceUrl: url } : undefined);
  }
  return g.__wukongPrisma;
}
