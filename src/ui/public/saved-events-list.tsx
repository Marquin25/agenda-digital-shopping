"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import type { EventView } from "@/application/events/event-queries";
import { EventCard } from "./event-card";
import { useSavedSlugs } from "./saved-events-store";

/** Shows the upcoming events this device saved, in the order they were saved. */
export function SavedEventsList({ events }: { events: EventView[] }) {
  const { slugs, ready } = useSavedSlugs();
  if (!ready) return null;
  const bySlug = new Map(events.map((e) => [e.slug, e]));
  const saved = slugs.map((slug) => bySlug.get(slug)).filter((e): e is EventView => e !== undefined);

  return (
    <>
      <p className="result-summary" role="status">
        {saved.length === 0
          ? "Nenhum evento salvo."
          : `${saved.length} ${saved.length === 1 ? "evento salvo" : "eventos salvos"}.`}
      </p>
      {saved.length === 0 ? (
        <div className="empty-state">
          <Heart size={40} aria-hidden="true" />
          <p>
            Toque no coração de um evento para guardá-lo aqui. Eventos já encerrados saem da lista
            automaticamente.
          </p>
          <p>
            <Link href="/" className="button">
              Ver a agenda
            </Link>
          </p>
        </div>
      ) : (
        <ul className="event-list">
          {saved.map((event) => (
            <li key={event.id}>
              <EventCard event={event} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
