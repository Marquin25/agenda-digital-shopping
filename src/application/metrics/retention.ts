import { isNotNull, lt, or, sql } from "drizzle-orm";
import { SESSION_IDLE_MS } from "@/application/auth/admin-auth";
import { orphanBannerFiles } from "@/domain/media/banner-variants";
import { retentionCutoffs } from "@/domain/privacy/retention-policy";
import type { Database } from "@/infrastructure/db/client";
import {
  adminSessions,
  auditLog,
  engagementDaily,
  engagementDailyTotals,
  events,
  pageViewDailyTotals,
  pageViewsDaily,
} from "@/infrastructure/db/schema";
import type { FileStorage } from "@/infrastructure/storage/file-storage";

export interface RetentionResult {
  /** Device-level view rows aggregated into totals and deleted. */
  pageViewRows: number;
  /** Device-level engagement rows aggregated into totals and deleted. */
  engagementRows: number;
  expiredSessions: number;
  auditEntries: number;
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
  const { deviceMetricsBefore, auditLogBefore } = retentionCutoffs(now);
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

    return {
      pageViewRows: pageViewRows.length,
      engagementRows: engagementRows.length,
      expiredSessions: expiredSessions.length,
      auditEntries: auditEntries.length,
    };
  });
  return { ...rows, orphanBanners: await removeOrphanBanners(db, storage, now) };
}
