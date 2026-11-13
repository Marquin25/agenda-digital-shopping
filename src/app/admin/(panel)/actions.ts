"use server";

import { redirect } from "next/navigation";
import { logout } from "@/application/auth/admin-auth";
import { getDb } from "@/infrastructure/db";
import { clearAdminSessionCookie, readAdminSessionToken } from "@/infrastructure/web/admin-session";

export async function logoutAction() {
  const token = await readAdminSessionToken();
  if (token) await logout(await getDb(), token);
  await clearAdminSessionCookie();
  redirect("/admin/entrar");
}
