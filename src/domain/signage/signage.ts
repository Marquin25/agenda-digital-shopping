import { parseAgendaFilters, type AgendaFilters } from "@/domain/agenda/agenda-filters";
import type { EventStatus } from "@/domain/events/event-status";

/** Per-screen parameters of /painel, in Portuguese because staff type them into the player (docs/spec/09 B-45). */
export const SIGNAGE_PARAMS = { screen: "tela", interval: "intervalo", limit: "limite" } as const;

/** Seconds each highlight stays on screen. WCAG 2.2.2: moving content can be paused (see the carousel). */
export const SIGNAGE_INTERVAL_SECONDS = { min: 6, max: 60, default: 12 } as const;
export const SIGNAGE_LIMIT = { min: 1, max: 12, default: 8 } as const;

/** Origin recorded for visits that start from a QR shown on a screen (alias of "digital_signage"). */
export const SIGNAGE_SOURCE = "painel";

const SCREEN = /^[a-z0-9-]{1,32}$/;

export interface SignageSettings {
  /** Screen name, sent as the campaign of the QR links so each screen can be told apart. */
  screen: string | null;
  intervalMs: number;
  limit: number;
  filters: AgendaFilters;
}

function clampedInteger(raw: string | null, range: { min: number; max: number; default: number }) {
  if (raw === null || !/^\d+$/.test(raw)) return range.default;
  return Math.min(range.max, Math.max(range.min, Number(raw)));
}

export function parseSignageSettings(params: URLSearchParams): SignageSettings {
  const screen = params.get(SIGNAGE_PARAMS.screen) ?? "";
  return {
    screen: SCREEN.test(screen) ? screen : null,
    intervalMs: clampedInteger(params.get(SIGNAGE_PARAMS.interval), SIGNAGE_INTERVAL_SECONDS) * 1000,
    limit: clampedInteger(params.get(SIGNAGE_PARAMS.limit), SIGNAGE_LIMIT),
    // Same category, accessibility and date filters as the agenda; a screen has no free-text search.
    filters: { ...parseAgendaFilters(params), query: "" },
  };
}

function trackedUrl(baseUrl: string, path: string, screen: string | null): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set("utm_source", SIGNAGE_SOURCE);
  if (screen) url.searchParams.set("utm_campaign", screen);
  return url.toString();
}

export const signageEventUrl = (baseUrl: string, slug: string, screen: string | null) =>
  trackedUrl(baseUrl, `/eventos/${encodeURIComponent(slug)}`, screen);

export const signageAgendaUrl = (baseUrl: string, screen: string | null) => trackedUrl(baseUrl, "/", screen);

/** What a screen shows: events happening now, then the next ones; never cancelled or ended events. */
export function selectHighlights<T extends { status: EventStatus; startsAt: Date }>(
  events: T[],
  limit: number,
): T[] {
  const visible = events.filter((e) => e.status === "ongoing" || e.status === "scheduled");
  const rank = (e: T) => (e.status === "ongoing" ? 0 : 1);
  return [...visible]
    .sort((a, b) => rank(a) - rank(b) || a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, limit);
}

export function nextSlideIndex(index: number, count: number): number {
  return count > 1 ? (index + 1) % count : 0;
}
