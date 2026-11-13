import type { Metadata } from "next";
import { listCategories } from "@/application/catalog/catalog";
import { listAdminEvents } from "@/application/events/event-queries";
import { listPromoLinks, promoLinkUrl } from "@/application/promo/promo-links";
import { can } from "@/domain/auth/permissions";
import { TRAFFIC_CHANNEL_LABELS } from "@/domain/metrics/traffic-source";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { togglePromoLinkAction } from "./actions";
import { PromoLinkForm } from "./promo-link-form";
import { ScrollableTable } from "@/ui/admin/scrollable-table";

export const metadata: Metadata = { title: "Divulgação" };
export const dynamic = "force-dynamic";

export default async function PromoLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const db = await getDb();
  const eventFilter = (await searchParams).evento;
  const [links, events, categories] = await Promise.all([
    listPromoLinks(db),
    listAdminEvents(db, {}),
    listCategories(db),
  ]);
  const canManage = can(admin.role, "promo-links:manage");
  const { publicBaseUrl } = getConfig();
  const shown = eventFilter ? links.filter((l) => l.link.eventId === eventFilter) : links;
  const selectable = events.filter((e) => e.status !== "draft" && e.status !== "ended");

  return (
    <>
      <h1>Links e QR Codes de divulgação</h1>
      <div className="notice" role="note">
        O <strong>QR de divulgação</strong> só abre a agenda ou a página do evento e registra o canal de
        origem. Ele <strong>não registra presença</strong>. O QR de check-in é outro recurso, ainda pendente
        de aprovação.
      </div>
      {canManage && (
        <section className="panel" aria-labelledby="novo-link" style={{ marginBottom: "1.5rem" }}>
          <h2 id="novo-link">Novo link</h2>
          <PromoLinkForm
            events={selectable.map((e) => ({ id: e.id, title: e.title }))}
            categories={categories}
            defaultEventId={eventFilter && selectable.some((e) => e.id === eventFilter) ? eventFilter : null}
          />
        </section>
      )}
      <ScrollableTable label="Links de divulgação">
        <table>
          <caption>
            {shown.length} link(s){eventFilter ? " deste evento" : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">Descrição</th>
              <th scope="col">Canal</th>
              <th scope="col">Destino</th>
              <th scope="col">Link</th>
              <th scope="col">QR Code</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum link de divulgação.</td>
              </tr>
            ) : (
              shown.map(({ link, eventTitle }) => (
                <tr key={link.id}>
                  <th scope="row">{link.description}</th>
                  <td>{TRAFFIC_CHANNEL_LABELS[link.channel]}</td>
                  <td>
                    {eventTitle ?? (link.agendaQuery ? `Agenda (${link.agendaQuery})` : "Agenda completa")}
                  </td>
                  <td>
                    <code>{promoLinkUrl(publicBaseUrl, link.code)}</code>
                  </td>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG */}
                    <img
                      className="qr-preview"
                      src={`/admin/divulgacao/${link.id}/qr?formato=svg`}
                      alt={`QR Code de divulgação para ${link.description}`}
                      width={160}
                      height={160}
                    />
                    <a href={`/admin/divulgacao/${link.id}/qr?formato=png`}>Baixar PNG</a> ·{" "}
                    <a href={`/admin/divulgacao/${link.id}/qr?formato=svg&download=1`}>Baixar SVG</a>
                  </td>
                  <td>
                    {link.active ? "Ativo" : "Desativado"}
                    {canManage && (
                      <form action={togglePromoLinkAction.bind(null, link.id, !link.active)}>
                        <button type="submit" className="button button--link">
                          {link.active ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    )}
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
