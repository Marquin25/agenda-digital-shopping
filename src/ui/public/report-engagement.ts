import type { EngagementAction } from "@/domain/metrics/engagement";

/** Fire-and-forget: survives navigation (keepalive) and never breaks the page. */
export function reportEngagement(eventId: string, action: EngagementAction): void {
  fetch("/api/metrics/engagement", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId, action }),
    keepalive: true,
  }).catch(() => {
    /* metrics must never break the page */
  });
}
