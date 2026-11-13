import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

interface Connection {
  db: Database;
  migrate: (migrationsFolder: string) => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Factory: picks the driver from the URL scheme so the app runs on PostgreSQL
 * (`postgres://…`) or on embedded PGlite (`pglite:<dir>` or `pglite:memory`) for
 * local development without Docker and for tests.
 */
export async function connect(databaseUrl: string): Promise<Connection> {
  if (databaseUrl.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const location = databaseUrl.slice("pglite:".length);
    const client = location === "memory" ? new PGlite() : new PGlite(location);
    const db = drizzle(client, { schema });
    return {
      db: db as unknown as Database,
      migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
      close: () => client.close(),
    };
  }
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: databaseUrl, max: 10 });
    const db = drizzle(pool, { schema });
    return {
      db: db as unknown as Database,
      migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
      close: () => pool.end(),
    };
  }
  throw new Error("DATABASE_URL must start with postgres://, postgresql:// or pglite:");
}
