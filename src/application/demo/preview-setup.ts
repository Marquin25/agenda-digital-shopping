import { eq } from "drizzle-orm";
import { AuthError, createAdminUser, resetAdminPassword } from "@/application/auth/admin-auth";
import { seedReferenceData } from "@/application/catalog/reference-data";
import { seedDemoData } from "@/application/demo/demo-seed";
import { seedExampleTemplates } from "@/application/intelligence/experience-templates";
import type { Database } from "@/infrastructure/db/client";
import { adminUsers } from "@/infrastructure/db/schema";

/**
 * Vercel preview builds prepare their own database (B-84): with the Neon integration each preview
 * deployment gets a fresh copy of the database, so migrations, fictitious demo data and the evaluation
 * account are applied at build time. Never on production or local builds.
 */
export interface EvaluationAdmin {
  email: string;
  /** Temporary password, set by the product owner as a Vercel secret; changed on first sign-in. */
  password: string;
}

export type PreviewSetupPlan = { run: false } | { run: true; admin: EvaluationAdmin | null };

export function previewSetupPlan(env: Record<string, string | undefined>): PreviewSetupPlan {
  if (env.VERCEL_ENV !== "preview") return { run: false };
  const email = env.PREVIEW_ADMIN_EMAIL?.trim();
  const password = env.PREVIEW_ADMIN_PASSWORD;
  return { run: true, admin: email && password ? { email, password } : null };
}

export interface PreviewSetupReport {
  demoEvents: number;
  templates: number;
  /**
   * `password_refreshed`: the account existed but was never used (still on its temporary password), so
   * the temporary password was replaced by the current secret and any lockout cleared. A used account is
   * never touched (`exists`).
   */
  admin: "created" | "password_refreshed" | "exists" | "rejected" | "not_configured";
  /** Why the account was rejected (never contains the password). */
  adminProblem?: string;
}

/** Idempotent: demo data and the account are created only once per database. */
export async function preparePreviewDatabase(
  db: Database,
  admin: EvaluationAdmin | null,
): Promise<PreviewSetupReport> {
  await seedReferenceData(db);
  const demo = await seedDemoData(db);
  const templates = await seedExampleTemplates(db);
  const report: PreviewSetupReport = {
    demoEvents: "created" in demo ? demo.created : 0,
    templates,
    admin: "not_configured",
  };
  if (!admin) return report;

  const [existing] = await db
    .select({ id: adminUsers.id, mustChangePassword: adminUsers.mustChangePassword })
    .from(adminUsers)
    .where(eq(adminUsers.email, admin.email.toLowerCase()))
    .limit(1);
  try {
    if (existing) {
      if (!existing.mustChangePassword) return { ...report, admin: "exists" };
      await resetAdminPassword(db, null, existing.id, admin.password);
      return { ...report, admin: "password_refreshed" };
    }
    await createAdminUser(db, null, {
      name: "Avaliação (preview)",
      email: admin.email,
      role: "administrator",
      temporaryPassword: admin.password,
    });
    return { ...report, admin: "created" };
  } catch (error) {
    if (error instanceof AuthError) return { ...report, admin: "rejected", adminProblem: error.message };
    throw error;
  }
}

/** Shows which e-mail the evaluation account uses in build logs without revealing it. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email[0]}${"*".repeat(at - 1)}${email.slice(at)}`;
}
