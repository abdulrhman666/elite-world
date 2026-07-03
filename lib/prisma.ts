import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  eliteWorldPrisma?: PrismaClient;
};

export function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when Prisma is selected.");
  }

  if (!globalForPrisma.eliteWorldPrisma) {
    globalForPrisma.eliteWorldPrisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        keepAlive: true,
        maxLifetimeSeconds: 300,
      }),
      transactionOptions: {
        maxWait: 15_000,
        timeout: 30_000,
      },
    });
  }

  return globalForPrisma.eliteWorldPrisma;
}
