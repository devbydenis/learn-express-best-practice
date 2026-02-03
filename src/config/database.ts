import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

/**
 * Prisma Client Singleton Pattern untuk Prisma v7+
 * Menggunakan adapter untuk koneksi database langsung
 */

// Extend global type untuk TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Setup PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Create adapter
const adapter = new PrismaPg(pool);

// Singleton instance dengan adapter
export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Di development, simpan instance ke global untuk reuse
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Graceful shutdown
 * Tutup database connections sebelum app shutdown
 */
async function gracefulShutdown() {
  console.log("Closing database connections...");
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown); // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // Kubernetes/Docker shutdown

export default prisma;