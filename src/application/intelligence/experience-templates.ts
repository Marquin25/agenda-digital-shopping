import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/application/audit";
import { commaListSchema, optionalIntSchema } from "@/application/catalog/catalog";
import {
  AUDIENCES,
  INDICATOR_KEYS,
  MAX_WEIGHT,
  OBJECTIVES,
  type Audience,
  type IndicatorKey,
  type Objective,
  type Weights,
} from "@/domain/intelligence/experience-catalog";
import type { Database } from "@/infrastructure/db/client";
import { experienceTemplates, experienceTemplateSegments, segments } from "@/infrastructure/db/schema";
import { EXAMPLE_TEMPLATES } from "./example-templates";

const weight = z.coerce
  .number()
  .int()
  .min(0, `Use pesos de 0 a ${MAX_WEIGHT}.`)
  .max(MAX_WEIGHT, `Use pesos de 0 a ${MAX_WEIGHT}.`);

/** Weights keyed by a fixed vocabulary; zeros are dropped so only served items are stored. */
function weightsSchema<K extends string>(keys: readonly [K, ...K[]]) {
  return z
    .partialRecord(z.enum(keys), weight)
    .default({})
    .transform(
      (w) => Object.fromEntries(Object.entries(w).filter(([, v]) => (v as number) > 0)) as Weights<K>,
    );
}

const money = z.coerce
  .number({ error: "Informe um valor em reais." })
  .int("Informe um valor inteiro em reais.")
  .min(0, "Informe um valor em reais.")
  .max(10_000_000);

export const experienceTemplateInputSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do modelo.").max(120),
    description: z.string().trim().max(2000).default(""),
    objectiveWeights: weightsSchema(OBJECTIVES),
    audienceWeights: weightsSchema(AUDIENCES),
    segmentIds: z.array(z.coerce.number().int().positive()).max(20).default([]),
    costMin: money,
    costMax: money,
    minAreaSquareMeters: optionalIntSchema,
    minCapacity: optionalIntSchema,
    facilities: commaListSchema,
    durationMinutes: z.coerce
      .number({ error: "Informe a duração típica em minutos." })
      .int("Informe a duração típica em minutos.")
      .min(15, "A duração mínima é de 15 minutos.")
      .max(24 * 60, "A duração máxima é de 24 horas."),
    categoryId: z
      .union([z.literal(""), z.null(), z.coerce.number().int().positive()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v)),
    indicators: z.array(z.enum(INDICATOR_KEYS)).max(INDICATOR_KEYS.length).default([]),
    reviewStatus: z.enum(["draft", "reviewed"]).default("draft"),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data.objectiveWeights).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["objectiveWeights"],
        message: "Indique ao menos um objetivo que o modelo atende.",
      });
    }
    if (data.costMin > data.costMax) {
      ctx.addIssue({
        code: "custom",
        path: ["costMax"],
        message: "O custo máximo não pode ser menor que o mínimo.",
      });
    }
  });
export type ExperienceTemplateInput = z.input<typeof experienceTemplateInputSchema>;
export type ValidExperienceTemplateInput = z.output<typeof experienceTemplateInputSchema>;

export interface ExperienceTemplateView {
  id: string;
  name: string;
  description: string;
  objectiveWeights: Weights<Objective>;
  audienceWeights: Weights<Audience>;
  segments: { id: number; name: string }[];
  costMin: number;
  costMax: number;
  minAreaSquareMeters: number | null;
  minCapacity: number | null;
  facilities: string[];
  durationMinutes: number;
  categoryId: number | null;
  indicators: IndicatorKey[];
  reviewStatus: "draft" | "reviewed";
  active: boolean;
  updatedAt: Date;
}

async function loadSegments(db: Database, templateIds: string[]) {
  const map = new Map<string, { id: number; name: string }[]>();
  if (templateIds.length === 0) return map;
  const rows = await db
    .select({ templateId: experienceTemplateSegments.templateId, id: segments.id, name: segments.name })
    .from(experienceTemplateSegments)
    .innerJoin(segments, eq(segments.id, experienceTemplateSegments.segmentId))
    .where(inArray(experienceTemplateSegments.templateId, templateIds))
    .orderBy(asc(segments.name));
  for (const { templateId, ...segment } of rows)
    map.set(templateId, [...(map.get(templateId) ?? []), segment]);
  return map;
}

type TemplateRow = typeof experienceTemplates.$inferSelect;

function toView(row: TemplateRow, segmentList: { id: number; name: string }[]): ExperienceTemplateView {
  return { ...row, indicators: row.indicators as IndicatorKey[], segments: segmentList };
}

/** Templates ordered by name; deactivated ones only when asked. */
export async function listExperienceTemplates(
  db: Database,
  options: { includeInactive?: boolean } = {},
): Promise<ExperienceTemplateView[]> {
  const query = db.select().from(experienceTemplates).orderBy(asc(experienceTemplates.name));
  const rows = await (options.includeInactive ? query : query.where(eq(experienceTemplates.active, true)));
  const segmentMap = await loadSegments(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) => toView(r, segmentMap.get(r.id) ?? []));
}

export async function getExperienceTemplate(
  db: Database,
  id: string,
): Promise<ExperienceTemplateView | null> {
  const [row] = await db.select().from(experienceTemplates).where(eq(experienceTemplates.id, id)).limit(1);
  if (!row) return null;
  return toView(row, (await loadSegments(db, [id])).get(id) ?? []);
}

async function replaceSegments(db: Database, templateId: string, segmentIds: number[]) {
  await db.delete(experienceTemplateSegments).where(eq(experienceTemplateSegments.templateId, templateId));
  const unique = [...new Set(segmentIds)];
  if (unique.length > 0) {
    await db
      .insert(experienceTemplateSegments)
      .values(unique.map((segmentId) => ({ templateId, segmentId })));
  }
}

export async function saveExperienceTemplate(
  db: Database,
  userId: string | null,
  input: ValidExperienceTemplateInput,
  templateId?: string,
): Promise<string> {
  const { segmentIds, ...data } = input;
  let id = templateId;
  if (id) {
    await db
      .update(experienceTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(experienceTemplates.id, id));
  } else {
    const [created] = await db
      .insert(experienceTemplates)
      .values(data)
      .returning({ id: experienceTemplates.id });
    id = created!.id;
  }
  await replaceSegments(db, id, segmentIds);
  await recordAudit(db, {
    userId,
    action: templateId ? "experience_template.updated" : "experience_template.created",
    entity: "experience_template",
    entityId: id,
  });
  return id;
}

export async function setExperienceTemplateActive(
  db: Database,
  userId: string | null,
  templateId: string,
  active: boolean,
) {
  await db
    .update(experienceTemplates)
    .set({ active, updatedAt: new Date() })
    .where(eq(experienceTemplates.id, templateId));
  await recordAudit(db, {
    userId,
    action: active ? "experience_template.activated" : "experience_template.deactivated",
    entity: "experience_template",
    entityId: templateId,
  });
}

/**
 * Example templates for the mall to review (P-INT-IA-1: the mall owns the final content). Runs only
 * when the catalog is empty, so it never duplicates or overwrites edited templates.
 * Returns how many templates were created.
 */
export async function seedExampleTemplates(db: Database): Promise<number> {
  if ((await db.select({ id: experienceTemplates.id }).from(experienceTemplates).limit(1)).length > 0)
    return 0;
  const segmentIds = new Map((await db.select().from(segments)).map((s) => [s.slug, s.id]));
  for (const example of EXAMPLE_TEMPLATES) {
    const { segmentSlugs, ...rest } = example;
    await saveExperienceTemplate(
      db,
      null,
      experienceTemplateInputSchema.parse({
        ...rest,
        segmentIds: segmentSlugs.flatMap((slug) => segmentIds.get(slug) ?? []),
        reviewStatus: "draft",
      }),
    );
  }
  return EXAMPLE_TEMPLATES.length;
}
