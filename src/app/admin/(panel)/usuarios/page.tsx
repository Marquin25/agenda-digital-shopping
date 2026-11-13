import type { Metadata } from "next";
import { listAdminUsers } from "@/application/auth/admin-auth";
import { ADMIN_ROLE_LABELS } from "@/domain/auth/permissions";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { EditUserForm, NewUserForm } from "./user-forms";

export const metadata: Metadata = { title: "Usuários" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = await requireAdmin("users:manage");
  const users = await listAdminUsers(await getDb());
  return (
    <>
      <h1>Usuários e perfis</h1>
      <p className="hint">
        Não há cadastro aberto: só administradores criam acessos. Provedor de login definitivo pendente
        (P-AUTH-1).
      </p>
      <section className="panel" aria-labelledby="novo-usuario" style={{ marginBottom: "1.5rem" }}>
        <h2 id="novo-usuario">Novo usuário</h2>
        <NewUserForm />
      </section>
      <h2>Usuários ({users.length})</h2>
      {users.map((u) => (
        <details key={u.id} className="panel" style={{ marginBottom: "0.75rem" }}>
          <summary>
            <strong>{u.name}</strong> — {u.email} · {ADMIN_ROLE_LABELS[u.role]}
            {!u.active && " · inativo"}
            {u.mustChangePassword && " · troca de senha pendente"}
            {u.id === admin.id && " · você"}
          </summary>
          <EditUserForm user={u} />
        </details>
      ))}
    </>
  );
}
