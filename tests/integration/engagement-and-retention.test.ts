import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser, login } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { createEvent, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { getDashboardSummary } from "@/application/metrics/dashboard";
import {
  AGENDA_TARGET,
  deleteDeviceData,
  eventTarget,
  recordEngagement,
  recordPageView,
} from "@/application/metrics/record-metrics";
import { applyRetention } from "@/application/metrics/retention";
import { auditLog } from "@/infrastructure/db/schema";
import { createTestDb } from "./test-db";

// 2026-11-13 09:00 in São Paulo. Device-level rows from before 2026-10-15 are expired.
const NOW = new Date("2026-11-13T12:00:00Z");
const PERIOD = { from: "2026-09-01", to: "2026-11-30" };

describe("engagement metrics and retention", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Editor",
    email: "editor@example.test",
    role: "editor",
    temporaryPassword: "senha-de-teste-longa",
  });
  const venueId = await saveVenue(db, userId, venueInputSchema.parse({ name: "Praça", floor: "L1" }));
  const eventId = await createEvent(
    db,
    userId,
    eventInputSchema.parse({
      title: "Show de Natal",
      description: "Apresentação de músicas natalinas",
      startsAt: "2026-12-20T19:00",
      endsAt: "2026-12-20T21:00",
      venueId,
      categoryId: (await listCategories(db))[0]!.id,
      capacityMode: "unlimited",
    }),
    null,
  );
  await publishEvent(db, userId, eventId);

  const view = (deviceHash: string, day: string) =>
    recordPageView(db, {
      targetKey: eventTarget(eventId),
      eventId,
      day,
      deviceHash,
      channel: "instagram",
      promoCode: null,
    });

  it("counts each engagement action once per device and day", async () => {
    await recordEngagement(db, { eventId, deviceHash: "d1", action: "share", day: "2026-11-10" });
    await recordEngagement(db, { eventId, deviceHash: "d1", action: "share", day: "2026-11-10" });
    await recordEngagement(db, { eventId, deviceHash: "d1", action: "calendar_ics", day: "2026-11-10" });
    await recordEngagement(db, { eventId, deviceHash: "d2", action: "calendar_google", day: "2026-11-10" });
    await view("d1", "2026-11-10");

    const summary = await getDashboardSummary(db, PERIOD, NOW);
    expect(summary.shares).toEqual({ quality: "estimated", value: 1 });
    expect(summary.calendarAdds).toEqual({ quality: "estimated", value: 2 });
    expect(summary.eventViews).toEqual([
      expect.objectContaining({ eventId, devices: 1, shares: 1, calendarIcs: 1, calendarGoogle: 1 }),
    ]);
  });

  it("describes each event row with its category, venue, schedule and status", async () => {
    const [row] = (await getDashboardSummary(db, PERIOD, NOW)).eventViews;
    expect(row).toMatchObject({
      categoryName: (await listCategories(db))[0]!.name,
      venue: { name: "Praça", floor: "L1" },
      startsAt: new Date("2026-12-20T22:00:00Z"),
      endsAt: new Date("2026-12-21T00:00:00Z"),
      status: "scheduled",
      bannerPath: null,
    });
  });

  it("deletes the engagement of a device together with its views", async () => {
    expect(await deleteDeviceData(db, "d2")).toBe(1);
    expect((await getDashboardSummary(db, PERIOD, NOW)).calendarAdds).toEqual({
      quality: "estimated",
      value: 1,
    });
  });

  it("aggregates expired device rows, keeps the totals and deletes the identifiers", async () => {
    await view("old-1", "2026-10-01");
    await view("old-2", "2026-10-01");
    await recordPageView(db, {
      targetKey: AGENDA_TARGET,
      eventId: null,
      day: "2026-10-14",
      deviceHash: "old-1",
      channel: "wifi",
      promoCode: null,
    });
    await recordEngagement(db, { eventId, deviceHash: "old-1", action: "share", day: "2026-10-01" });
    const before = await getDashboardSummary(db, PERIOD, NOW);

    const result = await applyRetention(db, NOW);
    expect(result).toMatchObject({ pageViewRows: 3, engagementRows: 1 });

    // Same numbers after retention, but the identifiers are gone.
    expect(await getDashboardSummary(db, PERIOD, NOW)).toEqual(before);
    expect(await deleteDeviceData(db, "old-1")).toBe(0);
    // Recent rows (2026-11-10) are untouched.
    expect(await deleteDeviceData(db, "d1")).toBe(3);
  });

  it("is idempotent", async () => {
    const before = await getDashboardSummary(db, PERIOD, NOW);
    expect(await applyRetention(db, NOW)).toMatchObject({ pageViewRows: 0, engagementRows: 0 });
    expect(await getDashboardSummary(db, PERIOD, NOW)).toEqual(before);
  });

  it("removes expired staff sessions and audit entries older than one year", async () => {
    const stale = new Date(NOW.getTime() - 9 * 60 * 60 * 1000);
    await login(db, "editor@example.test", "senha-de-teste-longa", stale);
    await db
      .insert(auditLog)
      .values({ action: "old.entry", entity: "test", createdAt: new Date("2025-10-01") });
    expect(await applyRetention(db, NOW)).toMatchObject({ expiredSessions: 1, auditEntries: 1 });
  });
});
