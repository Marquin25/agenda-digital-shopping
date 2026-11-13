import { EVENT_STATUS_LABELS, type EventStatus } from "@/domain/events/event-status";

export function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={`status status--${status}`}>{EVENT_STATUS_LABELS[status]}</span>;
}
