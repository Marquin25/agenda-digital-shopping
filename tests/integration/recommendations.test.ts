import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { listSegments, saveStore, storeInputSchema } from "@/application/catalog/stores";
import { cancelEvent, createEvent, publishEvent, updateEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { getEventForEdit } from "@/application/events/event-queries";
import {
  experienceTemplateInputSchema,
  saveExperienceTemplate,
  setExperienceTemplateActive,
} from "@/application/intelligence/experience-templates";
import { planInputSchema, savePlan } from "@/application/intelligence/plans";
import {
  generateRecommendations,
  getIdeaEventDraft,
  getRecommendationRun,
  listRecommendationRuns,
  loadRecommendationInput,
  type RecommendationEngine,
  type RecommendationInput,
  type RecommendationResult,
} from "@/application/intelligence/recommendations";
import { pageViewDailyTotals } from "@/infrastructure/db/schema";
import { createTestDb } from "./test-db";

const NOW = new Date("2027-04-10T15:00:00Z");
const WEIGHTS = { objective: 0.4, audience: 0.3, segment: 0.2, history: 0.1 };

describe("recommendations for a planning brief", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Analista",
    email: "analista@example.test",
    role: "analyst",
    temporaryPassword: "senha-de-teste-longa",
  });
  const segmentList = await listSegments(db);
  const moda = segmentList.find((s) => s.slug === "moda")!.id;
  const food = segmentList.find((s) => s.slug === "alimentacao")!.id;
  const modaStore = await saveStore(
    db,
    null,
    storeInputSchema.parse({ name: "Ateliê Linho", segmentId: moda }),
  );
  const foodStore = await saveStore(db, null, storeInputSchema.parse({ name: "Café Grão", segmentId: food }));
  const plaza = await saveVenue(
    db,
    null,
    venueInputSchema.parse({
      name: "Praça Central",
      areaSquareMeters: "120",
      capacity: "80",
      facilities: "energia, mesa",
    }),
  );
  const hall = await saveVenue(db, null, venueInputSchema.parse({ name: "Mall L2" }));
  await saveVenue(db, null, venueInputSchema.parse({ name: "Estacionamento" }));
  const fashion = (await listCategories(db))[0]!.id;

  const template = (name: string, extra: Record<string, unknown> = {}) =>
    saveExperienceTemplate(
      db,
      null,
      experienceTemplateInputSchema.parse({
        name,
        description: `${name}: atendimento com consultores nas lojas participantes.`,
        objectiveWeights: { increase_sales: "3", strengthen_experience: "1" },
        audienceWeights: { adults_25_40: "3" },
        segmentIds: [String(moda)],
        costMin: "3000",
        costMax: "8000",
        minAreaSquareMeters: "30",
        minCapacity: "",
        facilities: "energia",
        durationMinutes: "240",
        categoryId: String(fashion),
        indicators: ["page_views", "csat"],
        reviewStatus: "reviewed",
        ...extra,
      }),
    );
  const styling = await template("Consultoria de estilo");
  const festival = await template("Festival de moda", { reviewStatus: "draft", categoryId: "" });
  const retired = await template("Desfile antigo");
  await setExperienceTemplateActive(db, null, retired, false);

  const planId = await savePlan(
    db,
    userId,
    planInputSchema.parse({
      title: "Março da moda masculina",
      primaryObjective: "increase_sales",
      secondaryObjectives: ["strengthen_experience"],
      audiences: ["adults_25_40"],
      interests: "moda",
      segmentIds: [String(moda)],
      storeIds: [modaStore, foodStore],
      venueIds: [plaza, hall],
      budgetMin: "5000",
      budgetMax: "15000",
      periodStart: "2027-03-01",
      periodEnd: "2027-03-31",
      preferredWeekdays: ["0", "6"],
      timeFrom: "10:00",
      timeTo: "18:00",
    }),
  );

  const options = { weights: WEIGHTS, rulesVersion: "rules-test-1", now: NOW };

  describe("input", () => {
    it("maps the brief, its venues and the active catalog into the engine contract", async () => {
      const input = (await loadRecommendationInput(db, planId, options))!;

      expect(input.brief).toEqual({
        primaryObjective: "increase_sales",
        secondaryObjectives: ["strengthen_experience"],
        audiences: ["adults_25_40"],
        segmentIds: [moda],
        budgetMin: 5000,
        budgetMax: 15000,
        periodStart: "2027-03-01",
        periodEnd: "2027-03-31",
        dailyWindowMinutes: 480,
      });
      expect(input.venues).toEqual([
        { id: hall, name: "Mall L2", areaSquareMeters: null, capacity: null, facilities: [] },
        {
          id: plaza,
          name: "Praça Central",
          areaSquareMeters: 120,
          capacity: 80,
          facilities: ["energia", "mesa"],
        },
      ]);
      expect(input.templates.map((t) => t.name)).toEqual(["Consultoria de estilo", "Festival de moda"]);
      expect(input.templates[0]).toMatchObject({
        id: styling,
        objectiveWeights: { increase_sales: 3, strengthen_experience: 1 },
        audienceWeights: { adults_25_40: 3 },
        segmentIds: [moda],
        costMin: 3000,
        costMax: 8000,
        minAreaSquareMeters: 30,
        minCapacity: null,
        facilities: ["energia"],
        durationMinutes: 240,
        indicators: ["page_views", "csat"],
        reviewStatus: "reviewed",
      });
      expect(input.templates[1]!.reviewStatus).toBe("draft");
      expect(input).toMatchObject({ weights: WEIGHTS, rulesVersion: "rules-test-1", history: [] });
    });

    it("returns null for a brief that does not exist", async () => {
      expect(await loadRecommendationInput(db, crypto.randomUUID(), options)).toBeNull();
    });
  });

  describe("history", () => {
    it("counts only ended published events created from each idea, with their estimated devices", async () => {
      const event = async (title: string, day: string, devices: number, templateId = styling) => {
        const id = await createEvent(
          db,
          userId,
          eventInputSchema.parse({
            title,
            description: "Evento criado a partir de uma ideia do catálogo.",
            startsAt: `${day}T10:00`,
            endsAt: `${day}T12:00`,
            venueId: plaza,
            categoryId: fashion,
            capacityMode: "unlimited",
            planId,
            experienceTemplateId: templateId,
          }),
          null,
        );
        await publishEvent(db, userId, id, new Date("2027-01-01T12:00:00Z"));
        await db
          .insert(pageViewDailyTotals)
          .values({ targetKey: `event:${id}`, eventId: id, day, channel: "direct", devices });
        return id;
      };
      await event("Consultoria 1", "2027-01-09", 40);
      await event("Consultoria 2", "2027-01-16", 50);
      await event("Consultoria 3", "2027-01-23", 60);
      await event("Consultoria futura", "2027-05-01", 999);
      await event("Festival 1", "2027-02-06", 25, festival);
      const cancelled = await event("Consultoria cancelada", "2027-02-13", 500);
      await cancelEvent(db, userId, cancelled);
      await createEvent(
        db,
        userId,
        eventInputSchema.parse({
          title: "Rascunho",
          description: "Evento em rascunho, nunca publicado.",
          startsAt: "2027-02-01T10:00",
          endsAt: "2027-02-01T12:00",
          venueId: plaza,
          categoryId: fashion,
          capacityMode: "unlimited",
          experienceTemplateId: styling,
        }),
        null,
      );

      const { history } = (await loadRecommendationInput(db, planId, options))!;

      // Mean devices per event: styling 50, festival 25, both together (150 + 25) / 4 = 43.75.
      expect(history).toEqual([
        { templateId: styling, comparableEvents: 3, estimatedDevices: 150, adjustment: 0.1429 },
        { templateId: festival, comparableEvents: 1, estimatedDevices: 25, adjustment: -0.4286 },
      ]);
    });
  });

  describe("runs", () => {
    const fakeResult = (input: RecommendationInput): RecommendationResult => ({
      rulesVersion: input.rulesVersion,
      weights: input.weights,
      recommendations: [
        {
          templateId: styling,
          name: "Consultoria de estilo",
          score: 0.82,
          confidence: "medium",
          reasons: ["Atende ao objetivo principal."],
          assumptions: ["Custo conforme o catálogo."],
          compatibleVenueIds: [plaza],
          matchedSegmentIds: [moda],
          costMin: 3000,
          costMax: 8000,
          indicators: ["page_views"],
          historyApplied: true,
        },
      ],
      eliminated: [{ templateId: festival, name: "Festival de moda", reasons: ["Sem espaço compatível."] }],
    });
    const received: RecommendationInput[] = [];
    const engine: RecommendationEngine = {
      rulesVersion: "rules-test-1",
      defaultWeights: WEIGHTS,
      recommend: (input) => {
        received.push(input);
        return fakeResult(input);
      },
    };

    it("records the input, rules version, weights and result of each run, newest first", async () => {
      const first = await generateRecommendations(db, { userId, planId, engine, now: NOW });
      const second = await generateRecommendations(db, { userId, planId, engine, now: NOW });

      expect(received).toHaveLength(2);
      const run = (await getRecommendationRun(db, first!))!;
      expect(run).toMatchObject({
        id: first,
        planId,
        rulesVersion: "rules-test-1",
        weights: WEIGHTS,
        createdBy: "Analista",
      });
      expect(run.input).toEqual(JSON.parse(JSON.stringify(received[0])));
      expect(run.result).toEqual(fakeResult(received[0]!));
      expect((await listRecommendationRuns(db, planId)).map((r) => r.id)).toEqual([second, first]);
    });

    it("does not run the engine for a brief that does not exist", async () => {
      const before = received.length;
      expect(
        await generateRecommendations(db, { userId, planId: crypto.randomUUID(), engine, now: NOW }),
      ).toBeNull();
      expect(received).toHaveLength(before);
    });
  });

  describe("event from an idea", () => {
    it("prefills the event with the idea, a compatible venue and the brief's stores of matching segments", async () => {
      const draft = (await getIdeaEventDraft(db, { planId, templateId: styling, venueId: plaza }))!;

      expect(draft.values).toMatchObject({
        title: "Consultoria de estilo",
        description: "Consultoria de estilo: atendimento com consultores nas lojas participantes.",
        venueId: plaza,
        categoryId: String(fashion),
        storeIds: [modaStore],
        planId,
        experienceTemplateId: styling,
      });
      expect(draft.plan).toMatchObject({ id: planId, title: "Março da moda masculina" });
    });

    it("ignores a venue outside the brief and a missing category", async () => {
      const draft = (await getIdeaEventDraft(db, {
        planId,
        templateId: festival,
        venueId: crypto.randomUUID(),
      }))!;
      expect(draft.values).toMatchObject({ venueId: "", categoryId: "" });
      expect(await getIdeaEventDraft(db, { planId, templateId: crypto.randomUUID() })).toBeNull();
    });

    it("keeps the link to the brief and the idea when the event is edited", async () => {
      const values = {
        title: "Consultoria de estilo",
        description: "Atendimento com consultores de moda.",
        startsAt: "2027-03-06T14:00",
        endsAt: "2027-03-06T18:00",
        venueId: plaza,
        categoryId: fashion,
        capacityMode: "unlimited",
      };
      const id = await createEvent(
        db,
        userId,
        eventInputSchema.parse({ ...values, planId, experienceTemplateId: styling }),
        null,
      );
      await updateEvent(
        db,
        userId,
        id,
        eventInputSchema.parse({ ...values, title: "Consultoria de março" }),
        null,
      );

      expect((await getEventForEdit(db, id))!.event).toMatchObject({ planId, experienceTemplateId: styling });
    });
  });
});
