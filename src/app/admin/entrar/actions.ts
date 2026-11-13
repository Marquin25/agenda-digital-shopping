"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { login } from "@/application/auth/admin-auth";
import { getDb } from "@/infrastructure/db";
import { RateLimiter } from "@/infrastructure/security/rate-limiter";
import { setAdminSessionCookie } from "@/infrastructure/web/admin-session";
import { clientIp } from "@/infrastructure/web/request";
import type { FormState } from "@/ui/admin/form-state";

const loginAttemptsPerIp = new RateLimiter(20, 15 * 60 * 1000);
const GENERIC_ERROR = "E-mail ou senha incorretos, ou acesso temporariamente bloqueado.";

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!loginAttemptsPerIp.consume(clientIp(await headers()))) {
    return { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Informe e-mail e senha." };
  const result = await login(await getDb(), email, password);
  if (!result.ok) return { message: GENERIC_ERROR };
  await setAdminSessionCookie(result.token);
  redirect(result.user.mustChangePassword ? "/admin/senha" : "/admin");
}
