import "./env";
import path from "node:path";
import { preparePreviewDatabase, previewSetupPlan } from "@/application/demo/preview-setup";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

/**
 * Runs before `next build` on Vercel (`npm run vercel-build`). Does nothing outside preview builds.
 * Logs only counts and outcomes, never connection strings, e-mails or passwords.
 */
const plan = previewSetupPlan(process.env);
if (!plan.run) {
  console.log("[preview-setup] Not a Vercel preview build; database untouched.");
} else {
  const connection = await connect(getConfig().databaseUrl);
  try {
    await connection.migrate(path.join(process.cwd(), "drizzle"));
    const report = await preparePreviewDatabase(connection.db, plan.admin);
    console.log(
      `[preview-setup] Migrations applied; ${report.demoEvents} demo events and ${report.templates} templates created.`,
    );
    const admin = {
      created: "Evaluation account created (password change required on first sign-in).",
      exists: "Evaluation account already exists.",
      rejected: `Evaluation account NOT created: ${report.adminProblem}`,
      not_configured:
        "No evaluation account: set PREVIEW_ADMIN_EMAIL and PREVIEW_ADMIN_PASSWORD (Preview only).",
    }[report.admin];
    console.log(`[preview-setup] ${admin}`);
  } finally {
    await connection.close();
  }
}
