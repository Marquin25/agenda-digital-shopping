import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { Brand } from "@/ui/brand";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Trocar senha", robots: { index: false } };

export default async function ChangePasswordPage() {
  const admin = await requireAdmin(undefined, { allowPendingPasswordChange: true });
  return (
    <main id="conteudo" className="auth-page">
      <div className="auth-card">
        <Brand tagline="Área da equipe do shopping" />
        <h1>Trocar senha</h1>
        {admin.mustChangePassword ? (
          <p className="notice notice--warning">
            Por segurança, troque a senha temporária antes de continuar.
          </p>
        ) : (
          <p>
            <Link href="/admin">← Voltar ao painel</Link>
          </p>
        )}
        <PasswordForm />
      </div>
    </main>
  );
}
