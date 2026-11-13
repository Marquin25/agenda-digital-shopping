import "./env";
import path from "node:path";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

const connection = await connect(getConfig().databaseUrl);
await connection.migrate(path.join(process.cwd(), "drizzle"));
await seedReferenceData(connection.db);
await connection.close();
console.log("Migrations applied and reference data ensured.");
