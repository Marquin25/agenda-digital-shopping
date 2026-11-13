import { Accessibility, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { EventView } from "@/application/events/event-queries";
import { BannerImage } from "@/ui/banner-image";
import { CategoryIcon } from "@/ui/category-icon";
import { formatEventWhen, formatVenue } from "@/ui/format";
import { StatusBadge } from "@/ui/status-badge";
import { SaveButton } from "./save-button";

export function EventCard({
  event,
  headingLevel = 3,
  featured = false,
}: {
  event: EventView;
  headingLevel?: 2 | 3;
  /** Larger card used for the first event happening today. */
  featured?: boolean;
}) {
  const Heading = `h${headingLevel}` as const;
  const showStatus = event.status === "ongoing" || event.status === "cancelled" || event.status === "ended";
  return (
    <article className={`event-card${featured ? " event-card--featured" : ""}`}>
      <div className="event-card__media">
        {event.bannerPath ? (
          <BannerImage
            className="event-card__image"
            fileName={event.bannerPath}
            alt={event.bannerAlt ?? ""}
            sizes={featured ? "(min-width: 60rem) 44rem, 100vw" : "(min-width: 48rem) 22rem, 100vw"}
            lazy={!featured}
          />
        ) : (
          <div className="event-card__placeholder" data-category={event.category.slug} aria-hidden="true">
            <CategoryIcon slug={event.category.slug} size={featured ? 64 : 48} />
          </div>
        )}
        <div className="event-card__badges">
          <span className="pill pill--overlay">
            <CategoryIcon slug={event.category.slug} size={14} />
            {event.category.name}
          </span>
        </div>
        <SaveButton slug={event.slug} title={event.title} className="icon-button--overlay event-card__save" />
      </div>
      <div className="event-card__body">
        {showStatus && (
          <div>
            <StatusBadge status={event.status} />
          </div>
        )}
        <p className="event-card__when">
          <CalendarDays size={16} aria-hidden="true" />
          <time dateTime={event.startsAt.toISOString()}>{formatEventWhen(event.startsAt, event.endsAt)}</time>
        </p>
        <Heading className="event-card__title">
          <Link href={`/eventos/${event.slug}`}>{event.title}</Link>
        </Heading>
        <p className="event-card__summary">{event.description}</p>
        {event.features.length > 0 && (
          <ul className="tags" aria-label="Acessibilidade">
            {event.features.map((f) => (
              <li key={f.slug} className="tag">
                <Accessibility size={13} aria-hidden="true" />
                {f.name}
              </li>
            ))}
          </ul>
        )}
        <div className="event-card__footer">
          <p className="event-card__venue">
            <MapPin size={16} aria-hidden="true" />
            {formatVenue(event.venue, event.locationDetail)}
          </p>
          <span className="event-card__arrow" aria-hidden="true">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
