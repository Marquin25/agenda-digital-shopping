import "./env";
import { applyRetention } from "@/application/metrics/retention";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";
import { createFileStorage } from "@/infrastructure/storage";

/** Daily retention job for servers with cron: `npm run retention:run` (docs/spec/04 §Retenção). */
const config = getConfig();
const connection = await connect(config.databaseUrl);
const result = await applyRetention(connection.db, createFileStorage(config.storage));
await connection.close();
console.log(`Retention applied: ${JSON.stringify(result)}`);
