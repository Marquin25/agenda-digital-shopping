import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql, type SQL } from "drizzle-orm";
import type { Database } from "./client";

/**
 * Drizzle only generates "up" migrations. Each migration `<tag>.sql` therefore has a hand-written
 * reverse script in `<migrations>/rollback/<tag>.sql`, using the same `--> statement-breakpoint`
 * separator. Rolling back runs that script and forgets the migration in Drizzle's journal table, so
 * `migrate` applies it again later.
 */
const JOURNAL_TABLE = sql`"drizzle"."__drizzle_migrations"`;
const BREAKPOINT = "--> statement-breakpoint";

/** Raw query rows; both drivers (PGlite and node-postgres) return them as `{ rows }`. */
export async function queryRows<T>(db: Database, query: SQL): Promise<T[]> {
  return ((await db.execute(query)) as unknown as { rows: T[] }).rows;
}

interface JournalEntry {
  tag: string;
  when: number;
}

async function appliedMigrations(db: Database): Promise<{ id: number; createdAt: number }[]> {
  const [journal] = await queryRows<{ present: boolean }>(
    db,
    sql`select to_regclass('"drizzle"."__drizzle_migrations"') is not null as present`,
  );
  if (!journal?.present) return [];
  const rows = await queryRows<{ id: number; created_at: string | number }>(
    db,
    sql`select id, created_at from ${JOURNAL_TABLE} order by created_at desc`,
  );
  return rows.map((r) => ({ id: Number(r.id), createdAt: Number(r.created_at) }));
}

/** Reverts the most recently applied migration. Returns its tag, or null when none is applied. */
export async function rollbackLastMigration(db: Database, migrationsFolder: string): Promise<string | null> {
  const [last] = await appliedMigrations(db);
  if (!last) return null;

  const journal = JSON.parse(await readFile(path.join(migrationsFolder, "meta/_journal.json"), "utf8")) as {
    entries: JournalEntry[];
  };
  const entry = journal.entries.find((e) => e.when === last.createdAt);
  if (!entry) throw new Error(`Applied migration (created_at ${last.createdAt}) is not in the journal.`);

  const script = await readFile(path.join(migrationsFolder, "rollback", `${entry.tag}.sql`), "utf8");
  const statements = script
    .split(BREAKPOINT)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);

  await db.transaction(async (tx) => {
    for (const statement of statements) await tx.execute(sql.raw(statement));
    await tx.execute(sql`delete from ${JOURNAL_TABLE} where id = ${last.id}`);
  });
  return entry.tag;
}
