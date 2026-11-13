import { and, asc, desc, eq, exists, gt, inArray, like, lt, ne, sql, type SQL } from "drizzle-orm";
import { getDateWindow, type AgendaFilters } from "@/domain/agenda/agenda-filters";
import { getEventStatus, type EventStatus } from "@/domain/events/event-status";
import { normalizeSearchText } from "@/domain/text/normalize";
import { startOfLocalDay, toLocalDateKey } from "@/domain/time/time-zone";
import type { Database } from "@/infrastructure/db/client";
import {
  accessibilityFeatures,
  categories,
  eventAccessibilityFeatures,
  events,
  venues,
} from "@/infrastructure/db/schema";

export interface EventView {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  endedAt: Date | null;
  status: EventStatus;
  category: { slug: string; name: string };
  venue: { name: string; floor: string; reference: string };
  locationDetail: string;
  bannerPath: string | null;
  bannerAlt: string | null;
  admissionInfo: string;
  capacityMode: "unlimited" | "first_come";
  displayedCapacity: number | null;
  icsSequence: number;
  features: { slug: string; name: string; description: string }[];
}

const effectiveEnd = sql`coalesce(${events.endedAt}, ${events.endsAt})`;

const baseSelect = {
  event: events,
  categorySlug: categories.slug,
  categoryName: categories.name,
  venueName: venues.name,
  venueFloor: venues.floor,
  venueReference: venues.reference,
};

async function loadFeatures(db: Database, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, EventView["features"]>();
  const rows = await db
    .select({
      eventId: eventAccessibilityFeatures.eventId,
      slug: accessibilityFeatures.slug,
      name: accessibilityFeatures.name,
      description: accessibilityFeatures.description,
    })
    .from(eventAccessibilityFeatures)
    .innerJoin(accessibilityFeatures, eq(accessibilityFeatures.id, eventAccessibilityFeatures.featureId))
    .where(inArray(eventAccessibilityFeatures.eventId, eventIds))
    .orderBy(asc(accessibilityFeatures.name));
  const map = new Map<string, EventView["features"]>();
  for (const { eventId, ...feature } of rows) {
    map.set(eventId, [...(map.get(eventId) ?? []), feature]);
  }
  return map;
}

type Row = { event: typeof events.$inferSelect } & Omit<
  { [K in keyof typeof baseSelect]: string },
  "event"
>;

function toView(row: Row, features: EventView["features"], now: Date): EventView {
  const e = row.event;
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    endedAt: e.endedAt,
    status: getEventStatus(e, now),
    category: { slug: row.categorySlug, name: row.categoryName },
    venue: { name: row.venueName, floor: row.venueFloor, reference: row.venueReference },
    locationDetail: e.locationDetail,
    bannerPath: e.bannerPath,
    bannerAlt: e.bannerAlt,
    admissionInfo: e.admissionInfo,
    capacityMode: e.capacityMode,
    displayedCapacity: e.displayedCapacity,
    icsSequence: e.icsSequence,
    features,
  };
}

async function hydrate(db: Database, rows: Row[], now: Date): Promise<EventView[]> {
  const features = await loadFeatures(
    db,
    rows.map((r) => r.event.id),
  );
  return rows.map((r) => toView(r, features.get(r.event.id) ?? [], now));
}

/**
 * Public agenda: published (or cancelled, shown with a notice) events that have not ended,
 * matching every selected filter (docs/spec/09 B-04, B-05).
 */
export async function listPublicAgenda(db: Database, filters: AgendaFilters, now = new Date()) {
  const conditions: SQL[] = [ne(events.publicationStatus, "draft"), gt(effectiveEnd, now)];

  if (filters.query) {
    conditions.push(like(events.searchText, `%${normalizeSearchText(filters.query).replace(/[%_\\]/g, "\\$&")}%`));
  }
  if (filters.categories.length > 0) conditions.push(inArray(categories.slug, filters.categories));
  for (const featureSlug of filters.features) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(eventAccessibilityFeatures)
          .innerJoin(accessibilityFeatures, eq(accessibilityFeatures.id, eventAccessibilityFeatures.featureId))
          .where(and(eq(eventAccessibilityFeatures.eventId, events.id), eq(accessibilityFeatures.slug, featureSlug))),
      ),
    );
  }
  const window = getDateWindow(filters.date, toLocalDateKey(now));
  if (window) {
    conditions.push(lt(events.startsAt, startOfLocalDay(window.toExclusive)));
    conditions.push(gt(effectiveEnd, startOfLocalDay(window.from)));
  }

  const rows = await db
    .select(baseSelect)
    .from(events)
    .innerJoin(categories, eq(categories.id, events.categoryId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(200);
  return hydrate(db, rows, now);
}

/** Public detail page: anything except drafts (ended events stay reachable for shared links). */
export async function getPublicEventBySlug(db: Database, slug: string, now = new Date()) {
  const rows = await db
    .select(baseSelect)
    .from(events)
    .innerJoin(categories, eq(categories.id, events.categoryId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(events.slug, slug), ne(events.publicationStatus, "draft")))
    .limit(1);
  const [view] = await hydrate(db, rows, now);
  return view ?? null;
}

export async function listAdminEvents(
  db: Database,
  options: { publicationStatus?: "draft" | "published" | "cancelled" },
  now = new Date(),
) {
  const rows = await db
    .select(baseSelect)
    .from(events)
    .innerJoin(categories, eq(categories.id, events.categoryId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(options.publicationStatus ? eq(events.publicationStatus, options.publicationStatus) : undefined)
    .orderBy(desc(events.startsAt))
    .limit(500);
  return hydrate(db, rows, now);
}

export async function getEventForEdit(db: Database, eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;
  const features = await db
    .select({ featureId: eventAccessibilityFeatures.featureId })
    .from(eventAccessibilityFeatures)
    .where(eq(eventAccessibilityFeatures.eventId, eventId));
  return { event, featureIds: features.map((f) => f.featureId) };
}
