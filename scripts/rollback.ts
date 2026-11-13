import "./env";
import path from "node:path";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";
import { rollbackLastMigration } from "@/infrastructure/db/rollback";

/** Reverts the most recent migration. Destructive: requires --yes and a backup beforehand. */
if (!process.argv.includes("--yes")) {
  console.error(
    "This drops the tables of the last migration and their data.\n" +
      "Back up the database first, then run: npm run db:rollback -- --yes",
  );
  process.exit(1);
}

const connection = await connect(getConfig().databaseUrl);
try {
  const tag = await rollbackLastMigration(connection.db, path.join(process.cwd(), "drizzle"));
  console.log(tag ? `Rolled back ${tag}.` : "No migration to roll back.");
} finally {
  await connection.close();
}
