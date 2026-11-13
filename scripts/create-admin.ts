import "./env";
import path from "node:path";
import { parseArgs } from "node:util";
import { createAdminUser } from "@/application/auth/admin-auth";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { isAdminRole } from "@/domain/auth/permissions";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

/**
 * Creates a staff account. The password is read from stdin (never from arguments, files or the repo):
 *   npm run admin:create -- --name "Ana" --email ana@example.com --role administrator
 * The user must change it on first sign-in.
 */
const { values } = parseArgs({
  options: {
    name: { type: "string" },
    email: { type: "string" },
    role: { type: "string", default: "administrator" },
  },
});
if (!values.name || !values.email || !isAdminRole(values.role ?? "")) {
  console.error(
    'Usage: npm run admin:create -- --name "Name" --email user@example.com [--role administrator|editor|analyst]',
  );
  process.exit(1);
}

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString("utf8").split(/\r?\n/)[0] ?? "";
  }
  process.stdout.write("Temporary password (input hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) => {
    let password = "";
    process.stdin.on("data", (data: Buffer) => {
      for (const char of data.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          return;
        }
        if (char === "\u0003") process.exit(130);
        password = char === "\u007f" ? password.slice(0, -1) : password + char;
      }
    });
  });
}

const password = await readPassword();
const connection = await connect(getConfig().databaseUrl);
try {
  await connection.migrate(path.join(process.cwd(), "drizzle"));
  await seedReferenceData(connection.db);
  await createAdminUser(connection.db, null, {
    name: values.name,
    email: values.email,
    role: values.role as "administrator",
    temporaryPassword: password,
  });
  console.log(`Created ${values.role} ${values.email}. A password change is required on first sign-in.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection.close();
}
