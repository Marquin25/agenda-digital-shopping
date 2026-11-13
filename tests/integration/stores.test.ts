import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { seedReferenceData } from "@/application/catalog/reference-data";
import {
  listSegments,
  listStores,
  saveSegment,
  saveStore,
  segmentInputSchema,
  setSegmentActive,
  setStoreActive,
  StoreRuleError,
  storeInputSchema,
} from "@/application/catalog/stores";
import { createEvent, publishEvent, updateEvent } from "@/application/events/event-commands";
import { eventInputSchema, type EventInput } from "@/application/events/event-input";
import { getEventForEdit, getPublicEventBySlug } from "@/application/events/event-queries";
import { getDashboardSummary } from "@/application/metrics/dashboard";
import { eventTarget, recordPageView } from "@/application/metrics/record-metrics";
import { createTestDb } from "./test-db";

const NOW = new Date("2026-11-13T12:00:00Z");

describe("stores and segments", async () => {
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
  const eventInput = (extra: Partial<EventInput> = {}) =>
    eventInputSchema.parse({
      title: "Desfile de Verão",
      description: "Desfile com as coleções de verão",
      startsAt: "2026-12-20T19:00",
      endsAt: "2026-12-20T21:00",
      venueId,
      categoryId,
      capacityMode: "unlimited",
      ...extra,
    });

  it("starts with the default segments from the reference data", async () => {
    const names = (await listSegments(db)).map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["Alimentação", "Moda", "Tecnologia", "Beleza", "Lazer"]));
  });

  it("does not bring back a renamed default segment when the reference data runs again", async () => {
    const moda = (await listSegments(db)).find((s) => s.name === "Moda")!;
    await saveSegment(db, userId, segmentInputSchema.parse({ name: "Moda e acessórios" }), moda.id);
    await seedReferenceData(db);
    const names = (await listSegments(db)).map((s) => s.name);
    expect(names).toContain("Moda e acessórios");
    expect(names).not.toContain("Moda");
  });

  it("rejects a segment whose name already exists, ignoring case and accents", async () => {
    await expect(saveSegment(db, userId, segmentInputSchema.parse({ name: "alimentacao" }))).rejects.toThrow(
      StoreRuleError,
    );
  });

  it("registers stores with business data only and lists them with their segment", async () => {
    const moda = (await listSegments(db)).find((s) => s.name === "Moda e acessórios")!;
    const food = (await listSegments(db)).find((s) => s.name === "Alimentação")!;
    await saveStore(
      db,
      userId,
      storeInputSchema.parse({ name: "Ateliê Linho", segmentId: moda.id, floor: "L2" }),
    );
    await saveStore(
      db,
      userId,
      storeInputSchema.parse({ name: "Café Aroma", segmentId: food.id, floor: "L1" }),
    );
    expect(Object.keys(storeInputSchema.shape).sort()).toEqual(["floor", "name", "segmentId"]);
    expect((await listStores(db)).map((s) => [s.name, s.segmentName, s.floor])).toEqual([
      ["Café Aroma", "Alimentação", "L1"],
      ["Ateliê Linho", "Moda e acessórios", "L2"],
    ]);
  });

  it("does not accept new stores in a deactivated segment", async () => {
    const lazer = (await listSegments(db)).find((s) => s.name === "Lazer")!;
    await setSegmentActive(db, userId, lazer.id, false);
    expect((await listSegments(db)).map((s) => s.name)).not.toContain("Lazer");
    await expect(
      saveStore(db, userId, storeInputSchema.parse({ name: "Fliperama", segmentId: lazer.id })),
    ).rejects.toThrow(StoreRuleError);
  });

  it("links stores to an event and shows only active ones to the public", async () => {
    const [cafe, atelie] = await listStores(db);
    const eventId = await createEvent(db, userId, eventInput({ storeIds: [cafe!.id, atelie!.id] }), null);
    await publishEvent(db, userId, eventId, NOW);
    expect((await getEventForEdit(db, eventId))!.storeIds.sort()).toEqual([cafe!.id, atelie!.id].sort());

    await setStoreActive(db, userId, atelie!.id, false);
    const event = await getPublicEventBySlug(db, "desfile-de-verao", NOW);
    expect(event!.stores).toEqual([
      { id: cafe!.id, name: "Café Aroma", floor: "L1", segmentName: "Alimentação" },
    ]);
    expect((await listStores(db)).map((s) => s.name)).toEqual(["Café Aroma"]);
    expect((await listStores(db, { includeInactive: true })).map((s) => s.name)).toContain("Ateliê Linho");

    await updateEvent(db, userId, eventId, eventInput({ storeIds: [] }), null);
    expect((await getEventForEdit(db, eventId))!.storeIds).toEqual([]);
    await updateEvent(db, userId, eventId, eventInput({ storeIds: [cafe!.id] }), null);
  });

  it("lists the participating stores of each event in the dashboard report", async () => {
    const event = await getPublicEventBySlug(db, "desfile-de-verao", NOW);
    await recordPageView(db, {
      targetKey: eventTarget(event!.id),
      eventId: event!.id,
      day: "2026-11-12",
      deviceHash: "d1",
      channel: "direct",
      promoCode: null,
    });
    const summary = await getDashboardSummary(db, { from: "2026-11-01", to: "2026-11-30" }, NOW);
    expect(summary.eventViews[0]!.stores).toEqual(["Café Aroma"]);
  });
});
