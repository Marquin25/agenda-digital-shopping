import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { cancelEvent, createEvent, endEventNow, publishEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { listPublicAgenda, listUpcomingEventCards } from "@/application/events/event-queries";
import { parseAgendaFilters } from "@/domain/agenda/agenda-filters";
import { events } from "@/infrastructure/db/schema";
import { createTestDb } from "./test-db";

const NOW = new Date("2026-11-18T15:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("events offered to the saved-events page", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  let userId: string;
  let venueId: string;
  let categoryId: number;

  async function newEvent(title: string, startsAt: string, endsAt: string) {
    const input = eventInputSchema.parse({
      title,
      description: `Descrição de ${title} com detalhes`,
      startsAt,
      endsAt,
      venueId,
      categoryId,
      featureIds: [],
      capacityMode: "unlimited",
    });
    return createEvent(db, userId, input, null);
  }

  beforeAll(async () => {
    userId = await createAdminUser(db, null, {
      name: "Editor Teste",
      email: "editor@example.test",
      role: "editor",
      temporaryPassword: "uma-senha-longa-de-teste",
    });
    venueId = await saveVenue(db, userId, venueInputSchema.parse({ name: "Praça Central", floor: "L1" }));
    categoryId = (await listCategories(db)).find((c) => c.slug === "musica")!.id;
  });

  afterAll(() => connection.close());

  it("includes upcoming events beyond the public agenda limit of 200", async () => {
    // Bulk fixture: 201 published upcoming events, one per day, inserted directly for speed.
    await db.insert(events).values(
      Array.from({ length: 201 }, (_, i) => ({
        slug: `evento-em-massa-${i + 1}`,
        title: `Evento em massa ${i + 1}`,
        description: "Evento criado em massa para o teste",
        searchText: `evento em massa ${i + 1}`,
        startsAt: new Date(NOW.getTime() + (i + 1) * DAY),
        endsAt: new Date(NOW.getTime() + (i + 1) * DAY + HOUR),
        venueId,
        categoryId,
        publicationStatus: "published" as const,
        publishedAt: NOW,
      })),
    );

    const agenda = await listPublicAgenda(db, parseAgendaFilters(new URLSearchParams()), NOW);
    expect(agenda).toHaveLength(200);
    expect(agenda.map((e) => e.slug)).not.toContain("evento-em-massa-201");

    const cards = await listUpcomingEventCards(db, NOW);
    expect(cards).toHaveLength(201);
    expect(cards.map((e) => e.slug)).toContain("evento-em-massa-201");
  });

  it("keeps the agenda's visibility rules: cancelled stays, drafts and ended events go", async () => {
    const cancelled = await newEvent("Show Cancelado", "2026-11-19T19:00", "2026-11-19T21:00");
    const ended = await newEvent("Show Encerrado", "2026-11-18T10:00", "2026-11-18T22:00");
    await newEvent("Rascunho Secreto", "2026-11-19T10:00", "2026-11-19T12:00");
    for (const id of [cancelled, ended]) await publishEvent(db, userId, id, NOW);
    await cancelEvent(db, userId, cancelled);
    await endEventNow(db, userId, ended, NOW);

    const cards = await listUpcomingEventCards(db, NOW);
    const titles = cards.map((e) => e.title);
    expect(titles).toContain("Show Cancelado");
    expect(titles).not.toContain("Show Encerrado");
    expect(titles).not.toContain("Rascunho Secreto");
    expect(cards.find((e) => e.title === "Show Cancelado")!.status).toBe("cancelled");
  });

  it("returns only the fields the event card shows", async () => {
    const [card] = await listUpcomingEventCards(db, NOW);
    expect(Object.keys(card!).sort()).toEqual(
      [
        "bannerAlt",
        "bannerPath",
        "category",
        "description",
        "endsAt",
        "features",
        "id",
        "locationDetail",
        "slug",
        "startsAt",
        "status",
        "title",
        "venue",
      ].sort(),
    );
  });
});
