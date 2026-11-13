"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AuthError,
  createAdminUser,
  resetAdminPassword,
  updateAdminUser,
} from "@/application/auth/admin-auth";
import { ADMIN_ROLES } from "@/domain/auth/permissions";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/infrastructure/auth/password";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.email("Informe um e-mail válido."),
  role: z.enum(ADMIN_ROLES, "Escolha o perfil."),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `A senha temporária precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`),
});

export async function createUserAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("users:manage");
  const parsed = newUserSchema.safeParse(
    Object.fromEntries(
      ["name", "email", "role", "temporaryPassword"].map((k) => [k, String(formData.get(k) ?? "")]),
    ),
  );
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  try {
    await createAdminUser(await getDb(), admin.id, parsed.data);
  } catch (error) {
    if (error instanceof AuthError) return { message: error.message };
    throw error;
  }
  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    message:
      "Usuário criado. Informe a senha temporária por um canal seguro; ela deverá ser trocada no primeiro acesso.",
  };
}

export async function updateUserAction(
  userId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("users:manage");
  const role = z.enum(ADMIN_ROLES).safeParse(formData.get("role"));
  const active = formData.get("active") === "on";
  const temporaryPassword = String(formData.get("temporaryPassword") ?? "");
  // Validate everything before writing, so an invalid password never leaves a half-applied update.
  const passwordProblem = temporaryPassword ? validateNewPassword(temporaryPassword) : null;
  if (passwordProblem) return { message: `Nada foi alterado. ${passwordProblem}` };
  try {
    const db = await getDb();
    await updateAdminUser(db, admin.id, userId, { role: role.success ? role.data : undefined, active });
    if (temporaryPassword) await resetAdminPassword(db, admin.id, userId, temporaryPassword);
  } catch (error) {
    if (error instanceof AuthError) return { message: error.message };
    throw error;
  }
  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    message: temporaryPassword ? "Usuário atualizado e senha redefinida." : "Usuário atualizado.",
  };
}
