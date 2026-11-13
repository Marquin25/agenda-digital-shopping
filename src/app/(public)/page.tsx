import { listAccessibilityFeatures, listCategories } from "@/application/catalog/catalog";
import { listPublicAgenda, type EventView } from "@/application/events/event-queries";
import { countActiveFilters, parseAgendaFilters } from "@/domain/agenda/agenda-filters";
import { toLocalDateKey } from "@/domain/time/time-zone";
import { getDb } from "@/infrastructure/db";
import { formatDayHeading } from "@/ui/format";
import { AgendaFiltersForm } from "@/ui/public/agenda-filters-form";
import { EventCard } from "@/ui/public/event-card";
import { ViewBeacon } from "@/ui/public/view-beacon";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toUrlSearchParams(raw: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const v of Array.isArray(value) ? value : value ? [value] : []) params.append(key, v);
  }
  return params;
}

function groupByDay(events: EventView[], now: Date) {
  const groups = new Map<string, EventView[]>();
  const todayKey = toLocalDateKey(now);
  for (const event of events) {
    // Ongoing events that started on a previous day are listed under today.
    const key = event.startsAt < now ? todayKey : toLocalDateKey(event.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()];
}

export default async function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseAgendaFilters(toUrlSearchParams(await searchParams));
  const db = await getDb();
  const now = new Date();
  const [events, categories, features] = await Promise.all([
    listPublicAgenda(db, filters, now),
    listCategories(db),
    listAccessibilityFeatures(db),
  ]);
  const todayKey = toLocalDateKey(now);
  const filtered = countActiveFilters(filters) > 0;

  return (
    <>
      <ViewBeacon target="agenda" />
      <h1>Agenda de eventos</h1>
      <p>Programação de eventos e experiências do shopping. Consulte sem cadastro.</p>

      <AgendaFiltersForm filters={filters} categories={categories} features={features} />

      <p className="result-summary" role="status">
        {events.length === 0
          ? "Nenhum evento encontrado."
          : `${events.length} ${events.length === 1 ? "evento encontrado" : "eventos encontrados"}${filtered ? " com os filtros escolhidos" : ""}.`}
      </p>

      {events.length === 0 ? (
        <div className="notice">
          {filtered ? (
            <p>Nenhum evento corresponde aos filtros. Tente remover algum filtro.</p>
          ) : (
            <p>Ainda não há eventos programados. Volte em breve!</p>
          )}
        </div>
      ) : (
        groupByDay(events, now).map(([dayKey, dayEvents]) => (
          <section className="day-group" key={dayKey} aria-labelledby={`dia-${dayKey}`}>
            <h2 id={`dia-${dayKey}`}>
              {dayKey === todayKey ? "Hoje · " : ""}
              {formatDayHeading(dayEvents[0]!.startsAt < now ? now : dayEvents[0]!.startsAt)}
            </h2>
            <ul className="event-list">
              {dayEvents.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
