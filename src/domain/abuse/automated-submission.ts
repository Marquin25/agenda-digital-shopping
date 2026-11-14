/**
 * Anti-abuse layer shared by public forms (docs/spec/03 §5): a hidden field people never fill and a
 * minimum filling time. Matching submissions are dropped silently, with the same answer people get.
 */

/** Minimum time between showing the form and sending it. */
export const MIN_FILL_MS = 3_000;

/** Heuristic only: a filled hidden field, a form sent in under 3 s, or a missing or invalid start time. */
export function isLikelyAutomated(form: {
  honeypot: string | undefined;
  startedAt: string | undefined;
  now: number;
}) {
  if (form.honeypot) return true;
  if (!/^\d{1,15}$/.test(form.startedAt ?? "")) return true;
  return form.now - Number(form.startedAt) < MIN_FILL_MS;
}
