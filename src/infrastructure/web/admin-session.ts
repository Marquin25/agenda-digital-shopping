import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser, SESSION_ABSOLUTE_MS, type AdminIdentity } from "@/application/auth/admin-auth";
import { can, type Permission } from "@/domain/auth/permissions";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";

export const ADMIN_SESSION_COOKIE = "cs_admin";

export async function setAdminSessionCookie(token: string) {
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getConfig().secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_ABSOLUTE_MS / 1000,
  });
}

export async function readAdminSessionToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function clearAdminSessionCookie() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

/** Current staff member, memoised per request. */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const token = await readAdminSessionToken();
  if (!token) return null;
  return getSessionUser(await getDb(), token);
});

/** True only for a valid staff session (not merely a leftover or forged cookie); staff traffic is not counted. */
export async function isStaffRequest(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

/**
 * Guard for admin pages and server actions. Redirects to login when signed out, to the
 * password change page on first access and to the "no permission" page otherwise.
 */
export async function requireAdmin(
  permission?: Permission,
  options: { allowPendingPasswordChange?: boolean } = {},
): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  if (admin.mustChangePassword && !options.allowPendingPasswordChange) redirect("/admin/senha");
  if (permission && !can(admin.role, permission)) redirect("/admin/sem-permissao");
  return admin;
}
