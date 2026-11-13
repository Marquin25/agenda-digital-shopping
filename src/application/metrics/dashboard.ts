import { and, asc, desc, eq, gt, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import type { Metric } from "@/domain/metrics/metric-quality";
import type { TrafficChannel } from "@/domain/metrics/traffic-source";
import type { Database } from "@/infrastructure/db/client";
import { events, pageViewsDaily, pageViewsRawDaily, promoLinkHitsDaily, promoLinks } from "@/infrastructure/db/schema";
import { AGENDA_TARGET } from "./record-metrics";

export interface DashboardPeriod {
  from: string;
  to: string;
}

export interface DashboardSummary {
  agendaVisitors: Metric;
  agendaPageLoads: Metric;
  activeEvents: Metric;
  interested: Metric;
  checkIns: Metric;
  ratings: Metric;
  footfall: Metric;
  sales: Metric;
  sources: { channel: TrafficChannel; devices: number }[];
  eventViews: { eventId: string; title: string; slug: string; devices: number; pageLoads: number }[];
  promoLinks: { id: string; code: string; channel: string; description: string; hits: number }[];
}

const inPeriod = (column: typeof pageViewsDaily.day | typeof pageViewsRawDaily.day | typeof promoLinkHitsDaily.day, p: DashboardPeriod) =>
  and(gte(column, p.from), lte(column, p.to));

export async function getDashboardSummary(db: Database, period: DashboardPeriod, now = new Date()): Promise<DashboardSummary> {
  const [agendaUnique] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pageViewsDaily)
    .where(and(eq(pageViewsDaily.targetKey, AGENDA_TARGET), inPeriod(pageViewsDaily.day, period)));

  const [agendaRaw] = await db
    .select({ n: sql<number>`coalesce(sum(${pageViewsRawDaily.views}), 0)::int` })
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

  const sources = await db
    .select({ channel: pageViewsDaily.channel, devices: sql<number>`count(*)::int` })
    .from(pageViewsDaily)
    .where(inPeriod(pageViewsDaily.day, period))
    .groupBy(pageViewsDaily.channel)
    .orderBy(desc(sql`count(*)`));

  const uniqueByEvent = db
    .select({ eventId: pageViewsDaily.eventId, devices: sql<number>`count(*)::int`.as("devices") })
    .from(pageViewsDaily)
    .where(and(isNotNull(pageViewsDaily.eventId), inPeriod(pageViewsDaily.day, period)))
    .groupBy(pageViewsDaily.eventId)
    .as("unique_by_event");
  const rawByEvent = db
    .select({ eventId: pageViewsRawDaily.eventId, pageLoads: sql<number>`sum(${pageViewsRawDaily.views})::int`.as("page_loads") })
    .from(pageViewsRawDaily)
    .where(and(isNotNull(pageViewsRawDaily.eventId), inPeriod(pageViewsRawDaily.day, period)))
    .groupBy(pageViewsRawDaily.eventId)
    .as("raw_by_event");
  const eventViews = await db
    .select({
      eventId: events.id,
      title: events.title,
      slug: events.slug,
      devices: uniqueByEvent.devices,
      pageLoads: sql<number>`coalesce(${rawByEvent.pageLoads}, 0)::int`,
    })
    .from(uniqueByEvent)
    .innerJoin(events, eq(events.id, uniqueByEvent.eventId))
    .leftJoin(rawByEvent, eq(rawByEvent.eventId, uniqueByEvent.eventId))
    .orderBy(desc(uniqueByEvent.devices), asc(events.title))
    .limit(50);

  const links = await db
    .select({
      id: promoLinks.id,
      code: promoLinks.code,
      channel: promoLinks.channel,
      description: promoLinks.description,
      hits: sql<number>`coalesce(sum(${promoLinkHitsDaily.hits}), 0)::int`,
    })
    .from(promoLinks)
    .leftJoin(
      promoLinkHitsDaily,
      and(eq(promoLinkHitsDaily.promoLinkId, promoLinks.id), inPeriod(promoLinkHitsDaily.day, period)),
    )
    .where(ne(promoLinks.active, false))
    .groupBy(promoLinks.id)
    .orderBy(desc(sql`coalesce(sum(${promoLinkHitsDaily.hits}), 0)`))
    .limit(50);

  return {
    agendaVisitors: { quality: "estimated", value: agendaUnique?.n ?? 0 },
    agendaPageLoads: { quality: "measured", value: agendaRaw?.n ?? 0 },
    activeEvents: { quality: "measured", value: active?.n ?? 0 },
    interested: { quality: "unavailable", reason: "“Tenho interesse” aguarda decisão de fase (P-FASE-1)." },
    checkIns: { quality: "unavailable", reason: "Check-in não habilitado: desenho antifraude pendente (P-PROD-1)." },
    ratings: { quality: "unavailable", reason: "Avaliações previstas para a Fase 2." },
    footfall: { quality: "unavailable", reason: "Sem integração com sensores de fluxo (Fase 3)." },
    sales: { quality: "unavailable", reason: "Sem integração com dados de vendas (Fase 3)." },
    sources: sources.map((s) => ({ channel: s.channel as TrafficChannel, devices: s.devices })),
    eventViews: eventViews.map((e) => ({ ...e, devices: Number(e.devices) })),
    promoLinks: links,
  };
}
