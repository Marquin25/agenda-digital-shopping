/**
 * Post-event rating rules (docs/spec/03 §5 and §8, B-26): open from the event's end until N days later,
 * no check-in required, one per device. Ratings without a check-in do not prove attendance.
 */

/** Days the rating stays open after the event ends (P-PROD-2 proposes 7). */
export const RATING_PERIOD_DAYS = { min: 1, max: 30, default: 7 } as const;
export const MAX_COMMENT_LENGTH = 280;
/** Minimum time between showing the form and sending it; faster submissions are dropped silently. */
export const MIN_FILL_MS = 3_000;

export const RATING_SCORES = [1, 2, 3, 4, 5] as const;
export type RatingScore = (typeof RATING_SCORES)[number];

export const SCORE_LABELS: Record<RatingScore, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export const RATING_TAGS = ["organizacao", "horario", "atracao", "conforto"] as const;
export type RatingTag = (typeof RATING_TAGS)[number];

export const RATING_TAG_LABELS: Record<RatingTag, string> = {
  organizacao: "Organização",
  horario: "Horário",
  atracao: "Atração",
  conforto: "Conforto",
};

/** Shown wherever ratings are counted (docs/spec/03 §8). */
export const RATING_ATTENDANCE_NOTICE = "Avaliações sem check-in não comprovam participação.";

export interface RatingWindow {
  opensAt: Date;
  closesAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function ratingWindow(
  event: { endsAt: Date; endedAt: Date | null },
  periodDays: number,
): RatingWindow {
  const opensAt = event.endedAt ?? event.endsAt;
  return { opensAt, closesAt: new Date(opensAt.getTime() + periodDays * DAY_MS) };
}

export type RatingWindowState = "not_open" | "open" | "closed";

export function ratingWindowState(window: RatingWindow, now: Date): RatingWindowState {
  if (now < window.opensAt) return "not_open";
  return now < window.closesAt ? "open" : "closed";
}

export interface RatingInput {
  score: RatingScore;
  tags: RatingTag[];
  comment: string | null;
}

export type RatingFormErrors = Partial<Record<"score" | "tags" | "comment", string>>;

export function parseRatingForm(form: {
  score: string | undefined;
  tags: string[];
  comment: string | undefined;
}): { ok: true; value: RatingInput } | { ok: false; errors: RatingFormErrors } {
  const errors: RatingFormErrors = {};
  const score = /^[1-5]$/.test(form.score ?? "") ? (Number(form.score) as RatingScore) : null;
  if (score === null) errors.score = "Escolha uma nota de 1 a 5.";
  const tags = [...new Set(form.tags)];
  if (!tags.every((t): t is RatingTag => (RATING_TAGS as readonly string[]).includes(t)))
    errors.tags = "Escolha só entre as opções da lista.";
  const comment = (form.comment ?? "").trim();
  if (comment.length > MAX_COMMENT_LENGTH)
    errors.comment = `O comentário pode ter até ${MAX_COMMENT_LENGTH} caracteres.`;
  if (Object.keys(errors).length > 0 || score === null) return { ok: false, errors };
  return { ok: true, value: { score, tags: tags as RatingTag[], comment: comment || null } };
}

/** Heuristic only (docs/spec/03 §5): a filled hidden field or a form sent in under 3 s. */
export function isLikelyAutomated(form: {
  honeypot: string | undefined;
  startedAt: string | undefined;
  now: number;
}) {
  if (form.honeypot) return true;
  if (!/^\d{1,15}$/.test(form.startedAt ?? "")) return true;
  return form.now - Number(form.startedAt) < MIN_FILL_MS;
}

export interface RatingSummary {
  count: number;
  /** Mean score, one decimal; null without ratings. */
  average: number | null;
  /** Share of 4–5 scores (0–1); null without ratings. CSAT, not NPS. */
  csat: number | null;
  distribution: Record<RatingScore, number>;
}

export function summarizeRatings(scores: number[]): RatingSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<RatingScore, number>;
  for (const s of scores) if (s in distribution) distribution[s as RatingScore]++;
  const count = scores.length;
  if (count === 0) return { count, average: null, csat: null, distribution };
  const average = Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10;
  return { count, average, csat: (distribution[4] + distribution[5]) / count, distribution };
}
