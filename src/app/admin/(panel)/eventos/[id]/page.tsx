import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForEdit } from "@/application/events/event-queries";
import { can } from "@/domain/auth/permissions";
import { getEventStatus } from "@/domain/events/event-status";
import { toLocalDateTimeInput } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { bannerUrl } from "@/ui/banner-image";
import { StatusBadge } from "@/ui/status-badge";
import { EventForm } from "../event-form";
import { loadEventFormOptions } from "../form-options";
import { TransitionForm } from "../transition-form";

export const metadata: Metadata = { title: "Editar evento" };
export const dynamic = "force-dynamic";

const ACTION_MESSAGES: Record<string, string> = {
  publish: "Evento publicado. Ele já aparece na agenda pública.",
  cancel: "Evento cancelado. Ele aparece na agenda com o aviso de cancelamento.",
  end: "Evento encerrado.",
};

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; acao?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const { id } = await params;
  const flags = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await getDb();
  const found = await getEventForEdit(db, id);
  if (!found) notFound();
  const { event, featureIds } = found;
  const status = getEventStatus(event, new Date());
  const canManage = can(admin.role, "events:manage");
  const message = flags.salvo ? "Alterações salvas." : flags.acao ? ACTION_MESSAGES[flags.acao] : undefined;

  return (
    <>
      <p>
        <Link href="/admin/eventos">← Eventos</Link>
      </p>
      <h1>{event.title}</h1>
      <p>
        <StatusBadge status={status} />
        {event.publicationStatus !== "draft" && (
          <>
            {" · "}
            <Link href={`/eventos/${event.slug}`}>Ver página pública</Link>
          </>
        )}
        {canManage && (
          <>
            {" · "}
            <Link href={`/admin/divulgacao?evento=${event.id}`}>Links e QR de divulgação</Link>
          </>
        )}
      </p>
      {message && (
        <p className="notice notice--success" role="status">
          {message}
        </p>
      )}

      {canManage ? (
        <>
          <section aria-labelledby="acoes" className="panel" style={{ marginBottom: "1.5rem" }}>
            <h2 id="acoes">Publicação</h2>
            <div className="actions">
              {event.publicationStatus === "draft" && (
                <TransitionForm eventId={event.id} transition="publish" />
              )}
              {status === "ongoing" && <TransitionForm eventId={event.id} transition="end" />}
            </div>
            {event.publicationStatus === "published" && status !== "ended" && (
              <TransitionForm eventId={event.id} transition="cancel" />
            )}
            {event.publicationStatus === "draft" && <TransitionForm eventId={event.id} transition="delete" />}
          </section>
          <h2>Dados do evento</h2>
          <EventForm
            eventId={event.id}
            {...await loadEventFormOptions(db)}
            values={{
              title: event.title,
              description: event.description,
              startsAt: toLocalDateTimeInput(event.startsAt),
              endsAt: toLocalDateTimeInput(event.endsAt),
              venueId: event.venueId,
              locationDetail: event.locationDetail,
              categoryId: String(event.categoryId),
              featureIds,
              admissionInfo: event.admissionInfo,
              capacityMode: event.capacityMode,
              displayedCapacity: event.displayedCapacity ? String(event.displayedCapacity) : "",
              bannerAlt: event.bannerAlt ?? "",
              bannerUrl: event.bannerPath ? bannerUrl(event.bannerPath) : null,
            }}
          />
        </>
      ) : (
        <p className="notice">Seu perfil pode consultar, mas não editar eventos.</p>
      )}
    </>
  );
}
