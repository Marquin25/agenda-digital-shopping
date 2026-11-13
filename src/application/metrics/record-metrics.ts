import { eq, sql } from "drizzle-orm";
import type { TrafficChannel } from "@/domain/metrics/traffic-source";
import type { Database } from "@/infrastructure/db/client";
import { pageViewsDaily, pageViewsRawDaily, promoLinkHitsDaily } from "@/infrastructure/db/schema";

export const AGENDA_TARGET = "agenda";
export const eventTarget = (eventId: string) => `event:${eventId}`;

export interface PageView {
  targetKey: string;
  eventId: string | null;
  /** Local (mall time) calendar date, "YYYY-MM-DD". */
  day: string;
  deviceHash: string;
  channel: TrafficChannel;
  promoCode: string | null;
}

/** Records one page load: a raw (measured) count and at most one deduplicated (estimated) row per device and day. */
export async function recordPageView(db: Database, view: PageView): Promise<void> {
  await db
    .insert(pageViewsDaily)
    .values(view)
    .onConflictDoNothing({ target: [pageViewsDaily.targetKey, pageViewsDaily.day, pageViewsDaily.deviceHash] });
  await db
    .insert(pageViewsRawDaily)
    .values({ targetKey: view.targetKey, eventId: view.eventId, day: view.day, channel: view.channel, views: 1 })
    .onConflictDoUpdate({
      target: [pageViewsRawDaily.targetKey, pageViewsRawDaily.day, pageViewsRawDaily.channel],
      set: { views: sql`${pageViewsRawDaily.views} + 1` },
    });
}

export async function recordPromoLinkHit(db: Database, promoLinkId: string, day: string): Promise<void> {
  await db
    .insert(promoLinkHitsDaily)
    .values({ promoLinkId, day, hits: 1 })
    .onConflictDoUpdate({
      target: [promoLinkHitsDaily.promoLinkId, promoLinkHitsDaily.day],
      set: { hits: sql`${promoLinkHitsDaily.hits} + 1` },
    });
}

/** "Apagar meus dados deste dispositivo": removes every pseudonymised row of this device. */
export async function deleteDeviceData(db: Database, deviceHash: string): Promise<number> {
  const deleted = await db
    .delete(pageViewsDaily)
    .where(eq(pageViewsDaily.deviceHash, deviceHash))
    .returning({ day: pageViewsDaily.day });
  return deleted.length;
}
