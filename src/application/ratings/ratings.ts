import { and, desc, eq, gt, inArray, isNotNull, lte, sql, type SQL } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import {
  RATING_TAGS,
  ratingWindow,
  ratingWindowState,
  summarizeRatings,
  type RatingInput,
  type RatingSummary,
  type RatingTag,
  type RatingWindow,
  type RatingWindowState,
} from "@/domain/ratings/rating";
import type { Database } from "@/infrastructure/db/client";
import { eventRatings, events } from "@/infrastructure/db/schema";

export interface RatingContext {
  eventId: string;
  slug: string;
  title: string;
  window: RatingWindow;
  state: RatingWindowState;
}

/** Only published events can be rated (drafts are private; cancelled events did not happen). */
async function loadRateableEvent(db: Database, where: ReturnType<typeof eq>) {
  const [row] = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      endsAt: events.endsAt,
      endedAt: events.endedAt,
      ratingPeriodDays: events.ratingPeriodDays,
    })
    .from(events)
    .where(and(where, eq(events.publicationStatus, "published")))
    .limit(1);
  return row ?? null;
}

export async function getRatingContext(
  db: Database,
  slug: string,
  now = new Date(),
): Promise<RatingContext | null> {
  const event = await loadRateableEvent(db, eq(events.slug, slug));
  if (!event) return null;
  const window = ratingWindow(event, event.ratingPeriodDays);
  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    window,
    state: ratingWindowState(window, now),
  };
}

export async function hasRated(db: Database, eventId: string, deviceHash: string): Promise<boolean> {
  const rows = await db
    .select({ id: eventRatings.id })
    .from(eventRatings)
    .where(and(eq(eventRatings.eventId, eventId), eq(eventRatings.deviceHash, deviceHash)))
    .limit(1);
  return rows.length > 0;
}

export type SubmitRatingResult = "recorded" | "already_rated" | "not_open" | "closed" | "unavailable";

/** One rating per device and event; the unique index is the source of truth (docs/spec/03 §5). */
export async function submitRating(
  db: Database,
  rating: { eventId: string; deviceHash: string; input: RatingInput; now?: Date },
): Promise<SubmitRatingResult> {
  const now = rating.now ?? new Date();
  const event = await loadRateableEvent(db, eq(events.id, rating.eventId));
  if (!event) return "unavailable";
  const state = ratingWindowState(ratingWindow(event, event.ratingPeriodDays), now);
  if (state !== "open") return state;
  const inserted = await db
    .insert(eventRatings)
    .values({
      eventId: event.id,
      deviceHash: rating.deviceHash,
      score: rating.input.score,
      tags: rating.input.tags,
      comment: rating.input.comment,
      createdAt: now,
    })
    .onConflictDoNothing({ target: [eventRatings.eventId, eventRatings.deviceHash] })
    .returning({ id: eventRatings.id });
  return inserted.length > 0 ? "recorded" : "already_rated";
}

export interface EventRatingReport {
  summary: RatingSummary;
  /** How many visible ratings selected each tag. */
  tags: Record<RatingTag, number>;
  /** Ratings hidden by moderation, left out of every number above. */
  hiddenCount: number;
}

/** Aggregates for staff (docs/spec/06 §4): never returns device hashes. */
export async function getEventRatingReport(db: Database, eventId: string): Promise<EventRatingReport> {
  const rows = await db
    .select({ score: eventRatings.score, tags: eventRatings.tags, hidden: eventRatings.hidden })
    .from(eventRatings)
    .where(eq(eventRatings.eventId, eventId));
  const visible = rows.filter((r) => !r.hidden);
  const tags = Object.fromEntries(RATING_TAGS.map((t) => [t, 0])) as Record<RatingTag, number>;
  for (const row of visible) for (const tag of row.tags) if (tag in tags) tags[tag as RatingTag]++;
  return {
    summary: summarizeRatings(visible.map((r) => r.score)),
    tags,
    hiddenCount: rows.length - visible.length,
  };
}

export interface ModeratedRating {
  id: string;
  eventId: string;
  eventTitle: string;
  score: number;
  tags: RatingTag[];
  comment: string | null;
  hidden: boolean;
  createdAt: Date;
}

/** Moderation list (B-28): newest first and never with the device hash (docs/spec/06 §4). */
export async function listRatingsForModeration(
  db: Database,
  filter: { eventId?: string; withComment?: boolean; limit?: number } = {},
): Promise<ModeratedRating[]> {
  const conditions: SQL[] = [];
  if (filter.eventId) conditions.push(eq(eventRatings.eventId, filter.eventId));
  if (filter.withComment) conditions.push(isNotNull(eventRatings.comment));
  const rows = await db
    .select({
      id: eventRatings.id,
      eventId: eventRatings.eventId,
      eventTitle: events.title,
      score: eventRatings.score,
      tags: eventRatings.tags,
      comment: eventRatings.comment,
      hidden: eventRatings.hidden,
      createdAt: eventRatings.createdAt,
    })
    .from(eventRatings)
    .innerJoin(events, eq(events.id, eventRatings.eventId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(eventRatings.createdAt))
    .limit(filter.limit ?? 200);
  const known = (t: string): t is RatingTag => (RATING_TAGS as readonly string[]).includes(t);
  return rows.map((r) => ({ ...r, tags: r.tags.filter(known) }));
}

/** Hides (or shows again) one rating; hidden ratings leave every aggregate. Audited without the comment. */
export async function setRatingHidden(
  db: Database,
  userId: string,
  ratingId: string,
  hidden: boolean,
): Promise<boolean> {
  const updated = await db
    .update(eventRatings)
    .set({ hidden })
    .where(eq(eventRatings.id, ratingId))
    .returning({ eventId: eventRatings.eventId });
  if (updated.length === 0) return false;
  await recordAudit(db, {
    userId,
    action: hidden ? "rating.hide" : "rating.show",
    entity: "event_rating",
    entityId: ratingId,
    details: { eventId: updated[0]!.eventId },
  });
  return true;
}

export interface RateableEvent {
  eventId: string;
  slug: string;
  title: string;
  endedAt: Date;
  closesAt: Date;
  /** Whether this device already rated the event. */
  rated: boolean;
}

/**
 * Recently ended events still open for rating (B-27, docs/spec/02 `/eventos/encerrados`): published,
 * ended, and within their own rating period; the most recently ended first.
 */
export async function listRateableEvents(
  db: Database,
  { now = new Date(), deviceHash }: { now?: Date; deviceHash: string | null },
): Promise<RateableEvent[]> {
  const endedAt = sql<Date>`coalesce(${events.endedAt}, ${events.endsAt})`;
  const closesAt = sql`${endedAt} + make_interval(days => ${events.ratingPeriodDays})`;
  const rows = await db
    .select({
      eventId: events.id,
      slug: events.slug,
      title: events.title,
      endsAt: events.endsAt,
      endedAt: events.endedAt,
      ratingPeriodDays: events.ratingPeriodDays,
    })
    .from(events)
    .where(and(eq(events.publicationStatus, "published"), lte(endedAt, now), gt(closesAt, now)))
    .orderBy(desc(endedAt), events.title)
    .limit(50);
  const rated = new Set<string>();
  if (deviceHash && rows.length > 0) {
    const mine = await db
      .select({ eventId: eventRatings.eventId })
      .from(eventRatings)
      .where(
        and(
          eq(eventRatings.deviceHash, deviceHash),
          inArray(
            eventRatings.eventId,
            rows.map((r) => r.eventId),
          ),
        ),
      );
    for (const row of mine) rated.add(row.eventId);
  }
  return rows.map((row) => {
    const window = ratingWindow(row, row.ratingPeriodDays);
    return {
      eventId: row.eventId,
      slug: row.slug,
      title: row.title,
      endedAt: window.opensAt,
      closesAt: window.closesAt,
      rated: rated.has(row.eventId),
    };
  });
}
