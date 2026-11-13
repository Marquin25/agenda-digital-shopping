export const PUBLICATION_STATUSES = ["draft", "published", "cancelled"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type EventStatus = "draft" | "cancelled" | "scheduled" | "ongoing" | "ended";

export interface EventSchedule {
  publicationStatus: PublicationStatus;
  startsAt: Date;
  endsAt: Date;
  /** Set when staff ends the event manually ("Encerrar evento"). */
  endedAt: Date | null;
}

/** Temporal status is derived from dates so it can never be left stale by hand (docs/spec/04 §Status). */
export function getEventStatus(event: EventSchedule, now: Date): EventStatus {
  if (event.publicationStatus === "draft") return "draft";
  if (event.publicationStatus === "cancelled") return "cancelled";
  const effectiveEnd = event.endedAt ?? event.endsAt;
  if (now.getTime() >= effectiveEnd.getTime()) return "ended";
  if (now.getTime() >= event.startsAt.getTime()) return "ongoing";
  return "scheduled";
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Rascunho",
  cancelled: "Cancelado",
  scheduled: "Agendado",
  ongoing: "Em andamento",
  ended: "Encerrado",
};
