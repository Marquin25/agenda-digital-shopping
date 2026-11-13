"use server";

import { redirect } from "next/navigation";
import { AuthError, changeOwnPassword } from "@/application/auth/admin-auth";
import { getDb } from "@/infrastructure/db";
import { readAdminSessionToken, requireAdmin } from "@/infrastructure/web/admin-session";
import type { FormState } from "@/ui/admin/form-state";

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin(undefined, { allowPendingPasswordChange: true });
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (next !== String(formData.get("confirmPassword") ?? "")) {
    return { fieldErrors: { confirmPassword: "A confirmação não confere com a nova senha." } };
  }
  try {
    await changeOwnPassword(await getDb(), admin.id, current, next, (await readAdminSessionToken())!);
  } catch (error) {
    if (error instanceof AuthError) return { message: error.message };
    throw error;
  }
  redirect("/admin");
}
