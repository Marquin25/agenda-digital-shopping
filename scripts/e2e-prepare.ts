import "./env";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createAdminUser } from "@/application/auth/admin-auth";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { connect } from "@/infrastructure/db/client";

/** Fresh embedded database for end-to-end tests (never touches the development database). */
const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("pglite:./storage/e2e"))
  throw new Error("e2e-prepare only runs against pglite:./storage/e2e*");
await rm(url.slice("pglite:".length), { recursive: true, force: true });
// Uploads from a previous run would outlive the fresh database; clear them too (disposable dirs only).
const uploadDir = process.env.UPLOAD_DIR ?? "";
if (uploadDir.startsWith("./storage/e2e")) await rm(uploadDir, { recursive: true, force: true });
const connection = await connect(url);
await connection.migrate(path.join(process.cwd(), "drizzle"));
await seedReferenceData(connection.db);
const password = process.env.E2E_ADMIN_PASSWORD ?? "";
await createAdminUser(connection.db, null, {
  name: "Admin E2E",
  email: "admin@e2e.test",
  role: "administrator",
  temporaryPassword: password,
});
await createAdminUser(connection.db, null, {
  name: "Analista E2E",
  email: "analista@e2e.test",
  role: "analyst",
  temporaryPassword: password,
});
await connection.close();
console.log("E2E database ready.");
