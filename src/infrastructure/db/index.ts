import path from "node:path";
import { getConfig } from "@/infrastructure/config";
import { connect, type Database } from "./client";

const globalForDb = globalThis as unknown as { conectaDb?: Promise<Database> };

async function open(): Promise<Database> {
  const { databaseUrl } = getConfig();
  const connection = await connect(databaseUrl);
  // Embedded PGlite has no separate migration step in development; apply pending migrations on start.
  if (databaseUrl.startsWith("pglite:")) {
    await connection.migrate(path.join(process.cwd(), "drizzle"));
  }
  return connection.db;
}

/** Process-wide database handle (cached across hot reloads in development). */
export function getDb(): Promise<Database> {
  globalForDb.conectaDb ??= open();
  return globalForDb.conectaDb;
}

export type { Database };
