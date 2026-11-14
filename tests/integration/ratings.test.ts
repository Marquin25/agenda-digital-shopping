import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { cancelEvent, createEvent, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { deleteDeviceData } from "@/application/metrics/record-metrics";
import { applyRetention } from "@/application/metrics/retention";
import {
  getEventRatingReport,
  getRatingContext,
  hasRated,
  submitRating,
} from "@/application/ratings/ratings";
import { eventRatings, events } from "@/infrastructure/db/schema";
import { MemoryFileStorage } from "./memory-file-storage";
import { createTestDb } from "./test-db";

// The event runs on 2026-11-10 from 16:00 to 18:00 in São Paulo (19:00–21:00 UTC).
const ENDS = new Date("2026-11-10T21:00:00Z");
const DURING = new Date("2026-11-10T20:00:00Z");
const AFTER = new Date("2026-11-11T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const good = { score: 5 as const, tags: ["atracao" as const], comment: "Muito bom" };

describe("post-event ratings (B-26)", async () => {
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
  const categoryId = (await listCategories(db))[0]!.id;
  async function newEvent(title: string, publish = true) {
    const id = await createEvent(
      db,
      userId,
      eventInputSchema.parse({
        title,
        description: "Evento para testar avaliações",
        startsAt: "2026-11-10T16:00",
        endsAt: "2026-11-10T18:00",
        venueId,
        categoryId,
        capacityMode: "unlimited",
      }),
      null,
    );
    if (publish) await publishEvent(db, userId, id, new Date("2026-11-01T12:00:00Z"));
    const [row] = await db.select({ slug: events.slug }).from(events).where(eq(events.id, id));
    return { id, slug: row!.slug };
  }

  const show = await newEvent("Show avaliado");

  it("opens only after the event ends and for the configured number of days", async () => {
    expect((await getRatingContext(db, show.slug, DURING))?.state).toBe("not_open");
    const context = await getRatingContext(db, show.slug, AFTER);
    expect(context).toMatchObject({ eventId: show.id, title: "Show avaliado", state: "open" });
    expect(context?.window.closesAt).toEqual(new Date(ENDS.getTime() + 7 * DAY));
    expect(await submitRating(db, { eventId: show.id, deviceHash: "d0", input: good, now: DURING })).toBe(
      "not_open",
    );
    expect(
      await submitRating(db, {
        eventId: show.id,
        deviceHash: "d0",
        input: good,
        now: new Date(ENDS.getTime() + 7 * DAY),
      }),
    ).toBe("closed");
  });

  it("records one rating per device; a second one is answered as already rated", async () => {
    expect(await hasRated(db, show.id, "d1")).toBe(false);
    expect(await submitRating(db, { eventId: show.id, deviceHash: "d1", input: good, now: AFTER })).toBe(
      "recorded",
    );
    expect(await hasRated(db, show.id, "d1")).toBe(true);
    expect(
      await submitRating(db, {
        eventId: show.id,
        deviceHash: "d1",
        input: { ...good, score: 1 },
        now: AFTER,
      }),
    ).toBe("already_rated");
    const [row] = await db.select().from(eventRatings).where(eq(eventRatings.deviceHash, "d1"));
    expect(row).toMatchObject({ score: 5, tags: ["atracao"], comment: "Muito bom", withCheckIn: false });
  });

  it("does not accept ratings for drafts, cancelled events or unknown events", async () => {
    const draft = await newEvent("Rascunho", false);
    const cancelled = await newEvent("Cancelado");
    await cancelEvent(db, userId, cancelled.id);
    expect(await getRatingContext(db, draft.slug, AFTER)).toBeNull();
    expect(await getRatingContext(db, cancelled.slug, AFTER)).toBeNull();
    for (const eventId of [draft.id, cancelled.id, crypto.randomUUID()]) {
      expect(await submitRating(db, { eventId, deviceHash: "d2", input: good, now: AFTER })).toBe(
        "unavailable",
      );
    }
  });

  it("uses each event's own rating period", async () => {
    const short = await newEvent("Avaliação curta");
    await db.update(events).set({ ratingPeriodDays: 1 }).where(eq(events.id, short.id));
    const twoDaysLater = new Date(ENDS.getTime() + 2 * DAY);
    expect((await getRatingContext(db, short.slug, twoDaysLater))?.state).toBe("closed");
  });

  it("takes the rating period from the event form (1 to 30 days, 7 when left blank)", () => {
    const base = {
      title: "Período",
      description: "Evento para testar o período",
      startsAt: "2026-11-10T16:00",
      endsAt: "2026-11-10T18:00",
      venueId,
      categoryId,
      capacityMode: "unlimited",
    };
    expect(eventInputSchema.parse({ ...base, ratingPeriodDays: "3" }).ratingPeriodDays).toBe(3);
    expect(eventInputSchema.parse({ ...base, ratingPeriodDays: "" }).ratingPeriodDays).toBe(7);
    const tooLong = eventInputSchema.safeParse({ ...base, ratingPeriodDays: "40" });
    expect(tooLong.success ? null : tooLong.error.issues[0]?.message).toBe("Use de 1 a 30 dias.");
  });

  it("reports aggregates for staff without device hashes, leaving hidden ratings out", async () => {
    const event = await newEvent("Relatório");
    for (const [hash, score, tags] of [
      ["r1", 5, ["atracao", "horario"]],
      ["r2", 4, ["atracao"]],
      ["r3", 2, []],
    ] as const)
      await submitRating(db, {
        eventId: event.id,
        deviceHash: hash,
        input: { score, tags: [...tags], comment: null },
        now: AFTER,
      });
    await submitRating(db, {
      eventId: event.id,
      deviceHash: "r4",
      input: { score: 1, tags: [], comment: "ofensivo" },
      now: AFTER,
    });
    await db.update(eventRatings).set({ hidden: true }).where(eq(eventRatings.deviceHash, "r4"));

    const report = await getEventRatingReport(db, event.id);
    expect(report.summary).toEqual({
      count: 3,
      average: 3.7,
      csat: 2 / 3,
      distribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1 },
    });
    expect(report.tags).toEqual({ organizacao: 0, horario: 1, atracao: 2, conforto: 0 });
    expect(report.hiddenCount).toBe(1);
    expect(JSON.stringify(report)).not.toContain("r1");
  });

  it("deletes a device's ratings when the visitor deletes this device's data", async () => {
    const event = await newEvent("Apagar dados");
    await submitRating(db, { eventId: event.id, deviceHash: "gone", input: good, now: AFTER });
    expect(await deleteDeviceData(db, "gone")).toBeGreaterThanOrEqual(1);
    expect(await hasRated(db, event.id, "gone")).toBe(false);
  });

  it("retention clears device hashes 90 days after the event and deletes ratings after 2 years", async () => {
    const event = await newEvent("Retenção");
    await submitRating(db, { eventId: event.id, deviceHash: "old", input: good, now: AFTER });
    const storage = new MemoryFileStorage();

    await applyRetention(db, storage, new Date(ENDS.getTime() + 89 * DAY));
    expect(await hasRated(db, event.id, "old")).toBe(true);

    const cleared = await applyRetention(db, storage, new Date(ENDS.getTime() + 91 * DAY));
    expect(cleared.ratingDeviceHashes).toBeGreaterThanOrEqual(1);
    expect(await hasRated(db, event.id, "old")).toBe(false);
    expect((await getEventRatingReport(db, event.id)).summary.count).toBe(1);

    const deleted = await applyRetention(db, storage, new Date(AFTER.getTime() + 731 * DAY));
    expect(deleted.ratings).toBeGreaterThanOrEqual(1);
    expect((await getEventRatingReport(db, event.id)).summary.count).toBe(0);
  });
});
