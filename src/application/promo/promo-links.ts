import { randomInt } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "@/application/audit";
import { parseAgendaFilters, toAgendaQueryString } from "@/domain/agenda/agenda-filters";
import { PROMO_CHANNELS, type PromoChannel } from "@/domain/metrics/traffic-source";
import type { Database } from "@/infrastructure/db/client";
import { events, promoLinks } from "@/infrastructure/db/schema";

// No 0/o/1/l to keep printed codes legible.
const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;

export function generatePromoCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export const promoLinkInputSchema = z.object({
  channel: z.enum(PROMO_CHANNELS as [PromoChannel, ...PromoChannel[]], "Escolha o canal."),
  description: z.string().trim().min(3, "Descreva onde o link será usado.").max(120),
  eventId: z
    .union([z.literal(""), z.uuid()])
    .transform((v) => (v === "" ? null : v))
    .default(null),
  agendaQuery: z.string().max(500).default(""),
});
export type PromoLinkInput = z.input<typeof promoLinkInputSchema>;

export async function createPromoLink(db: Database, userId: string, input: PromoLinkInput): Promise<{ id: string; code: string }> {
  const data = promoLinkInputSchema.parse(input);
  // Agenda filters are re-serialised so only known, safe parameters end up in the redirect.
  const agendaQuery = data.eventId ? "" : toAgendaQueryString(parseAgendaFilters(new URLSearchParams(data.agendaQuery)));
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePromoCode();
    const inserted = await db
      .insert(promoLinks)
      .values({ ...data, agendaQuery, code, createdBy: userId })
      .onConflictDoNothing({ target: promoLinks.code })
      .returning({ id: promoLinks.id });
    if (inserted[0]) {
      await recordAudit(db, { userId, action: "promo_link.created", entity: "promo_link", entityId: inserted[0].id });
      return { id: inserted[0].id, code };
    }
  }
  throw new Error("Could not allocate a unique promo code");
}

export async function setPromoLinkActive(db: Database, userId: string, id: string, active: boolean) {
  await db.update(promoLinks).set({ active }).where(eq(promoLinks.id, id));
  await recordAudit(db, { userId, action: active ? "promo_link.activated" : "promo_link.deactivated", entity: "promo_link", entityId: id });
}

export function listPromoLinks(db: Database) {
  return db
    .select({ link: promoLinks, eventTitle: events.title, eventSlug: events.slug })
    .from(promoLinks)
    .leftJoin(events, eq(events.id, promoLinks.eventId))
    .orderBy(desc(promoLinks.createdAt));
}

export async function getPromoLink(db: Database, id: string) {
  const [row] = await db
    .select({ link: promoLinks, eventSlug: events.slug })
    .from(promoLinks)
    .leftJoin(events, eq(events.id, promoLinks.eventId))
    .where(eq(promoLinks.id, id))
    .limit(1);
  return row ?? null;
}

export interface PromoRedirect {
  promoLinkId: string;
  /** Relative path including campaign parameters, e.g. "/eventos/show?utm_source=instagram&utm_campaign=ab12cd". */
  location: string;
}

/** Resolves `/r/{code}`. Inactive or unknown codes fall back to the agenda without attribution. */
export async function resolvePromoRedirect(db: Database, code: string): Promise<PromoRedirect | null> {
  const [row] = await db
    .select({ link: promoLinks, eventSlug: events.slug })
    .from(promoLinks)
    .leftJoin(events, eq(events.id, promoLinks.eventId))
    .where(and(eq(promoLinks.code, code), eq(promoLinks.active, true)))
    .limit(1);
  if (!row) return null;
  const params = new URLSearchParams(row.eventSlug ? "" : row.link.agendaQuery);
  params.set("utm_source", row.link.channel);
  params.set("utm_medium", "promo_link");
  params.set("utm_campaign", row.link.code);
  const path = row.eventSlug ? `/eventos/${row.eventSlug}` : "/";
  return { promoLinkId: row.link.id, location: `${path}?${params.toString()}` };
}

export function promoLinkUrl(baseUrl: string, code: string): string {
  return `${baseUrl}/r/${code}`;
}
