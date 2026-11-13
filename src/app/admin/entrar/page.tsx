import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/infrastructure/web/admin-session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main id="conteudo" className="container" style={{ maxWidth: "28rem" }}>
      <p>Conecta Shopping · Administração</p>
      <h1>Entrar</h1>
      <LoginForm />
    </main>
  );
}
