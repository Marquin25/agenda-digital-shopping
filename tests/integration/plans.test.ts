import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { listSegments, saveStore, storeInputSchema } from "@/application/catalog/stores";
import {
  getPlan,
  listPlans,
  planInputSchema,
  savePlan,
  setPlanArchived,
} from "@/application/intelligence/plans";
import { createTestDb } from "./test-db";

describe("planning briefs", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Analista",
    email: "analista@example.test",
    role: "analyst",
    temporaryPassword: "senha-de-teste-longa",
  });
  const moda = (await listSegments(db)).find((s) => s.slug === "moda")!.id;
  const food = (await listSegments(db)).find((s) => s.slug === "alimentacao")!.id;
  const storeId = await saveStore(
    db,
    null,
    storeInputSchema.parse({ name: "Ateliê Linho", segmentId: moda }),
  );
  const venueId = await saveVenue(db, null, venueInputSchema.parse({ name: "Praça Central", floor: "L1" }));

  const form = (extra: Record<string, unknown> = {}) => ({
    title: "Março da moda masculina",
    primaryObjective: "increase_sales",
    secondaryObjectives: ["strengthen_experience"],
    audiences: ["adults_25_40"],
    interests: "moda, estilo",
    segmentIds: [String(moda), String(food)],
    storeIds: [storeId],
    venueIds: [venueId],
    budgetMin: "5000",
    budgetMax: "15000",
    periodStart: "2027-03-01",
    periodEnd: "2027-03-31",
    preferredWeekdays: ["0", "6"],
    timeFrom: "10:00",
    timeTo: "18:00",
    ...extra,
  });
  const issuePath = (extra: Record<string, unknown>) => {
    const result = planInputSchema.safeParse(form(extra));
    expect(result.success).toBe(false);
    return result.error!.issues[0]!.path;
  };

  it("saves a brief with objectives, target audience, segments, stores, budget, period and venues", async () => {
    const id = await savePlan(db, userId, planInputSchema.parse(form()));
    const plan = (await getPlan(db, id))!;
    expect(plan).toMatchObject({
      title: "Março da moda masculina",
      primaryObjective: "increase_sales",
      secondaryObjectives: ["strengthen_experience"],
      audiences: ["adults_25_40"],
      interests: ["moda", "estilo"],
      budgetMin: 5000,
      budgetMax: 15000,
      periodStart: "2027-03-01",
      periodEnd: "2027-03-31",
      preferredWeekdays: [0, 6],
      timeFrom: "10:00",
      timeTo: "18:00",
      dailyWindowMinutes: 480,
      archived: false,
    });
    expect(plan.segments.map((s) => s.name)).toEqual(["Alimentação", "Moda"]);
    expect(plan.stores.map((s) => s.name)).toEqual(["Ateliê Linho"]);
    expect(plan.venues.map((v) => v.name)).toEqual(["Praça Central"]);
  });

  it("has no daily window limit when no time range is informed", async () => {
    const id = await savePlan(db, userId, planInputSchema.parse(form({ timeFrom: "", timeTo: "" })));
    expect((await getPlan(db, id))!.dailyWindowMinutes).toBeNull();
  });

  it("requires a primary objective and at least one target audience and venue", () => {
    expect(issuePath({ primaryObjective: "" })).toEqual(["primaryObjective"]);
    expect(issuePath({ audiences: [] })).toEqual(["audiences"]);
    expect(issuePath({ venueIds: [] })).toEqual(["venueIds"]);
  });

  it("does not repeat the primary objective among the secondary ones", () => {
    const parsed = planInputSchema.parse(
      form({ secondaryObjectives: ["increase_sales", "increase_traffic"] }),
    );
    expect(parsed.secondaryObjectives).toEqual(["increase_traffic"]);
  });

  it("rejects inverted budget, period and time ranges", () => {
    expect(issuePath({ budgetMin: "20000" })).toEqual(["budgetMax"]);
    expect(issuePath({ periodEnd: "2027-02-01" })).toEqual(["periodEnd"]);
    expect(issuePath({ timeTo: "09:00" })).toEqual(["timeTo"]);
    expect(issuePath({ timeTo: "" })).toEqual(["timeTo"]);
  });

  it("rejects periods longer than a year and invalid dates", () => {
    expect(issuePath({ periodEnd: "2028-03-02" })).toEqual(["periodEnd"]);
    expect(issuePath({ periodStart: "2027-02-30" })).toEqual(["periodStart"]);
  });

  it("updates a brief replacing its links, and archives it", async () => {
    const [plan] = await listPlans(db);
    await savePlan(
      db,
      userId,
      planInputSchema.parse(form({ storeIds: [], segmentIds: [String(moda)] })),
      plan!.id,
    );
    const updated = (await getPlan(db, plan!.id))!;
    expect(updated.stores).toEqual([]);
    expect(updated.segments.map((s) => s.name)).toEqual(["Moda"]);

    await setPlanArchived(db, userId, plan!.id, true);
    expect((await listPlans(db)).map((p) => p.id)).not.toContain(plan!.id);
    expect((await listPlans(db, { includeArchived: true })).map((p) => p.id)).toContain(plan!.id);
  });
});
