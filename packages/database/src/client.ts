import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://comprador:comprador@localhost:55432/comprador";

const globalForPrisma = globalThis as unknown as {
  caseroPrisma?: PrismaClient;
};

const createClient = () => {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.caseroPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.caseroPrisma = prisma;
}

export type { Prisma } from "./generated/prisma/client";
