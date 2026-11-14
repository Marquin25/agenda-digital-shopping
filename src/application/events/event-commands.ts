import { and, eq } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import { slugify, normalizeSearchText } from "@/domain/text/normalize";
import type { Database } from "@/infrastructure/db/client";
import { eventAccessibilityFeatures, events, eventStores } from "@/infrastructure/db/schema";
import type { ValidEventInput } from "./event-input";

export class EventRuleError extends Error {}

/** Static pages under /eventos/ that an event slug must not shadow. */
const RESERVED_EVENT_SLUGS = new Set(["encerrados"]);

async function uniqueSlug(db: Database, title: string): Promise<string> {
  const base = slugify(title) || "evento";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    if (RESERVED_EVENT_SLUGS.has(candidate)) continue;
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function columnsFrom(input: ValidEventInput) {
  return {
    title: input.title,
    description: input.description,
    searchText: normalizeSearchText(`${input.title} ${input.description}`),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    venueId: input.venueId,
    locationDetail: input.locationDetail,
    categoryId: input.categoryId,
    admissionInfo: input.admissionInfo,
    capacityMode: input.capacityMode,
    displayedCapacity: input.displayedCapacity,
    ratingPeriodDays: input.ratingPeriodDays,
  };
}

async function replaceFeatures(db: Database, eventId: string, featureIds: number[]) {
  await db.delete(eventAccessibilityFeatures).where(eq(eventAccessibilityFeatures.eventId, eventId));
  const unique = [...new Set(featureIds)];
  if (unique.length > 0) {
    await db.insert(eventAccessibilityFeatures).values(unique.map((featureId) => ({ eventId, featureId })));
  }
}

async function replaceStores(db: Database, eventId: string, storeIds: string[]) {
  await db.delete(eventStores).where(eq(eventStores.eventId, eventId));
  const unique = [...new Set(storeIds)];
  if (unique.length > 0) await db.insert(eventStores).values(unique.map((storeId) => ({ eventId, storeId })));
}

export async function createEvent(
  db: Database,
  userId: string | null,
  input: ValidEventInput,
  banner: { path: string } | null,
): Promise<string> {
  if (banner && !input.bannerAlt) throw new EventRuleError("Descreva a imagem (texto alternativo).");
  const slug = await uniqueSlug(db, input.title);
  const [created] = await db
    .insert(events)
    .values({
      ...columnsFrom(input),
      slug,
      bannerPath: banner?.path ?? null,
      bannerAlt: banner ? input.bannerAlt : null,
      planId: input.planId,
      experienceTemplateId: input.experienceTemplateId,
      createdBy: userId,
    })
    .returning({ id: events.id });
  const eventId = created!.id;
  await replaceFeatures(db, eventId, input.featureIds);
  await replaceStores(db, eventId, input.storeIds);
  await recordAudit(db, { userId, action: "event.created", entity: "event", entityId: eventId });
  return eventId;
}

export async function updateEvent(
  db: Database,
  userId: string | null,
  eventId: string,
  input: ValidEventInput,
  banner: { path: string } | null,
): Promise<{ replacedBannerPath: string | null }> {
  const [current] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!current) throw new EventRuleError("Evento não encontrado.");
  const bannerPath = banner?.path ?? current.bannerPath;
  if (bannerPath && !input.bannerAlt) throw new EventRuleError("Descreva a imagem (texto alternativo).");
  await db
    .update(events)
    .set({
      ...columnsFrom(input),
      bannerPath,
      bannerAlt: bannerPath ? input.bannerAlt : null,
      icsSequence: current.icsSequence + 1,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
  await replaceFeatures(db, eventId, input.featureIds);
  await replaceStores(db, eventId, input.storeIds);
  await recordAudit(db, { userId, action: "event.updated", entity: "event", entityId: eventId });
  const replaced = banner && current.bannerPath && current.bannerPath !== banner.path;
  return { replacedBannerPath: replaced ? current.bannerPath : null };
}

async function transition(
  db: Database,
  userId: string | null,
  eventId: string,
  action: string,
  allowedFrom: ReadonlyArray<"draft" | "published" | "cancelled">,
  changes: Partial<typeof events.$inferInsert>,
) {
  const [current] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!current) throw new EventRuleError("Evento não encontrado.");
  if (!allowedFrom.includes(current.publicationStatus)) {
    throw new EventRuleError("Essa ação não está disponível para o status atual do evento.");
  }
  await db
    .update(events)
    .set({ ...changes, icsSequence: current.icsSequence + 1, updatedAt: new Date() })
    .where(eq(events.id, eventId));
  await recordAudit(db, { userId, action, entity: "event", entityId: eventId });
  return current;
}

export async function publishEvent(db: Database, userId: string | null, eventId: string, now = new Date()) {
  await transition(db, userId, eventId, "event.published", ["draft"], {
    publicationStatus: "published",
    publishedAt: now,
  });
}

export async function cancelEvent(db: Database, userId: string | null, eventId: string) {
  await transition(db, userId, eventId, "event.cancelled", ["published"], { publicationStatus: "cancelled" });
}

/** "Encerrar evento": records the real end; status stays derived from dates. */
export async function endEventNow(db: Database, userId: string | null, eventId: string, now = new Date()) {
  const [current] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!current) throw new EventRuleError("Evento não encontrado.");
  if (current.startsAt > now) throw new EventRuleError("Só é possível encerrar um evento que já começou.");
  await transition(db, userId, eventId, "event.ended", ["published"], { endedAt: now });
}

/** Only drafts can be deleted; published events must be cancelled instead. */
export async function deleteDraftEvent(db: Database, userId: string | null, eventId: string) {
  const deleted = await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.publicationStatus, "draft")))
    .returning({ id: events.id });
  if (deleted.length === 0) throw new EventRuleError("Apenas rascunhos podem ser excluídos.");
  await recordAudit(db, { userId, action: "event.deleted", entity: "event", entityId: eventId });
}
