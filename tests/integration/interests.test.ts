import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { cancelEvent, createEvent, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { isInterested, setInterest } from "@/application/interests/interests";
import { getDashboardSummary } from "@/application/metrics/dashboard";
import { deleteDeviceData } from "@/application/metrics/record-metrics";
import { applyRetention } from "@/application/metrics/retention";
import { listRatingsForModeration, setRatingHidden, submitRating } from "@/application/ratings/ratings";
import { events } from "@/infrastructure/db/schema";
import { MemoryFileStorage } from "./memory-file-storage";
import { createTestDb } from "./test-db";

// Events run on 2026-11-20 from 16:00 to 18:00 in São Paulo (19:00–21:00 UTC).
const BEFORE = new Date("2026-11-14T12:00:00Z");
const DURING = new Date("2026-11-20T20:00:00Z");
const AFTER = new Date("2026-11-21T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const NOVEMBER = { from: "2026-11-01", to: "2026-11-30" };

describe("“Tenho interesse” (B-20)", async () => {
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
  async function newEvent(title: string, { publish = true, day = "2026-11-20" } = {}) {
    const id = await createEvent(
      db,
      userId,
      eventInputSchema.parse({
        title,
        description: "Evento para testar interesse",
        startsAt: `${day}T16:00`,
        endsAt: `${day}T18:00`,
        venueId,
        categoryId,
        capacityMode: "unlimited",
      }),
      null,
    );
    if (publish) await publishEvent(db, userId, id, new Date("2026-11-01T12:00:00Z"));
    return id;
  }

  it("turns on once per device and event, and off again (idempotent both ways)", async () => {
    const eventId = await newEvent("Oficina de origami");
    expect(await setInterest(db, { eventId, deviceHash: "device-a", interested: true, now: BEFORE })).toBe(
      "on",
    );
    expect(await setInterest(db, { eventId, deviceHash: "device-a", interested: true, now: BEFORE })).toBe(
      "on",
    );
    expect(await isInterested(db, eventId, "device-a")).toBe(true);
    expect(await isInterested(db, eventId, "device-b")).toBe(false);

    expect(await setInterest(db, { eventId, deviceHash: "device-a", interested: false, now: DURING })).toBe(
      "off",
    );
    expect(await setInterest(db, { eventId, deviceHash: "device-a", interested: false, now: DURING })).toBe(
      "off",
    );
    expect(await isInterested(db, eventId, "device-a")).toBe(false);
  });

  it("is only available while a published event has not ended or been cancelled", async () => {
    const draft = await newEvent("Rascunho", { publish: false });
    const cancelled = await newEvent("Cancelado");
    await cancelEvent(db, userId, cancelled);
    const ended = await newEvent("Encerrado");
    const mark = (eventId: string, now: Date) =>
      setInterest(db, { eventId, deviceHash: "device-a", interested: true, now });

    expect(await mark(draft, BEFORE)).toBe("unavailable");
    expect(await mark(cancelled, BEFORE)).toBe("unavailable");
    expect(await mark(ended, AFTER)).toBe("unavailable");
    expect(await mark("00000000-0000-0000-0000-000000000000", BEFORE)).toBe("unavailable");
  });

  it("feeds the dashboard as “Interessados (estimado)”, counted by the event's date", async () => {
    const eventId = await newEvent("Show de mágica");
    const december = await newEvent("Natal", { day: "2026-12-20" });
    for (const device of ["d1", "d2", "d3"])
      await setInterest(db, { eventId, deviceHash: device, interested: true, now: BEFORE });
    await setInterest(db, { eventId: december, deviceHash: "d1", interested: true, now: BEFORE });

    const before = await getDashboardSummary(db, NOVEMBER, BEFORE);
    expect(before.interested.quality).toBe("estimated");
    const count = before.interested.quality === "estimated" ? before.interested.value : -1;
    expect(count).toBe(3);

    await setInterest(db, { eventId, deviceHash: "d3", interested: false, now: BEFORE });
    const after = await getDashboardSummary(db, NOVEMBER, BEFORE);
    expect(after.interested).toMatchObject({ quality: "estimated", value: 2 });
  });

  it("keeps only the total 90 days after the event ends, without changing the dashboard", async () => {
    const eventId = await newEvent("Antigo", { day: "2026-11-25" });
    for (const device of ["r1", "r2"])
      await setInterest(db, { eventId, deviceHash: device, interested: true, now: BEFORE });
    const before = await getDashboardSummary(db, NOVEMBER, BEFORE);

    const later = new Date(new Date("2026-11-25T21:00:00Z").getTime() + 91 * DAY);
    const result = await applyRetention(db, new MemoryFileStorage(), later);
    expect(result.interestRows).toBeGreaterThanOrEqual(2);
    expect(await isInterested(db, eventId, "r1")).toBe(false);
    expect((await getDashboardSummary(db, NOVEMBER, BEFORE)).interested).toEqual(before.interested);
  });

  it("is removed by “Apagar meus dados”", async () => {
    const eventId = await newEvent("Pintura");
    await setInterest(db, { eventId, deviceHash: "erase-me", interested: true, now: BEFORE });
    expect(await deleteDeviceData(db, "erase-me")).toBeGreaterThanOrEqual(1);
    expect(await isInterested(db, eventId, "erase-me")).toBe(false);
  });

  it("deleting an event deletes its interests", async () => {
    const eventId = await newEvent("Removido");
    await setInterest(db, { eventId, deviceHash: "x", interested: true, now: BEFORE });
    await db.delete(events).where(eq(events.id, eventId));
    expect(await isInterested(db, eventId, "x")).toBe(false);
  });
});

describe("ratings on the dashboard (B-26)", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  it("counts the ratings sent in the period, measured, leaving hidden ones out", async () => {
    const userId = await createAdminUser(db, null, {
      name: "Editor",
      email: "editor@example.test",
      role: "editor",
      temporaryPassword: "senha-de-teste-longa",
    });
    const venueId = await saveVenue(db, userId, venueInputSchema.parse({ name: "Praça", floor: "L1" }));
    const categoryId = (await listCategories(db))[0]!.id;
    const eventId = await createEvent(
      db,
      userId,
      eventInputSchema.parse({
        title: "Avaliado",
        description: "Evento avaliado",
        startsAt: "2026-11-20T16:00",
        endsAt: "2026-11-20T18:00",
        venueId,
        categoryId,
        capacityMode: "unlimited",
      }),
      null,
    );
    await publishEvent(db, userId, eventId, new Date("2026-11-01T12:00:00Z"));

    const empty = await getDashboardSummary(db, NOVEMBER, AFTER);
    expect(empty.ratings).toEqual({ quality: "measured", value: 0 });

    for (const device of ["a", "b"])
      await submitRating(db, {
        eventId,
        deviceHash: device,
        input: { score: 4, tags: [], comment: null },
        now: AFTER,
      });
    expect((await getDashboardSummary(db, NOVEMBER, AFTER)).ratings).toEqual({
      quality: "measured",
      value: 2,
    });
    const [first] = await listRatingsForModeration(db, { eventId });
    await setRatingHidden(db, userId, first!.id, true);
    expect((await getDashboardSummary(db, NOVEMBER, AFTER)).ratings).toEqual({
      quality: "measured",
      value: 1,
    });
    expect((await getDashboardSummary(db, { from: "2026-12-01", to: "2026-12-31" }, AFTER)).ratings).toEqual({
      quality: "measured",
      value: 0,
    });
  });
});
