import "./env";
import path from "node:path";
import { maskEmail, preparePreviewDatabase, previewSetupPlan } from "@/application/demo/preview-setup";
import { getConfig } from "@/infrastructure/config";
import { connect } from "@/infrastructure/db/client";

/**
 * Runs before `next build` on Vercel (`npm run vercel-build`). Does nothing outside preview builds.
 * Logs only counts, outcomes and a masked e-mail; never connection strings, full e-mails or passwords.
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
      password_refreshed:
        "Evaluation account was never used: temporary password updated from PREVIEW_ADMIN_PASSWORD and lockout cleared.",
      exists: "Evaluation account already exists and its password was changed by its user; not touched.",
      rejected: `Evaluation account NOT created: ${report.adminProblem}`,
      not_configured:
        "No evaluation account: set PREVIEW_ADMIN_EMAIL and PREVIEW_ADMIN_PASSWORD (Preview only).",
    }[report.admin];
    console.log(`[preview-setup] ${admin}`);
    if (plan.admin) console.log(`[preview-setup] Evaluation account e-mail: ${maskEmail(plan.admin.email)}`);
  } finally {
    await connection.close();
  }
}
