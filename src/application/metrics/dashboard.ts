import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  lte,
  ne,
  sql,
  type Column,
  type SQLWrapper,
} from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { getEventStatus, type EventStatus } from "@/domain/events/event-status";
import type { EngagementAction } from "@/domain/metrics/engagement";
import type { Metric } from "@/domain/metrics/metric-quality";
import type { TrafficChannel } from "@/domain/metrics/traffic-source";
import { addDaysToDateKey } from "@/domain/time/time-zone";
import { loadEventStores } from "@/application/events/event-queries";
import type { Database } from "@/infrastructure/db/client";
import {
  categories,
  engagementDaily,
  engagementDailyTotals,
  events,
  pageViewDailyTotals,
  pageViewsDaily,
  pageViewsRawDaily,
  promoLinkHitsDaily,
  promoLinks,
  venues,
} from "@/infrastructure/db/schema";
import { AGENDA_TARGET } from "./record-metrics";

export interface DashboardPeriod {
  from: string;
  to: string;
}

export interface EventViewsRow {
  eventId: string;
  title: string;
  slug: string;
  devices: number;
  pageLoads: number;
  shares: number;
  calendarIcs: number;
  calendarGoogle: number;
  categoryName: string;
  venue: { name: string; floor: string };
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  bannerPath: string | null;
  /** Names of the active participating stores. */
  stores: string[];
}

export interface DailyAgendaPoint {
  /** Local calendar date, "YYYY-MM-DD". */
  day: string;
  /** Estimated unique devices. */
  devices: number;
  /** Measured page loads, reloads included. */
  pageLoads: number;
}

export interface DashboardSummary {
  agendaVisitors: Metric;
  agendaPageLoads: Metric;
  activeEvents: Metric;
  shares: Metric;
  calendarAdds: Metric;
  interested: Metric;
  checkIns: Metric;
  ratings: Metric;
  footfall: Metric;
  sales: Metric;
  agendaDaily: DailyAgendaPoint[];
  sources: { channel: TrafficChannel; devices: number }[];
  eventViews: EventViewsRow[];
  promoLinks: { id: string; code: string; channel: string; description: string; hits: number }[];
}

const inPeriod = (column: Column, p: DashboardPeriod) => and(gte(column, p.from), lte(column, p.to));
const sumInt = (column: SQLWrapper) => sql<number>`coalesce(sum(${column}), 0)::int`;
const sumWhere = (column: SQLWrapper, condition: SQLWrapper) =>
  sql<number>`coalesce(sum(${column}) filter (where ${condition}), 0)::int`;

/**
 * Estimated unique views per page and channel in the period: recent device rows plus the totals that
 * retention aggregated from older rows (so numbers do not change when identifiers are deleted).
 */
function uniqueViews(db: Database, period: DashboardPeriod) {
  return unionAll(
    db
      .select({
        targetKey: pageViewsDaily.targetKey,
        eventId: pageViewsDaily.eventId,
        channel: pageViewsDaily.channel,
        day: pageViewsDaily.day,
        devices: sql<number>`count(*)::int`.as("devices"),
      })
      .from(pageViewsDaily)
      .where(inPeriod(pageViewsDaily.day, period))
      .groupBy(pageViewsDaily.targetKey, pageViewsDaily.eventId, pageViewsDaily.channel, pageViewsDaily.day),
    db
      .select({
        targetKey: pageViewDailyTotals.targetKey,
        eventId: pageViewDailyTotals.eventId,
        channel: pageViewDailyTotals.channel,
        day: pageViewDailyTotals.day,
        devices: sql<number>`${pageViewDailyTotals.devices}`.as("devices"),
      })
      .from(pageViewDailyTotals)
      .where(inPeriod(pageViewDailyTotals.day, period)),
  ).as("unique_views");
}

/** Estimated engagement (device-days) per event and action, recent rows plus retained totals. */
function engagementCounts(db: Database, period: DashboardPeriod) {
  return unionAll(
    db
      .select({
        eventId: engagementDaily.eventId,
        action: engagementDaily.action,
        devices: sql<number>`count(*)::int`.as("devices"),
      })
      .from(engagementDaily)
      .where(inPeriod(engagementDaily.day, period))
      .groupBy(engagementDaily.eventId, engagementDaily.action),
    db
      .select({
        eventId: engagementDailyTotals.eventId,
        action: engagementDailyTotals.action,
        devices: sql<number>`${engagementDailyTotals.devices}`.as("devices"),
      })
      .from(engagementDailyTotals)
      .where(inPeriod(engagementDailyTotals.day, period)),
  ).as("engagement_counts");
}

/** Every local date of the period, so days without visits show as zero on the chart. */
function daysOf(period: DashboardPeriod): string[] {
  const days: string[] = [];
  for (let day = period.from; day <= period.to; day = addDaysToDateKey(day, 1)) days.push(day);
  return days;
}

async function agendaDailySeries(
  db: Database,
  period: DashboardPeriod,
  views: ReturnType<typeof uniqueViews>,
): Promise<DailyAgendaPoint[]> {
  const devices = await db
    .select({ day: views.day, n: sumInt(views.devices) })
    .from(views)
    .where(eq(views.targetKey, AGENDA_TARGET))
    .groupBy(views.day);
  const loads = await db
    .select({ day: pageViewsRawDaily.day, n: sumInt(pageViewsRawDaily.views) })
    .from(pageViewsRawDaily)
    .where(and(eq(pageViewsRawDaily.targetKey, AGENDA_TARGET), inPeriod(pageViewsRawDaily.day, period)))
    .groupBy(pageViewsRawDaily.day);
  const devicesByDay = new Map(devices.map((r) => [r.day, r.n]));
  const loadsByDay = new Map(loads.map((r) => [r.day, r.n]));
  return daysOf(period).map((day) => ({
    day,
    devices: devicesByDay.get(day) ?? 0,
    pageLoads: loadsByDay.get(day) ?? 0,
  }));
}

async function withStores<T extends { eventId: string }>(
  db: Database,
  rows: T[],
): Promise<(T & { stores: string[] })[]> {
  const storeMap = await loadEventStores(
    db,
    rows.map((r) => r.eventId),
  );
  return rows.map((r) => ({ ...r, stores: (storeMap.get(r.eventId) ?? []).map((s) => s.name) }));
}

export async function getDashboardSummary(
  db: Database,
  period: DashboardPeriod,
  now = new Date(),
): Promise<DashboardSummary> {
  const views = uniqueViews(db, period);
  const engagement = engagementCounts(db, period);
  const isAction = (action: EngagementAction) => sql`${engagement.action} = ${action}`;

  const [agendaUnique] = await db
    .select({ n: sumInt(views.devices) })
    .from(views)
    .where(eq(views.targetKey, AGENDA_TARGET));

  const [agendaRaw] = await db
    .select({ n: sumInt(pageViewsRawDaily.views) })
    .from(pageViewsRawDaily)
    .where(and(eq(pageViewsRawDaily.targetKey, AGENDA_TARGET), inPeriod(pageViewsRawDaily.day, period)));

  const [active] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.publicationStatus, "published"),
        gt(sql`coalesce(${events.endedAt}, ${events.endsAt})`, now),
      ),
    );

  const agendaDaily = await agendaDailySeries(db, period, views);

  const sources = await db
    .select({ channel: views.channel, devices: sumInt(views.devices) })
    .from(views)
    .groupBy(views.channel)
    .orderBy(desc(sumInt(views.devices)), asc(views.channel));

  const [engagementTotals] = await db
    .select({
      shares: sumWhere(engagement.devices, isAction("share")),
      calendarAdds: sumWhere(
        engagement.devices,
        sql`${engagement.action} in ('calendar_ics', 'calendar_google')`,
      ),
    })
    .from(engagement);

  const uniqueByEvent = db
    .select({ eventId: views.eventId, devices: sumInt(views.devices).as("devices") })
    .from(views)
    .where(isNotNull(views.eventId))
    .groupBy(views.eventId)
    .as("unique_by_event");
  const rawByEvent = db
    .select({
      eventId: pageViewsRawDaily.eventId,
      pageLoads: sql<number>`sum(${pageViewsRawDaily.views})::int`.as("page_loads"),
    })
    .from(pageViewsRawDaily)
    .where(and(isNotNull(pageViewsRawDaily.eventId), inPeriod(pageViewsRawDaily.day, period)))
    .groupBy(pageViewsRawDaily.eventId)
    .as("raw_by_event");
  const engagementByEvent = db
    .select({
      eventId: engagement.eventId,
      shares: sumWhere(engagement.devices, isAction("share")).as("shares"),
      calendarIcs: sumWhere(engagement.devices, isAction("calendar_ics")).as("calendar_ics"),
      calendarGoogle: sumWhere(engagement.devices, isAction("calendar_google")).as("calendar_google"),
    })
    .from(engagement)
    .groupBy(engagement.eventId)
    .as("engagement_by_event");
  const eventViews = await db
    .select({
      eventId: events.id,
      title: events.title,
      slug: events.slug,
      devices: uniqueByEvent.devices,
      pageLoads: sql<number>`coalesce(${rawByEvent.pageLoads}, 0)::int`,
      shares: sql<number>`coalesce(${engagementByEvent.shares}, 0)::int`,
      calendarIcs: sql<number>`coalesce(${engagementByEvent.calendarIcs}, 0)::int`,
      calendarGoogle: sql<number>`coalesce(${engagementByEvent.calendarGoogle}, 0)::int`,
      categoryName: categories.name,
      venueName: venues.name,
      venueFloor: venues.floor,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      endedAt: events.endedAt,
      publicationStatus: events.publicationStatus,
      bannerPath: events.bannerPath,
    })
    .from(uniqueByEvent)
    .innerJoin(events, eq(events.id, uniqueByEvent.eventId))
    .innerJoin(categories, eq(categories.id, events.categoryId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(rawByEvent, eq(rawByEvent.eventId, uniqueByEvent.eventId))
    .leftJoin(engagementByEvent, eq(engagementByEvent.eventId, uniqueByEvent.eventId))
    .orderBy(desc(uniqueByEvent.devices), asc(events.title))
    .limit(50);

  const links = await db
    .select({
      id: promoLinks.id,
      code: promoLinks.code,
      channel: promoLinks.channel,
      description: promoLinks.description,
      hits: sumInt(promoLinkHitsDaily.hits),
    })
    .from(promoLinks)
    .leftJoin(
      promoLinkHitsDaily,
      and(eq(promoLinkHitsDaily.promoLinkId, promoLinks.id), inPeriod(promoLinkHitsDaily.day, period)),
    )
    .where(ne(promoLinks.active, false))
    .groupBy(promoLinks.id)
    .orderBy(desc(sumInt(promoLinkHitsDaily.hits)))
    .limit(50);

  return {
    agendaVisitors: { quality: "estimated", value: agendaUnique?.n ?? 0 },
    agendaPageLoads: { quality: "measured", value: agendaRaw?.n ?? 0 },
    activeEvents: { quality: "measured", value: active?.n ?? 0 },
    shares: { quality: "estimated", value: engagementTotals?.shares ?? 0 },
    calendarAdds: { quality: "estimated", value: engagementTotals?.calendarAdds ?? 0 },
    interested: { quality: "unavailable", reason: "“Tenho interesse” aguarda decisão de fase (P-FASE-1)." },
    checkIns: {
      quality: "unavailable",
      reason: "Check-in não habilitado: desenho antifraude pendente (P-PROD-1).",
    },
    ratings: { quality: "unavailable", reason: "Avaliações previstas para a Fase 2." },
    footfall: { quality: "unavailable", reason: "Sem integração com sensores de fluxo (Fase 3)." },
    sales: { quality: "unavailable", reason: "Sem integração com dados de vendas (Fase 3)." },
    sources: sources.map((s) => ({ channel: s.channel as TrafficChannel, devices: s.devices })),
    agendaDaily,
    eventViews: await withStores(
      db,
      eventViews.map(({ venueName, venueFloor, endedAt, publicationStatus, ...e }) => ({
        ...e,
        devices: Number(e.devices),
        venue: { name: venueName, floor: venueFloor },
        status: getEventStatus({ publicationStatus, startsAt: e.startsAt, endsAt: e.endsAt, endedAt }, now),
      })),
    ),
    promoLinks: links,
  };
}
