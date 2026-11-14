import {
  Building2,
  CalendarRange,
  ExternalLink,
  KeyRound,
  Lightbulb,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plus,
  QrCode,
  ShoppingBag,
  Target,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ROLE_LABELS, can } from "@/domain/auth/permissions";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { AdminNav, type NavItem } from "@/ui/admin/admin-nav";
import { Brand } from "@/ui/brand";
import { ThemeToggle } from "@/ui/theme/theme-toggle";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Administração", template: "%s · Admin · Conecta Shopping" },
  robots: { index: false },
};

const icon = (Icon: typeof LayoutDashboard) => <Icon size={19} aria-hidden="true" />;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
  ).toUpperCase();
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const items: NavItem[] = [
    { href: "/admin", label: "Painel", icon: icon(LayoutDashboard) },
    { href: "/admin/eventos", label: "Eventos", icon: icon(CalendarRange) },
    ...(can(admin.role, "venues:manage")
      ? [{ href: "/admin/espacos", label: "Espaços", icon: icon(Building2) }]
      : []),
    ...(can(admin.role, "stores:manage")
      ? [{ href: "/admin/estabelecimentos", label: "Lojas", icon: icon(ShoppingBag) }]
      : []),
    ...(can(admin.role, "plans:manage")
      ? [{ href: "/admin/planejamento", label: "Planejamento", icon: icon(Target) }]
      : []),
    ...(can(admin.role, "catalog:manage")
      ? [{ href: "/admin/catalogo", label: "Catálogo", icon: icon(Lightbulb) }]
      : []),
    { href: "/admin/divulgacao", label: "Divulgação", icon: icon(QrCode) },
    { href: "/admin/avaliacoes", label: "Avaliações", icon: icon(MessageSquareText) },
    ...(can(admin.role, "users:manage")
      ? [{ href: "/admin/usuarios", label: "Usuários", icon: icon(Users) }]
      : []),
  ];
  const role = ADMIN_ROLE_LABELS[admin.role];
  const signOut = (
    <form action={logoutAction}>
      <button type="submit" className="button button--secondary">
        <LogOut size={16} aria-hidden="true" />
        Sair
      </button>
    </form>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Menu da equipe">
        <Brand href="/admin" tagline="Gestão de eventos" />
        <AdminNav items={items} />
        <div className="admin-user">
          <p className="admin-user__name">
            <span className="avatar" aria-hidden="true">
              {initials(admin.name)}
            </span>
            <span>
              {admin.name}
              <span className="admin-user__role">{role}</span>
            </span>
          </p>
          <div className="admin-user__actions">
            <Link href="/admin/senha" className="button button--link">
              <KeyRound size={16} aria-hidden="true" />
              Trocar senha
            </Link>
            {signOut}
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <p className="admin-topbar__context" style={{ margin: 0 }}>
            <Link href="/" target="_blank" rel="noopener noreferrer">
              Ver agenda pública
              <ExternalLink size={14} aria-hidden="true" style={{ marginLeft: 4, verticalAlign: "-2px" }} />
              <span className="visually-hidden"> (abre em nova aba)</span>
            </Link>
          </p>
          <div className="admin-topbar__actions">
            <ThemeToggle />
            {can(admin.role, "events:manage") && (
              <Link href="/admin/eventos/novo" className="button">
                <Plus size={18} aria-hidden="true" />
                Criar novo evento
              </Link>
            )}
            <div className="admin-topbar__mobile-user">
              <span className="avatar" title={`${admin.name} (${role})`} aria-hidden="true">
                {initials(admin.name)}
              </span>
              <span className="visually-hidden">
                {admin.name} ({role})
              </span>
              <Link href="/admin/senha" className="button button--link">
                Trocar senha
              </Link>
              {signOut}
            </div>
          </div>
        </header>
        <main id="conteudo" className="admin-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="admin-footer">
          Conecta Shopping · Plataforma de eventos e experiências. Os números do painel são agregados e sem
          dados pessoais.
        </footer>
      </div>
    </div>
  );
}
