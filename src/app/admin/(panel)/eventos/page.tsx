import type { Metadata } from "next";
import Link from "next/link";
import { listAdminEvents } from "@/application/events/event-queries";
import { can } from "@/domain/auth/permissions";
import { PUBLICATION_STATUSES, type PublicationStatus } from "@/domain/events/event-status";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { formatDateTime } from "@/ui/format";
import { StatusBadge } from "@/ui/status-badge";
import { ScrollableTable } from "@/ui/admin/scrollable-table";

export const metadata: Metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<PublicationStatus, string> = {
  draft: "Rascunhos",
  published: "Publicados",
  cancelled: "Cancelados",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; excluido?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const params = await searchParams;
  const status = PUBLICATION_STATUSES.find((s) => s === params.status);
  const events = await listAdminEvents(await getDb(), { publicationStatus: status });
  const canManage = can(admin.role, "events:manage");

  return (
    <>
      <div className="toolbar">
        <h1>Eventos</h1>
        {canManage && (
          <Link className="button" href="/admin/eventos/novo">
            + Novo evento
          </Link>
        )}
      </div>
      {params.excluido && (
        <p className="notice notice--success" role="status">
          Rascunho excluído.
        </p>
      )}
      <form method="get" className="toolbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="status">Status de publicação</label>
          <select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">Todos</option>
            {PUBLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FILTER_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="button button--secondary">
          Filtrar
        </button>
      </form>
      <ScrollableTable label="Eventos cadastrados">
        <table>
          <caption>{events.length} evento(s)</caption>
          <thead>
            <tr>
              <th scope="col">Título</th>
              <th scope="col">Início</th>
              <th scope="col">Categoria</th>
              <th scope="col">Espaço</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum evento.</td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    <Link href={`/admin/eventos/${e.id}`}>{e.title}</Link>
                  </th>
                  <td>{formatDateTime(e.startsAt)}</td>
                  <td>{e.category.name}</td>
                  <td>{e.venue.name}</td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollableTable>
    </>
  );
}
