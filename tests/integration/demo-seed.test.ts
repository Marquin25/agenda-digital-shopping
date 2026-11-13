import { afterAll, describe, expect, it } from "vitest";
import { seedDemoData } from "@/application/demo/demo-seed";
import { getEventStatus } from "@/domain/events/event-status";
import { events } from "@/infrastructure/db/schema";
import { createTestDb } from "./test-db";

// Friday 2026-11-13, 14:00 in São Paulo.
const NOW = new Date("2026-11-13T17:00:00Z");

describe("demo seed", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  it("creates demo events covering every event status", async () => {
    expect(await seedDemoData(db, NOW)).toEqual({ created: expect.any(Number) });
    const rows = await db.select().from(events);
    const statuses = new Set(rows.map((e) => getEventStatus(e, NOW)));
    expect([...statuses].sort()).toEqual(["cancelled", "draft", "ended", "ongoing", "scheduled"]);
  });

  it("skips when events already exist, so it never duplicates data", async () => {
    const before = (await db.select({ id: events.id }).from(events)).length;
    expect(await seedDemoData(db, NOW)).toEqual({ skipped: true });
    expect((await db.select({ id: events.id }).from(events)).length).toBe(before);
  });
});
