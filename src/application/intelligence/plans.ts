import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/application/audit";
import { commaListSchema } from "@/application/catalog/catalog";
import {
  AUDIENCES,
  OBJECTIVES,
  type Audience,
  type Objective,
} from "@/domain/intelligence/experience-catalog";
import { isDateKey } from "@/domain/time/time-zone";
import type { Database } from "@/infrastructure/db/client";
import {
  plans,
  planSegments,
  planStores,
  planVenues,
  segments,
  stores,
  venues,
} from "@/infrastructure/db/schema";

const MAX_PERIOD_DAYS = 366;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const money = z.coerce
  .number({ error: "Informe um valor em reais." })
  .int("Informe um valor inteiro em reais.")
  .min(0, "Informe um valor em reais.")
  .max(10_000_000);
const dateKey = z.string().refine(isDateKey, "Informe uma data válida.");
const optionalTime = z
  .string()
  .default("")
  .refine((v) => v === "" || TIME.test(v), "Use o formato HH:MM.")
  .transform((v) => (v === "" ? null : v));
const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00Z`) - Date.parse(`${from}T00:00Z`)) / 86_400_000;

export const planInputSchema = z
  .object({
    title: z.string().trim().min(2, "Dê um nome ao planejamento.").max(120),
    primaryObjective: z.enum(OBJECTIVES, { error: "Escolha o objetivo principal." }),
    secondaryObjectives: z.array(z.enum(OBJECTIVES)).max(OBJECTIVES.length).default([]),
    audiences: z
      .array(z.enum(AUDIENCES))
      .min(1, "Escolha ao menos um público desejado.")
      .max(AUDIENCES.length),
    interests: commaListSchema.transform((tags) => tags.slice(0, 10)),
    segmentIds: z.array(z.coerce.number().int().positive()).max(20).default([]),
    storeIds: z.array(z.uuid()).max(50).default([]),
    venueIds: z.array(z.uuid()).min(1, "Escolha ao menos um espaço disponível.").max(20),
    budgetMin: money,
    budgetMax: money,
    periodStart: dateKey,
    periodEnd: dateKey,
    preferredWeekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7).default([]),
    timeFrom: optionalTime,
    timeTo: optionalTime,
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (data.budgetMin > data.budgetMax)
      issue("budgetMax", "O orçamento máximo não pode ser menor que o mínimo.");
    const days = daysBetween(data.periodStart, data.periodEnd);
    if (days < 0) issue("periodEnd", "O fim do período não pode ser antes do início.");
    else if (days > MAX_PERIOD_DAYS) issue("periodEnd", "O período pode ter no máximo um ano.");
    if ((data.timeFrom === null) !== (data.timeTo === null)) {
      issue("timeTo", "Informe o início e o fim do horário, ou deixe os dois vazios.");
    } else if (data.timeFrom && data.timeTo && minutesOf(data.timeFrom) >= minutesOf(data.timeTo)) {
      issue("timeTo", "O horário final precisa ser depois do inicial.");
    }
  })
  .transform((data) => ({
    ...data,
    secondaryObjectives: [...new Set(data.secondaryObjectives)].filter((o) => o !== data.primaryObjective),
    audiences: [...new Set(data.audiences)],
    preferredWeekdays: [...new Set(data.preferredWeekdays)].sort(),
  }));
export type ValidPlanInput = z.output<typeof planInputSchema>;

type Named<T> = { id: T; name: string };

export interface PlanView {
  id: string;
  title: string;
  primaryObjective: Objective;
  secondaryObjectives: Objective[];
  audiences: Audience[];
  interests: string[];
  segments: Named<number>[];
  stores: Named<string>[];
  venues: Named<string>[];
  budgetMin: number;
  budgetMax: number;
  periodStart: string;
  periodEnd: string;
  preferredWeekdays: number[];
  timeFrom: string | null;
  timeTo: string | null;
  /** Longest daily window in minutes, or null when no time range was informed. */
  dailyWindowMinutes: number | null;
  archived: boolean;
  updatedAt: Date;
}

async function loadLinks(db: Database, planIds: string[]) {
  const empty = () => ({
    segments: [] as Named<number>[],
    stores: [] as Named<string>[],
    venues: [] as Named<string>[],
  });
  const map = new Map(planIds.map((id) => [id, empty()]));
  if (planIds.length === 0) return map;
  const [segmentRows, storeRows, venueRows] = await Promise.all([
    db
      .select({ planId: planSegments.planId, id: segments.id, name: segments.name })
      .from(planSegments)
      .innerJoin(segments, eq(segments.id, planSegments.segmentId))
      .where(inArray(planSegments.planId, planIds))
      .orderBy(asc(segments.name)),
    db
      .select({ planId: planStores.planId, id: stores.id, name: stores.name })
      .from(planStores)
      .innerJoin(stores, eq(stores.id, planStores.storeId))
      .where(inArray(planStores.planId, planIds))
      .orderBy(asc(stores.name)),
    db
      .select({ planId: planVenues.planId, id: venues.id, name: venues.name })
      .from(planVenues)
      .innerJoin(venues, eq(venues.id, planVenues.venueId))
      .where(inArray(planVenues.planId, planIds))
      .orderBy(asc(venues.name)),
  ]);
  for (const { planId, ...s } of segmentRows) map.get(planId)!.segments.push(s);
  for (const { planId, ...s } of storeRows) map.get(planId)!.stores.push(s);
  for (const { planId, ...v } of venueRows) map.get(planId)!.venues.push(v);
  return map;
}

type PlanRow = typeof plans.$inferSelect;

function toView(row: PlanRow, links: Pick<PlanView, "segments" | "stores" | "venues">): PlanView {
  return {
    id: row.id,
    title: row.title,
    primaryObjective: row.primaryObjective as Objective,
    secondaryObjectives: row.secondaryObjectives as Objective[],
    audiences: row.audiences as Audience[],
    interests: row.interests,
    ...links,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    preferredWeekdays: row.preferredWeekdays,
    timeFrom: row.timeFrom,
    timeTo: row.timeTo,
    dailyWindowMinutes: row.timeFrom && row.timeTo ? minutesOf(row.timeTo) - minutesOf(row.timeFrom) : null,
    archived: row.archived,
    updatedAt: row.updatedAt,
  };
}

/** Briefs, most recently updated first; archived ones only when asked. */
export async function listPlans(
  db: Database,
  options: { includeArchived?: boolean } = {},
): Promise<PlanView[]> {
  const query = db
    .select()
    .from(plans)
    .orderBy(asc(plans.archived), asc(plans.periodStart), asc(plans.title));
  const rows = await (options.includeArchived ? query : query.where(eq(plans.archived, false)));
  const links = await loadLinks(
    db,
    rows.map((r) => r.id),
  );
  return rows.map((r) => toView(r, links.get(r.id)!));
}

export async function getPlan(db: Database, planId: string): Promise<PlanView | null> {
  const [row] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!row) return null;
  return toView(row, (await loadLinks(db, [planId])).get(planId)!);
}

async function replaceLinks(db: Database, planId: string, input: ValidPlanInput) {
  await Promise.all([
    db.delete(planSegments).where(eq(planSegments.planId, planId)),
    db.delete(planStores).where(eq(planStores.planId, planId)),
    db.delete(planVenues).where(eq(planVenues.planId, planId)),
  ]);
  const unique = <T>(items: T[]) => [...new Set(items)];
  const segmentIds = unique(input.segmentIds);
  const storeIds = unique(input.storeIds);
  const venueIds = unique(input.venueIds);
  if (segmentIds.length)
    await db.insert(planSegments).values(segmentIds.map((segmentId) => ({ planId, segmentId })));
  if (storeIds.length) await db.insert(planStores).values(storeIds.map((storeId) => ({ planId, storeId })));
  if (venueIds.length) await db.insert(planVenues).values(venueIds.map((venueId) => ({ planId, venueId })));
}

export async function savePlan(
  db: Database,
  userId: string | null,
  input: ValidPlanInput,
  planId?: string,
): Promise<string> {
  const columns = {
    title: input.title,
    primaryObjective: input.primaryObjective,
    secondaryObjectives: input.secondaryObjectives,
    audiences: input.audiences,
    interests: input.interests,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    preferredWeekdays: input.preferredWeekdays,
    timeFrom: input.timeFrom,
    timeTo: input.timeTo,
  };
  let id = planId;
  if (id) {
    await db
      .update(plans)
      .set({ ...columns, updatedAt: new Date() })
      .where(eq(plans.id, id));
  } else {
    const [created] = await db
      .insert(plans)
      .values({ ...columns, createdBy: userId })
      .returning({ id: plans.id });
    id = created!.id;
  }
  await replaceLinks(db, id, input);
  await recordAudit(db, {
    userId,
    action: planId ? "plan.updated" : "plan.created",
    entity: "plan",
    entityId: id,
  });
  return id;
}

export async function setPlanArchived(
  db: Database,
  userId: string | null,
  planId: string,
  archived: boolean,
) {
  await db.update(plans).set({ archived, updatedAt: new Date() }).where(eq(plans.id, planId));
  await recordAudit(db, {
    userId,
    action: archived ? "plan.archived" : "plan.restored",
    entity: "plan",
    entityId: planId,
  });
}
