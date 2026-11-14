import { CalendarDays, MapPin, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { listPublicAgenda, type EventView } from "@/application/events/event-queries";
import {
  parseSignageSettings,
  selectHighlights,
  signageAgendaUrl,
  signageEventUrl,
} from "@/domain/signage/signage";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { toUrlSearchParams } from "@/infrastructure/web/search-params";
import { BannerImage } from "@/ui/banner-image";
import { Brand } from "@/ui/brand";
import { CategoryIcon } from "@/ui/category-icon";
import { formatEventWhen, formatVenue } from "@/ui/format";
import { QrCodeSvg } from "@/ui/qr-code-svg";
import { SignageCarousel } from "@/ui/signage/signage-carousel";
import { StatusBadge } from "@/ui/status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de destaques",
  // Made for screens in the mall, not for search results.
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function HighlightSlide({ event, qrUrl }: { event: EventView; qrUrl: string }) {
  return (
    <article className="signage-slide">
      <div className="signage-slide__media">
        {event.bannerPath ? (
          <BannerImage
            className="signage-slide__image"
            fileName={event.bannerPath}
            alt={event.bannerAlt ?? ""}
            sizes="(min-width: 60rem) 60vw, 100vw"
          />
        ) : (
          <div
            className="event-hero__placeholder signage-slide__placeholder"
            data-category={event.category.slug}
            aria-hidden="true"
          >
            <CategoryIcon slug={event.category.slug} size={96} />
          </div>
        )}
      </div>
      <div className="signage-slide__body">
        <p className="signage-slide__category">
          <CategoryIcon slug={event.category.slug} size={20} />
          {event.category.name}
          {event.status === "ongoing" && <StatusBadge status={event.status} />}
        </p>
        <h2 className="signage-slide__title">{event.title}</h2>
        <p className="signage-slide__meta">
          <CalendarDays size={22} aria-hidden="true" />
          <time dateTime={event.startsAt.toISOString()}>{formatEventWhen(event.startsAt, event.endsAt)}</time>
        </p>
        <p className="signage-slide__meta">
          <MapPin size={22} aria-hidden="true" />
          {formatVenue(event.venue, event.locationDetail)}
        </p>
        <div className="signage-slide__qr">
          <QrCodeSvg
            className="signage-qr"
            value={qrUrl}
            label={`QR Code: abre “${event.title}” no celular`}
          />
          <p>
            <Smartphone size={20} aria-hidden="true" />
            Aponte a câmera do celular para ver detalhes e salvar o evento.
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * Digital signage mode (B-45): highlights for screens and kiosks, with no interaction needed.
 * It records no visitor metrics itself; visits count only when someone opens a QR, under the
 * "painel" origin and the screen name (?tela=).
 */
export default async function SignagePage({ searchParams }: { searchParams: SearchParams }) {
  const settings = parseSignageSettings(toUrlSearchParams(await searchParams));
  const baseUrl = getConfig().publicBaseUrl;
  const events = selectHighlights(await listPublicAgenda(await getDb(), settings.filters), settings.limit);

  return (
    <main id="conteudo" className="signage" tabIndex={-1}>
      <header className="signage__header">
        <Brand tagline="Agenda de eventos e experiências" />
        <h1 className="signage__title">Destaques da agenda</h1>
      </header>
      {events.length > 0 ? (
        <SignageCarousel
          intervalMs={settings.intervalMs}
          slides={events.map((event) => ({
            key: event.id,
            content: (
              <HighlightSlide event={event} qrUrl={signageEventUrl(baseUrl, event.slug, settings.screen)} />
            ),
          }))}
        />
      ) : (
        <div className="signage-empty">
          <p className="signage-empty__text">
            Nenhum evento em destaque agora. Confira a agenda completa no celular.
          </p>
          <QrCodeSvg
            className="signage-qr"
            value={signageAgendaUrl(baseUrl, settings.screen)}
            label="QR Code: abre a agenda de eventos no celular"
          />
        </div>
      )}
    </main>
  );
}
