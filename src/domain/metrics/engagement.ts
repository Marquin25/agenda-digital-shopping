/** Visitor actions on an event page (docs/spec/03 §3). They measure intent, not completion. */
export const ENGAGEMENT_ACTIONS = ["share", "calendar_ics", "calendar_google"] as const;
export type EngagementAction = (typeof ENGAGEMENT_ACTIONS)[number];

export function isEngagementAction(value: unknown): value is EngagementAction {
  return typeof value === "string" && (ENGAGEMENT_ACTIONS as readonly string[]).includes(value);
}
