import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublicEventBySlug, type EventView } from "@/application/events/event-queries";
import { buildGoogleCalendarUrl } from "@/domain/calendar/ics";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { NONCE_HEADER } from "@/infrastructure/web/content-security-policy";
import { formatEventWhen, formatVenue } from "@/ui/format";
import { BannerImage, bannerUrl } from "@/ui/banner-image";
import { CalendarLinks } from "@/ui/public/calendar-links";
import { ShareButton } from "@/ui/public/share-button";
import { ViewBeacon } from "@/ui/public/view-beacon";
import { StatusBadge } from "@/ui/status-badge";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const loadEvent = cache(async (slug: string) => getPublicEventBySlug(await getDb(), slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const event = await loadEvent((await params).slug);
  if (!event) return { title: "Evento não encontrado" };
  const { publicBaseUrl } = getConfig();
  const url = `${publicBaseUrl}/eventos/${event.slug}`;
  const description = event.description.slice(0, 200);
  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      title: event.title,
      description,
      images: event.bannerPath
        ? [{ url: `${publicBaseUrl}${bannerUrl(event.bannerPath)}`, alt: event.bannerAlt ?? "" }]
        : undefined,
    },
  };
}

function structuredData(event: EventView, url: string, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    endDate: (event.endedAt ?? event.endsAt).toISOString(),
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: formatVenue(event.venue, event.locationDetail) },
    image: event.bannerPath ? [`${baseUrl}${bannerUrl(event.bannerPath)}`] : undefined,
    url,
  };
}

function capacityText(event: EventView): string | null {
  if (event.capacityMode !== "first_come") return null;
  return event.displayedCapacity
    ? `Vagas limitadas (cerca de ${event.displayedCapacity}), por ordem de chegada.`
    : "Vagas limitadas, por ordem de chegada.";
}

export default async function EventPage({ params }: { params: Params }) {
  const event = await loadEvent((await params).slug);
  if (!event) notFound();
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;
  const { publicBaseUrl } = getConfig();
  const url = `${publicBaseUrl}/eventos/${event.slug}`;
  const location = formatVenue(event.venue, event.locationDetail);
  const isOpen = event.status === "scheduled" || event.status === "ongoing";
  const capacity = capacityText(event);
  const googleUrl = buildGoogleCalendarUrl({
    id: event.id,
    title: event.title,
    description: event.description,
    location,
    url,
    startsAt: event.startsAt,
    endsAt: event.endedAt ?? event.endsAt,
    sequence: event.icsSequence,
    cancelled: false,
  });

  return (
    <>
      <ViewBeacon target="event" eventId={event.id} />
      <script
        type="application/ld+json"
        nonce={nonce}
        // JSON.stringify output with "<" escaped cannot break out of the script element.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData(event, url, publicBaseUrl)).replace(/</g, "\\u003c"),
        }}
      />
      <p>
        <Link href="/">← Voltar para a agenda</Link>
      </p>
      {event.status === "cancelled" && (
        <div className="notice notice--danger" role="note">
          <strong>Evento cancelado.</strong> Este evento não vai mais acontecer.
        </div>
      )}
      {event.status === "ended" && (
        <div className="notice" role="note">
          Este evento já foi encerrado.
        </div>
      )}
      <div className="event-detail">
        <div>
          {event.bannerPath && (
            <BannerImage
              className="event-detail__banner"
              fileName={event.bannerPath}
              alt={event.bannerAlt ?? ""}
              sizes="(min-width: 64rem) 40rem, 100vw"
            />
          )}
          <p className="category">{event.category.name}</p>
          <h1>{event.title}</h1>
          <StatusBadge status={event.status} />
          <h2 className="visually-hidden">Informações</h2>
          <dl className="facts">
            <div>
              <dt>Quando</dt>
              <dd>
                <time dateTime={event.startsAt.toISOString()}>
                  {formatEventWhen(event.startsAt, event.endsAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Onde</dt>
              <dd>
                {location}
                {event.venue.reference && <> — {event.venue.reference}</>}
              </dd>
            </div>
            {event.admissionInfo && (
              <div>
                <dt>Entrada</dt>
                <dd>{event.admissionInfo}</dd>
              </div>
            )}
            {capacity && (
              <div>
                <dt>Vagas</dt>
                <dd>{capacity}</dd>
              </div>
            )}
          </dl>
          <section className="prose" aria-labelledby="sobre">
            <h2 id="sobre">Sobre o evento</h2>
            <p>{event.description}</p>
          </section>
        </div>
        <aside className="panel" aria-label="Ações e acessibilidade">
          {isOpen && (
            <>
              <h2>Salvar e compartilhar</h2>
              <div className="actions">
                <CalendarLinks
                  eventId={event.id}
                  icsUrl={`/eventos/${event.slug}/calendario.ics`}
                  googleUrl={googleUrl}
                />
                <ShareButton eventId={event.id} title={event.title} url={url} />
              </div>
            </>
          )}
          <h2>Acessibilidade</h2>
          {event.features.length === 0 ? (
            <p>Nenhum recurso de acessibilidade informado para este evento.</p>
          ) : (
            <ul>
              {event.features.map((f) => (
                <li key={f.slug}>
                  <strong>{f.name}</strong>
                  {f.description && <> — {f.description}</>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
