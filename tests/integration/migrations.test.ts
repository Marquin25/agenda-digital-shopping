import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { createEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { recordEngagement } from "@/application/metrics/record-metrics";
import { createPromoLink, promoLinkInputSchema } from "@/application/promo/promo-links";
import { connect, type Database } from "@/infrastructure/db/client";
import { queryRows, rollbackLastMigration } from "@/infrastructure/db/rollback";
import {
  accessibilityFeatures,
  adminUsers,
  categories,
  engagementDaily,
  events,
  pageViewsDaily,
  promoLinks,
} from "@/infrastructure/db/schema";
import { createTestDb } from "./test-db";

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function publicTables(db: Database): Promise<string[]> {
  const rows = await queryRows<{ table_name: string }>(
    db,
    sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
  );
  return rows.map((r) => r.table_name);
}

describe("migrations apply and roll back on a clean database", async () => {
  const connection = await connect("pglite:memory");
  const db = connection.db;
  afterAll(() => connection.close());

  it("has a rollback script for every migration", () => {
    const journal = JSON.parse(readFileSync(path.join(MIGRATIONS, "meta/_journal.json"), "utf8")) as {
      entries: { tag: string }[];
    };
    for (const { tag } of journal.entries) {
      expect(existsSync(path.join(MIGRATIONS, "rollback", `${tag}.sql`)), tag).toBe(true);
    }
  });

  it("does nothing when no migration was applied", async () => {
    expect(await rollbackLastMigration(db, MIGRATIONS)).toBeNull();
  });

  it("reverts the migrations one by one, newest first, back to an empty schema", async () => {
    await connection.migrate(MIGRATIONS);
    expect(await publicTables(db)).toContain("engagement_daily");

    expect(await rollbackLastMigration(db, MIGRATIONS)).toBe("0001_engagement_and_retention");
    const afterFirst = await publicTables(db);
    expect(afterFirst).not.toContain("engagement_daily");
    expect(afterFirst).toContain("events");

    expect(await rollbackLastMigration(db, MIGRATIONS)).toBe("0000_initial");
    expect(await publicTables(db)).toEqual([]);
  });

  it("applies everything again after a full rollback", async () => {
    await connection.migrate(MIGRATIONS);
    expect(await publicTables(db)).toEqual(
      expect.arrayContaining(["events", "engagement_daily", "page_view_daily_totals"]),
    );
  });
});

describe("unique constraints", async () => {
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
      title: "Show",
      description: "Descrição do show",
      startsAt: "2026-12-20T19:00",
      endsAt: "2026-12-20T21:00",
      venueId,
      categoryId: (await listCategories(db))[0]!.id,
      capacityMode: "unlimited",
    }),
    null,
  );
  await createPromoLink(
    db,
    userId,
    promoLinkInputSchema.parse({ channel: "instagram", description: "Link na bio" }),
  );

  /** Copies an existing row without its generated id: only the unique column can make it fail. */
  const duplicate = async <T extends { id?: unknown }>(rows: T[], insert: (row: T) => Promise<unknown>) => {
    const row = { ...rows[0]! };
    delete row.id;
    return insert(row);
  };

  it("rejects a second category or accessibility feature with the same slug", async () => {
    await expect(
      duplicate(await db.select().from(categories).limit(1), (r) => db.insert(categories).values(r)),
    ).rejects.toThrow();
    await expect(
      duplicate(await db.select().from(accessibilityFeatures).limit(1), (r) =>
        db.insert(accessibilityFeatures).values(r),
      ),
    ).rejects.toThrow();
  });

  it("rejects a second staff account with the same e-mail", async () => {
    await expect(
      duplicate(await db.select().from(adminUsers).limit(1), (r) => db.insert(adminUsers).values(r)),
    ).rejects.toThrow();
  });

  it("rejects a second event with the same slug and a second promo link with the same code", async () => {
    await expect(
      duplicate(await db.select().from(events).limit(1), (r) => db.insert(events).values(r)),
    ).rejects.toThrow();
    await expect(
      duplicate(await db.select().from(promoLinks).limit(1), (r) => db.insert(promoLinks).values(r)),
    ).rejects.toThrow();
  });

  it("keeps one view per page, day and device, and one engagement per action, device and day", async () => {
    const view = {
      targetKey: "agenda",
      eventId: null,
      day: "2026-11-18",
      deviceHash: "d1",
      channel: "direct",
      promoCode: null,
    };
    await db.insert(pageViewsDaily).values(view);
    await expect(db.insert(pageViewsDaily).values(view)).rejects.toThrow();

    const engagement = { eventId, deviceHash: "d1", action: "share", day: "2026-11-18" } as const;
    await recordEngagement(db, engagement);
    await expect(db.insert(engagementDaily).values(engagement)).rejects.toThrow();
  });
});
