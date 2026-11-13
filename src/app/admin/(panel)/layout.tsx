import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ROLE_LABELS, can } from "@/domain/auth/permissions";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { AdminNav, type NavItem } from "@/ui/admin/admin-nav";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Administração", template: "%s · Admin · Conecta Shopping" },
  robots: { index: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const items: NavItem[] = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/eventos", label: "Eventos" },
    ...(can(admin.role, "venues:manage") ? [{ href: "/admin/espacos", label: "Espaços" }] : []),
    { href: "/admin/divulgacao", label: "Divulgação" },
    ...(can(admin.role, "users:manage") ? [{ href: "/admin/usuarios", label: "Usuários" }] : []),
  ];
  return (
    <>
      <header className="admin-header">
        <div className="container">
          <strong>Conecta Shopping · Admin</strong>
          <AdminNav items={items} />
          <div className="actions" style={{ margin: 0, alignItems: "center" }}>
            <span>
              {admin.name} ({ADMIN_ROLE_LABELS[admin.role]})
            </span>
            <Link href="/admin/senha" className="button button--link" style={{ color: "inherit" }}>
              Trocar senha
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="button button--secondary">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="conteudo" className="container" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
