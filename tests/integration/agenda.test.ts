import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  listCategories,
  listAccessibilityFeatures,
  saveVenue,
  venueInputSchema,
} from "@/application/catalog/catalog";
import { createAdminUser } from "@/application/auth/admin-auth";
import {
  cancelEvent,
  createEvent,
  deleteDraftEvent,
  endEventNow,
  EventRuleError,
  publishEvent,
  updateEvent,
} from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { getPublicEventBySlug, listPublicAgenda } from "@/application/events/event-queries";
import { parseAgendaFilters } from "@/domain/agenda/agenda-filters";
import { createTestDb } from "./test-db";

const NOW = new Date("2026-11-18T15:00:00Z"); // Wednesday 12:00 in São Paulo
const all = parseAgendaFilters(new URLSearchParams());

describe("public agenda", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  let userId: string;
  let venueId: string;
  let ids: Record<string, string>;

  async function newEvent(
    title: string,
    startsAt: string,
    endsAt: string,
    extra: Record<string, unknown> = {},
  ) {
    const [music, kids] = [
      (await listCategories(db)).find((c) => c.slug === "musica")!,
      (await listCategories(db)).find((c) => c.slug === "infantil")!,
    ];
    const input = eventInputSchema.parse({
      title,
      description: `Descrição de ${title} com detalhes`,
      startsAt,
      endsAt,
      venueId,
      categoryId: extra.kids ? kids.id : music.id,
      featureIds: extra.featureIds ?? [],
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
    const libras = (await listAccessibilityFeatures(db)).find((f) => f.slug === "libras")!;
    ids = {
      todayShow: await newEvent("Show Acústico", "2026-11-18T19:00", "2026-11-18T21:00", {
        featureIds: [libras.id],
      }),
      weekendKids: await newEvent("Oficina de Pintura", "2026-11-21T15:00", "2026-11-21T17:00", {
        kids: true,
      }),
      past: await newEvent("Evento Passado", "2026-11-10T10:00", "2026-11-10T12:00"),
      draft: await newEvent("Rascunho Secreto", "2026-11-19T10:00", "2026-11-19T12:00"),
    };
    for (const key of ["todayShow", "weekendKids", "past"]) await publishEvent(db, userId, ids[key]!, NOW);
  });

  afterAll(() => connection.close());

  it("lists published upcoming events in chronological order, hiding drafts and ended events", async () => {
    const agenda = await listPublicAgenda(db, all, NOW);
    expect(agenda.map((e) => e.title)).toEqual(["Show Acústico", "Oficina de Pintura"]);
    expect(agenda[0]!.status).toBe("scheduled");
  });

  it("filters by accessibility feature", async () => {
    const agenda = await listPublicAgenda(
      db,
      parseAgendaFilters(new URLSearchParams("acessibilidade=libras")),
      NOW,
    );
    expect(agenda.map((e) => e.title)).toEqual(["Show Acústico"]);
    expect(agenda[0]!.features.map((f) => f.slug)).toEqual(["libras"]);
  });

  it("filters by category and by accent-insensitive text", async () => {
    expect(
      (await listPublicAgenda(db, parseAgendaFilters(new URLSearchParams("categoria=infantil")), NOW)).map(
        (e) => e.title,
      ),
    ).toEqual(["Oficina de Pintura"]);
    expect(
      (await listPublicAgenda(db, parseAgendaFilters(new URLSearchParams("q=ACUSTICO")), NOW)).map(
        (e) => e.title,
      ),
    ).toEqual(["Show Acústico"]);
  });

  it("filters by date window in mall time", async () => {
    const today = await listPublicAgenda(db, parseAgendaFilters(new URLSearchParams("data=hoje")), NOW);
    expect(today.map((e) => e.title)).toEqual(["Show Acústico"]);
    const weekend = await listPublicAgenda(
      db,
      parseAgendaFilters(new URLSearchParams("data=fim-de-semana")),
      NOW,
    );
    expect(weekend.map((e) => e.title)).toEqual(["Oficina de Pintura"]);
  });

  it("keeps drafts out of the public detail page", async () => {
    const agenda = await listPublicAgenda(db, all, NOW);
    expect(await getPublicEventBySlug(db, "rascunho-secreto", NOW)).toBeNull();
    expect((await getPublicEventBySlug(db, agenda[0]!.slug, NOW))?.title).toBe("Show Acústico");
  });

  it("shows cancelled events with their status and removes manually ended ones", async () => {
    await cancelEvent(db, userId, ids.weekendKids!);
    const live = new Date("2026-11-18T22:30:00Z"); // 19:30 local, show is ongoing
    await endEventNow(db, userId, ids.todayShow!, live);
    const agenda = await listPublicAgenda(db, all, live);
    expect(agenda.map((e) => [e.title, e.status])).toEqual([["Oficina de Pintura", "cancelled"]]);
  });

  it("only deletes drafts", async () => {
    await expect(deleteDraftEvent(db, userId, ids.past!)).rejects.toBeInstanceOf(EventRuleError);
    await deleteDraftEvent(db, userId, ids.draft!);
  });

  it("rejects an end before the start", () => {
    const result = eventInputSchema.safeParse({
      title: "Invertido",
      description: "Descrição suficiente",
      startsAt: "2026-11-20T10:00",
      endsAt: "2026-11-20T09:00",
      venueId,
      categoryId: 1,
      capacityMode: "unlimited",
    });
    expect(result.success).toBe(false);
  });

  it("reports the banner a new upload replaced, so its file can be removed", async () => {
    const input = eventInputSchema.parse({
      title: "Evento com Banner",
      description: "Evento usado para testar a troca de banner",
      startsAt: "2026-11-25T10:00",
      endsAt: "2026-11-25T12:00",
      venueId,
      categoryId: (await listCategories(db))[0]!.id,
      capacityMode: "unlimited",
      bannerAlt: "Palco iluminado",
    });
    const id = await createEvent(db, userId, input, { path: "first.webp" });
    expect(await updateEvent(db, userId, id, input, null)).toEqual({ replacedBannerPath: null });
    expect(await updateEvent(db, userId, id, input, { path: "second.webp" })).toEqual({
      replacedBannerPath: "first.webp",
    });
  });
});
