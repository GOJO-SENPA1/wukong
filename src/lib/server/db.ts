import { PrismaClient } from "@prisma/client";

const g = globalThis as { __wukongPrisma?: PrismaClient };

export function db(): PrismaClient {
  if (!g.__wukongPrisma) {
    g.__wukongPrisma = new PrismaClient();
  }
  return g.__wukongPrisma;
}
