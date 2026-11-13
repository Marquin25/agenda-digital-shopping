import "./env";
import path from "node:path";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { seedDemoData } from "@/application/demo/demo-seed";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

/** Demo content for local development only. Never run against production. */
const connection = await connect(getConfig().databaseUrl);
try {
  await connection.migrate(path.join(process.cwd(), "drizzle"));
  await seedReferenceData(connection.db);
  const result = await seedDemoData(connection.db);
  console.log(
    "skipped" in result
      ? "Events already exist; demo seed skipped."
      : `Demo seed created ${result.created} events (scheduled, ongoing, ended, cancelled and draft).`,
  );
} finally {
  await connection.close();
}
