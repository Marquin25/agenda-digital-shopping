import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listSegments } from "@/application/catalog/stores";
import {
  experienceTemplateInputSchema,
  getExperienceTemplate,
  listExperienceTemplates,
  saveExperienceTemplate,
  seedExampleTemplates,
  setExperienceTemplateActive,
} from "@/application/intelligence/experience-templates";
import { createTestDb } from "./test-db";

describe("experience template catalog", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Admin",
    email: "admin@example.test",
    role: "administrator",
    temporaryPassword: "senha-de-teste-longa",
  });
  const segmentId = async (name: string) => (await listSegments(db)).find((s) => s.name === name)!.id;
  const styleInput = async () => ({
    name: "Consultoria de estilo",
    description: "Atendimento com consultores de moda nas lojas participantes.",
    objectiveWeights: { increase_sales: "3", strengthen_experience: "2", attract_new_audiences: "1" },
    audienceWeights: { adults_25_40: "3", young_adults: "1" },
    segmentIds: [String(await segmentId("Moda")), String(await segmentId("Beleza"))],
    costMin: "3000",
    costMax: "8000",
    minAreaSquareMeters: "30",
    minCapacity: "",
    facilities: "energia, mesa",
    durationMinutes: "240",
    categoryId: "",
    indicators: ["page_views", "csat"],
    reviewStatus: "reviewed",
  });

  it("saves a template with weights, segments, cost, structure, duration and indicators", async () => {
    const id = await saveExperienceTemplate(
      db,
      userId,
      experienceTemplateInputSchema.parse(await styleInput()),
    );
    const template = (await getExperienceTemplate(db, id))!;
    expect(template).toMatchObject({
      name: "Consultoria de estilo",
      objectiveWeights: { increase_sales: 3, strengthen_experience: 2, attract_new_audiences: 1 },
      audienceWeights: { adults_25_40: 3, young_adults: 1 },
      costMin: 3000,
      costMax: 8000,
      minAreaSquareMeters: 30,
      minCapacity: null,
      facilities: ["energia", "mesa"],
      durationMinutes: 240,
      categoryId: null,
      indicators: ["page_views", "csat"],
      reviewStatus: "reviewed",
      active: true,
    });
    expect(template.segments.map((s) => s.name).sort()).toEqual(["Beleza", "Moda"]);
    expect(template.updatedAt).toBeInstanceOf(Date);
  });

  it("drops zero weights instead of storing them", async () => {
    const input = await styleInput();
    const id = await saveExperienceTemplate(
      db,
      userId,
      experienceTemplateInputSchema.parse({
        ...input,
        name: "Desfile",
        objectiveWeights: { increase_sales: "2", increase_traffic: "0" },
      }),
    );
    expect((await getExperienceTemplate(db, id))!.objectiveWeights).toEqual({ increase_sales: 2 });
  });

  it("rejects a cost range whose minimum is above the maximum", async () => {
    const result = experienceTemplateInputSchema.safeParse({
      ...(await styleInput()),
      costMin: "9000",
      costMax: "8000",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0]!.path).toEqual(["costMax"]);
  });

  it("requires at least one objective the template serves", async () => {
    const result = experienceTemplateInputSchema.safeParse({
      ...(await styleInput()),
      objectiveWeights: { increase_sales: "0" },
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0]!.path).toEqual(["objectiveWeights"]);
  });

  it("rejects weights outside 0–3 and unknown indicators", async () => {
    const input = await styleInput();
    expect(
      experienceTemplateInputSchema.safeParse({ ...input, objectiveWeights: { increase_sales: "4" } })
        .success,
    ).toBe(false);
    expect(experienceTemplateInputSchema.safeParse({ ...input, indicators: ["followers"] }).success).toBe(
      false,
    );
  });

  it("updates a template, replacing its segments and bumping the update date", async () => {
    const [template] = await listExperienceTemplates(db);
    const before = template!.updatedAt;
    await saveExperienceTemplate(
      db,
      userId,
      experienceTemplateInputSchema.parse({
        ...(await styleInput()),
        segmentIds: [String(await segmentId("Moda"))],
        reviewStatus: "draft",
      }),
      template!.id,
    );
    const updated = (await getExperienceTemplate(db, template!.id))!;
    expect(updated.segments.map((s) => s.name)).toEqual(["Moda"]);
    expect(updated.reviewStatus).toBe("draft");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("hides deactivated templates unless asked", async () => {
    const desfile = (await listExperienceTemplates(db)).find((t) => t.name === "Desfile")!;
    await setExperienceTemplateActive(db, userId, desfile.id, false);
    expect((await listExperienceTemplates(db)).map((t) => t.name)).not.toContain("Desfile");
    expect((await listExperienceTemplates(db, { includeInactive: true })).map((t) => t.name)).toContain(
      "Desfile",
    );
  });
});

describe("example templates seed", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  it("creates example templates marked as drafts for review, only once", async () => {
    const created = await seedExampleTemplates(db);
    expect(created).toBeGreaterThanOrEqual(8);
    const all = await listExperienceTemplates(db);
    expect(all.every((t) => t.reviewStatus === "draft")).toBe(true);
    expect(all.every((t) => t.segments.length > 0 && t.indicators.length > 0)).toBe(true);
    expect(await seedExampleTemplates(db)).toBe(0);
    expect((await listExperienceTemplates(db)).length).toBe(all.length);
  });
});
