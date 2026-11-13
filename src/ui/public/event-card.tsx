import Link from "next/link";
import type { EventView } from "@/application/events/event-queries";
import { formatEventWhen, formatVenue } from "@/ui/format";
import { BannerImage } from "@/ui/banner-image";
import { StatusBadge } from "@/ui/status-badge";

export function EventCard({ event, headingLevel = 3 }: { event: EventView; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="event-card">
      {event.bannerPath ? (
        <BannerImage
          className="event-card__image"
          fileName={event.bannerPath}
          alt={event.bannerAlt ?? ""}
          sizes="(min-width: 48rem) 22rem, 100vw"
          lazy
        />
      ) : (
        <div className="event-card__placeholder" aria-hidden="true">
          {event.category.name}
        </div>
      )}
      <div className="event-card__body">
        <p className="category">{event.category.name}</p>
        <Heading className="event-card__title">
          <Link href={`/eventos/${event.slug}`}>{event.title}</Link>
        </Heading>
        <p className="event-card__meta">
          <time dateTime={event.startsAt.toISOString()}>{formatEventWhen(event.startsAt, event.endsAt)}</time>
        </p>
        <p className="event-card__meta">{formatVenue(event.venue, event.locationDetail)}</p>
        {event.features.length > 0 && (
          <ul className="tags" aria-label="Acessibilidade">
            {event.features.map((f) => (
              <li key={f.slug} className="tag">
                {f.name}
              </li>
            ))}
          </ul>
        )}
        <StatusBadge status={event.status} />
      </div>
    </article>
  );
}
