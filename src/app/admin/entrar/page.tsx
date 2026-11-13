import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/infrastructure/web/admin-session";
import { Brand } from "@/ui/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main id="conteudo" className="auth-page">
      <div className="auth-card">
        <Brand tagline="Área da equipe do shopping" />
        <h1>Entrar</h1>
        <p className="hint">Acesso restrito à equipe. Visitantes não precisam de cadastro.</p>
        <LoginForm />
      </div>
    </main>
  );
}
