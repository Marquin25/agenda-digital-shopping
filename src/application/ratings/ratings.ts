import { and, eq } from "drizzle-orm";
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
