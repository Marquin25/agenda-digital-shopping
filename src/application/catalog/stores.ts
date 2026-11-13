import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/application/audit";
import { slugify } from "@/domain/text/normalize";
import type { Database } from "@/infrastructure/db/client";
import { segments, stores } from "@/infrastructure/db/schema";

/** Business rule violations shown to staff as form messages. */
export class StoreRuleError extends Error {}

export const segmentInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do segmento.").max(60),
});
export type ValidSegmentInput = z.output<typeof segmentInputSchema>;

/** Store data is business data only: no names, phones or e-mails of people (docs/spec/04). */
export const storeInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(120),
  segmentId: z.coerce.number({ error: "Escolha o segmento." }).int().positive("Escolha o segmento."),
  floor: z.string().trim().max(40).default(""),
});
export type ValidStoreInput = z.output<typeof storeInputSchema>;

export interface StoreView {
  id: string;
  name: string;
  floor: string;
  active: boolean;
  segmentId: number;
  segmentName: string;
}

export function listSegments(db: Database, options: { includeInactive?: boolean } = {}) {
  const query = db.select().from(segments).orderBy(asc(segments.name));
  return options.includeInactive ? query : query.where(eq(segments.active, true));
}

async function uniqueSegmentSlug(db: Database, name: string): Promise<string> {
  const base = slugify(name) || "segmento";
  const taken = new Set((await db.select({ slug: segments.slug }).from(segments)).map((s) => s.slug));
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function saveSegment(
  db: Database,
  userId: string | null,
  data: ValidSegmentInput,
  segmentId?: number,
): Promise<number> {
  // Same name ignoring case and accents ("alimentacao" = "Alimentação") is a duplicate.
  const key = slugify(data.name);
  const all = await db.select({ id: segments.id, name: segments.name }).from(segments);
  if (all.some((s) => s.id !== segmentId && slugify(s.name) === key)) {
    throw new StoreRuleError("Já existe um segmento com esse nome.");
  }
  if (segmentId) {
    await db
      .update(segments)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(segments.id, segmentId));
    await recordAudit(db, {
      userId,
      action: "segment.updated",
      entity: "segment",
      entityId: String(segmentId),
    });
    return segmentId;
  }
  const [created] = await db
    .insert(segments)
    .values({ name: data.name, slug: await uniqueSegmentSlug(db, data.name) })
    .returning({ id: segments.id });
  await recordAudit(db, {
    userId,
    action: "segment.created",
    entity: "segment",
    entityId: String(created!.id),
  });
  return created!.id;
}

export async function setSegmentActive(
  db: Database,
  userId: string | null,
  segmentId: number,
  active: boolean,
) {
  await db.update(segments).set({ active, updatedAt: new Date() }).where(eq(segments.id, segmentId));
  await recordAudit(db, {
    userId,
    action: active ? "segment.activated" : "segment.deactivated",
    entity: "segment",
    entityId: String(segmentId),
  });
}

/** Stores ordered by segment and name; inactive stores or segments only when asked. */
export async function listStores(
  db: Database,
  options: { includeInactive?: boolean } = {},
): Promise<StoreView[]> {
  return db
    .select({
      id: stores.id,
      name: stores.name,
      floor: stores.floor,
      active: stores.active,
      segmentId: stores.segmentId,
      segmentName: segments.name,
    })
    .from(stores)
    .innerJoin(segments, eq(segments.id, stores.segmentId))
    .where(options.includeInactive ? undefined : and(eq(stores.active, true), eq(segments.active, true)))
    .orderBy(asc(segments.name), asc(stores.name));
}

export async function saveStore(
  db: Database,
  userId: string | null,
  data: ValidStoreInput,
  storeId?: string,
): Promise<string> {
  const [segment] = await db.select().from(segments).where(eq(segments.id, data.segmentId)).limit(1);
  const [current] = storeId ? await db.select().from(stores).where(eq(stores.id, storeId)).limit(1) : [];
  // An inactive segment can be kept by a store that already had it, but not chosen anew.
  if (!segment || (!segment.active && current?.segmentId !== segment.id)) {
    throw new StoreRuleError("Escolha um segmento ativo.");
  }
  if (storeId) {
    await db
      .update(stores)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stores.id, storeId));
    await recordAudit(db, { userId, action: "store.updated", entity: "store", entityId: storeId });
    return storeId;
  }
  const [created] = await db.insert(stores).values(data).returning({ id: stores.id });
  await recordAudit(db, { userId, action: "store.created", entity: "store", entityId: created!.id });
  return created!.id;
}

export async function setStoreActive(db: Database, userId: string | null, storeId: string, active: boolean) {
  await db.update(stores).set({ active, updatedAt: new Date() }).where(eq(stores.id, storeId));
  await recordAudit(db, {
    userId,
    action: active ? "store.activated" : "store.deactivated",
    entity: "store",
    entityId: storeId,
  });
}
