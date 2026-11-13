import path from "node:path";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { connect } from "@/infrastructure/db/client";

/** Fresh in-memory PostgreSQL (PGlite) with migrations and reference data applied. */
export async function createTestDb() {
  const connection = await connect("pglite:memory");
  await connection.migrate(path.join(process.cwd(), "drizzle"));
  await seedReferenceData(connection.db);
  return connection;
}
