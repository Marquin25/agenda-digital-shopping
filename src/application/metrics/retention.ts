import { and, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { SESSION_IDLE_MS } from "@/application/auth/admin-auth";
import { deleteOldEventImports, EVENT_IMPORT_RETENTION_DAYS } from "@/application/events/event-import";
import { orphanBannerFiles } from "@/domain/media/banner-variants";
import { retentionCutoffs } from "@/domain/privacy/retention-policy";
import type { Database } from "@/infrastructure/db/client";
import {
  adminSessions,
  auditLog,
  engagementDaily,
  engagementDailyTotals,
  eventInterests,
  eventInterestTotals,
  eventRatings,
  events,
  pageViewDailyTotals,
  pageViewsDaily,
  suggestions,
} from "@/infrastructure/db/schema";
import type { FileStorage } from "@/infrastructure/storage/file-storage";

export interface RetentionResult {
  /** Device-level view rows aggregated into totals and deleted. */
  pageViewRows: number;
  /** Device-level engagement rows aggregated into totals and deleted. */
  engagementRows: number;
  expiredSessions: number;
  auditEntries: number;
  /** "Tenho interesse" rows folded into per-event totals and deleted (90 days after the event ended). */
  interestRows: number;
  /** Ratings whose device hash was cleared (90 days after the event ended). */
  ratingDeviceHashes: number;
  /** Ratings older than 2 years, deleted. */
  ratings: number;
  /** Suggestions whose device hash was cleared (30 days after sending). */
  suggestionDeviceHashes: number;
  /** Suggestions older than 2 years, deleted. */
  suggestions: number;
  /** Staged spreadsheet imports older than 7 days, deleted (B-94). */
  eventImports: number;
  /** Banner files no event references, older than the grace period, deleted from storage. */
  orphanBanners: number;
}

/** Deletes orphan banner files one by one; a failure is logged (file name only) and skipped. */
async function removeOrphanBanners(db: Database, storage: FileStorage, now: Date): Promise<number> {
  const referenced = await db
    .selectDistinct({ path: events.bannerPath })
    .from(events)
    .where(isNotNull(events.bannerPath));
  const orphans = orphanBannerFiles(
    await storage.list(),
    referenced.map((row) => row.path!),
    now,
  );
  let removed = 0;
  for (const name of orphans) {
    try {
      await storage.delete(name);
      removed++;
    } catch {
      console.error(`[retention] Could not delete orphan banner ${name}`);
    }
  }
  return removed;
}

/**
 * Daily retention job (docs/spec/04 §Retenção). Device hashes older than the retention window are
 * folded into anonymous daily totals and deleted, in one transaction, so dashboard numbers do not change.
 * Banner files left behind by failed uploads or replacements are removed afterwards (B-57).
 * Safe to run more than once a day.
 */
export async function applyRetention(
  db: Database,
  storage: FileStorage,
  now = new Date(),
): Promise<RetentionResult> {
  const cutoffs = retentionCutoffs(now);
  const { deviceMetricsBefore, auditLogBefore, ratingDeviceEventEndedBefore, ratingsBefore } = cutoffs;
  const rows = await db.transaction(async (tx) => {
    const expiredViews = lt(pageViewsDaily.day, deviceMetricsBefore);
    await tx
      .insert(pageViewDailyTotals)
      .select(
        tx
          .select({
            targetKey: pageViewsDaily.targetKey,
            eventId: pageViewsDaily.eventId,
            day: pageViewsDaily.day,
            channel: pageViewsDaily.channel,
            devices: sql<number>`count(*)::int`.as("devices"),
          })
          .from(pageViewsDaily)
          .where(expiredViews)
          .groupBy(
            pageViewsDaily.targetKey,
            pageViewsDaily.eventId,
            pageViewsDaily.day,
            pageViewsDaily.channel,
          ),
      )
      .onConflictDoUpdate({
        target: [pageViewDailyTotals.targetKey, pageViewDailyTotals.day, pageViewDailyTotals.channel],
        set: { devices: sql`${pageViewDailyTotals.devices} + excluded.devices` },
      });
    const pageViewRows = await tx
      .delete(pageViewsDaily)
      .where(expiredViews)
      .returning({ day: pageViewsDaily.day });

    const expiredEngagement = lt(engagementDaily.day, deviceMetricsBefore);
    await tx
      .insert(engagementDailyTotals)
      .select(
        tx
          .select({
            eventId: engagementDaily.eventId,
            action: engagementDaily.action,
            day: engagementDaily.day,
            devices: sql<number>`count(*)::int`.as("devices"),
          })
          .from(engagementDaily)
          .where(expiredEngagement)
          .groupBy(engagementDaily.eventId, engagementDaily.action, engagementDaily.day),
      )
      .onConflictDoUpdate({
        target: [engagementDailyTotals.eventId, engagementDailyTotals.action, engagementDailyTotals.day],
        set: { devices: sql`${engagementDailyTotals.devices} + excluded.devices` },
      });
    const engagementRows = await tx
      .delete(engagementDaily)
      .where(expiredEngagement)
      .returning({ day: engagementDaily.day });

    const expiredSessions = await tx
      .delete(adminSessions)
      .where(
        or(
          lt(adminSessions.expiresAt, now),
          lt(adminSessions.lastSeenAt, new Date(now.getTime() - SESSION_IDLE_MS)),
        ),
      )
      .returning({ id: adminSessions.id });
    const auditEntries = await tx
      .delete(auditLog)
      .where(lt(auditLog.createdAt, auditLogBefore))
      .returning({ id: auditLog.id });

    const longEnded = tx
      .select({ id: events.id })
      .from(events)
      .where(lt(sql`coalesce(${events.endedAt}, ${events.endsAt})`, ratingDeviceEventEndedBefore));
    const interestEnded = tx
      .select({ id: events.id })
      .from(events)
      .where(lt(sql`coalesce(${events.endedAt}, ${events.endsAt})`, cutoffs.interestEventEndedBefore));
    const expiredInterests = inArray(eventInterests.eventId, interestEnded);
    await tx
      .insert(eventInterestTotals)
      .select(
        tx
          .select({
            eventId: eventInterests.eventId,
            devices: sql<number>`count(*)::int`.as("devices"),
            frozenAt: sql<Date>`${now.toISOString()}::timestamptz`.as("frozen_at"),
          })
          .from(eventInterests)
          .where(expiredInterests)
          .groupBy(eventInterests.eventId),
      )
      .onConflictDoUpdate({
        target: eventInterestTotals.eventId,
        set: { devices: sql`${eventInterestTotals.devices} + excluded.devices` },
      });
    const interestRows = await tx
      .delete(eventInterests)
      .where(expiredInterests)
      .returning({ eventId: eventInterests.eventId });

    const ratingDeviceHashes = await tx
      .update(eventRatings)
      .set({ deviceHash: null })
      .where(and(isNotNull(eventRatings.deviceHash), inArray(eventRatings.eventId, longEnded)))
      .returning({ id: eventRatings.id });
    const ratings = await tx
      .delete(eventRatings)
      .where(lt(eventRatings.createdAt, ratingsBefore))
      .returning({ id: eventRatings.id });

    const suggestionDeviceHashes = await tx
      .update(suggestions)
      .set({ deviceHash: null })
      .where(
        and(isNotNull(suggestions.deviceHash), lt(suggestions.createdAt, cutoffs.suggestionDeviceBefore)),
      )
      .returning({ id: suggestions.id });
    const deletedSuggestions = await tx
      .delete(suggestions)
      .where(lt(suggestions.createdAt, cutoffs.suggestionsBefore))
      .returning({ id: suggestions.id });

    return {
      pageViewRows: pageViewRows.length,
      engagementRows: engagementRows.length,
      expiredSessions: expiredSessions.length,
      auditEntries: auditEntries.length,
      interestRows: interestRows.length,
      ratingDeviceHashes: ratingDeviceHashes.length,
      ratings: ratings.length,
      suggestionDeviceHashes: suggestionDeviceHashes.length,
      suggestions: deletedSuggestions.length,
    };
  });
  const eventImports = await deleteOldEventImports(
    db,
    new Date(now.getTime() - EVENT_IMPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000),
  );
  return { ...rows, eventImports, orphanBanners: await removeOrphanBanners(db, storage, now) };
}
