import "./env";
import { applyRetention } from "@/application/metrics/retention";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

/** Daily retention job for servers with cron: `npm run retention:run` (docs/spec/04 §Retenção). */
const connection = await connect(getConfig().databaseUrl);
const result = await applyRetention(connection.db);
await connection.close();
console.log(`Retention applied: ${JSON.stringify(result)}`);
