import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/application/audit";
import type { Database } from "@/infrastructure/db/client";
import { accessibilityFeatures, categories, venues } from "@/infrastructure/db/schema";

export function listCategories(db: Database) {
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder));
}

export function listAccessibilityFeatures(db: Database) {
  return db.select().from(accessibilityFeatures).orderBy(asc(accessibilityFeatures.name));
}

export function listVenues(db: Database, options: { includeInactive?: boolean } = {}) {
  const query = db.select().from(venues).orderBy(asc(venues.name));
  return options.includeInactive ? query : query.where(eq(venues.active, true));
}

/** Optional non-negative integer from a form field: empty means null. */
export const optionalIntSchema = z
  .union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(1_000_000)])
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

/** "energia, som, palco" → ["energia", "som", "palco"] (at most 20 items). */
export const commaListSchema = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 20),
  );

export const venueInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do espaço.").max(120),
  floor: z.string().trim().max(40).default(""),
  reference: z.string().trim().max(200).default(""),
  areaSquareMeters: optionalIntSchema,
  capacity: optionalIntSchema,
  facilities: commaListSchema,
});
export type VenueInput = z.input<typeof venueInputSchema>;
export type ValidVenueInput = z.output<typeof venueInputSchema>;

export async function saveVenue(
  db: Database,
  userId: string | null,
  data: ValidVenueInput,
  venueId?: string,
) {
  if (venueId) {
    await db
      .update(venues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(venues.id, venueId));
    await recordAudit(db, { userId, action: "venue.updated", entity: "venue", entityId: venueId });
    return venueId;
  }
  const [created] = await db.insert(venues).values(data).returning({ id: venues.id });
  await recordAudit(db, { userId, action: "venue.created", entity: "venue", entityId: created!.id });
  return created!.id;
}

export async function setVenueActive(db: Database, userId: string | null, venueId: string, active: boolean) {
  await db.update(venues).set({ active, updatedAt: new Date() }).where(eq(venues.id, venueId));
  await recordAudit(db, {
    userId,
    action: active ? "venue.activated" : "venue.deactivated",
    entity: "venue",
    entityId: venueId,
  });
}
