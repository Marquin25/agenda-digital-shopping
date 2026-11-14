import { and, eq } from "drizzle-orm";
import { getEventStatus } from "@/domain/events/event-status";
import type { Database } from "@/infrastructure/db/client";
import { eventInterests, events } from "@/infrastructure/db/schema";

/**
 * "Tenho interesse" (B-20, docs/spec/01 RF08): one per device and event, turned on and off by the visitor.
 * It is not a reservation and not attendance (docs/spec/03 §6); it only feeds the estimated
 * "Interessados" indicator.
 */
export type SetInterestResult = "on" | "off" | "unavailable";

/** Interest can change only while a published event has not ended (cancelled and drafts excluded). */
async function acceptsInterest(db: Database, eventId: string, now: Date): Promise<boolean> {
  const [event] = await db
    .select({
      publicationStatus: events.publicationStatus,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      endedAt: events.endedAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return false;
  const status = getEventStatus(event, now);
  return status === "scheduled" || status === "ongoing";
}

/** Idempotent in both directions: the primary key (event, device) is the source of truth. */
export async function setInterest(
  db: Database,
  input: { eventId: string; deviceHash: string; interested: boolean; now?: Date },
): Promise<SetInterestResult> {
  if (!(await acceptsInterest(db, input.eventId, input.now ?? new Date()))) return "unavailable";
  if (input.interested) {
    await db
      .insert(eventInterests)
      .values({ eventId: input.eventId, deviceHash: input.deviceHash })
      .onConflictDoNothing();
    return "on";
  }
  await db
    .delete(eventInterests)
    .where(and(eq(eventInterests.eventId, input.eventId), eq(eventInterests.deviceHash, input.deviceHash)));
  return "off";
}

export async function isInterested(db: Database, eventId: string, deviceHash: string): Promise<boolean> {
  const rows = await db
    .select({ eventId: eventInterests.eventId })
    .from(eventInterests)
    .where(and(eq(eventInterests.eventId, eventId), eq(eventInterests.deviceHash, deviceHash)))
    .limit(1);
  return rows.length > 0;
}
