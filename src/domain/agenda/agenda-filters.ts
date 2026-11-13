import { addDaysToDateKey, isDateKey, weekdayOf } from "@/domain/time/time-zone";

export type DateFilter =
  { kind: "all" } | { kind: "today" } | { kind: "weekend" } | { kind: "range"; from: string; to: string };

export interface AgendaFilters {
  query: string;
  categories: string[];
  features: string[];
  date: DateFilter;
}

/** Public URL parameter names are in Portuguese because visitors see them. */
export const AGENDA_PARAMS = {
  query: "q",
  category: "categoria",
  feature: "acessibilidade",
  date: "data",
  from: "de",
  to: "ate",
} as const;

const DATE_KIND_PARAM = { today: "hoje", weekend: "fim-de-semana", range: "intervalo" } as const;
const SLUG = /^[a-z0-9-]{1,60}$/;
const MAX_QUERY_LENGTH = 100;
const MAX_SELECTED = 20;

function safeSlugs(values: string[]): string[] {
  return [...new Set(values.filter((v) => SLUG.test(v)))].slice(0, MAX_SELECTED);
}

function parseDate(params: URLSearchParams): DateFilter {
  const kind = params.get(AGENDA_PARAMS.date);
  if (kind === DATE_KIND_PARAM.today) return { kind: "today" };
  if (kind === DATE_KIND_PARAM.weekend) return { kind: "weekend" };
  if (kind === DATE_KIND_PARAM.range) {
    const from = params.get(AGENDA_PARAMS.from) ?? "";
    const to = params.get(AGENDA_PARAMS.to) ?? "";
    if (!isDateKey(from) || !isDateKey(to)) return { kind: "all" };
    return from <= to ? { kind: "range", from, to } : { kind: "range", from: to, to: from };
  }
  return { kind: "all" };
}

export function parseAgendaFilters(params: URLSearchParams): AgendaFilters {
  return {
    query: (params.get(AGENDA_PARAMS.query) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    categories: safeSlugs(params.getAll(AGENDA_PARAMS.category)),
    features: safeSlugs(params.getAll(AGENDA_PARAMS.feature)),
    date: parseDate(params),
  };
}

export function toAgendaQueryString(filters: AgendaFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set(AGENDA_PARAMS.query, filters.query);
  filters.categories.forEach((c) => params.append(AGENDA_PARAMS.category, c));
  filters.features.forEach((f) => params.append(AGENDA_PARAMS.feature, f));
  if (filters.date.kind !== "all") params.set(AGENDA_PARAMS.date, DATE_KIND_PARAM[filters.date.kind]);
  if (filters.date.kind === "range") {
    params.set(AGENDA_PARAMS.from, filters.date.from);
    params.set(AGENDA_PARAMS.to, filters.date.to);
  }
  return params.toString();
}

export function countActiveFilters(filters: AgendaFilters): number {
  return (
    (filters.query ? 1 : 0) +
    filters.categories.length +
    filters.features.length +
    (filters.date.kind === "all" ? 0 : 1)
  );
}

/** Local calendar window [from, toExclusive) selected by a date filter, or null for no restriction. */
export function getDateWindow(
  filter: DateFilter,
  todayKey: string,
): { from: string; toExclusive: string } | null {
  switch (filter.kind) {
    case "all":
      return null;
    case "today":
      return { from: todayKey, toExclusive: addDaysToDateKey(todayKey, 1) };
    case "weekend": {
      const weekday = weekdayOf(todayKey);
      if (weekday === 0) return { from: todayKey, toExclusive: addDaysToDateKey(todayKey, 1) };
      const saturday = addDaysToDateKey(todayKey, 6 - weekday);
      return { from: saturday, toExclusive: addDaysToDateKey(saturday, 2) };
    }
    case "range":
      return { from: filter.from, toExclusive: addDaysToDateKey(filter.to, 1) };
  }
}
