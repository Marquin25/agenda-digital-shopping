/**
 * Fixed vocabularies of the experience catalog (docs/spec/10-inteligencia.md §2).
 * Weights go from 0 (does not serve) to MAX_WEIGHT (serves strongly).
 */
export const MAX_WEIGHT = 3;

export const OBJECTIVES = [
  "increase_sales",
  "increase_traffic",
  "attract_new_audiences",
  "strengthen_experience",
] as const;
export type Objective = (typeof OBJECTIVES)[number];

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  increase_sales: "Aumentar vendas",
  increase_traffic: "Ampliar fluxo",
  attract_new_audiences: "Atrair novos públicos",
  strengthen_experience: "Fortalecer a experiência",
};

/**
 * Provisional target audiences until P-INT-IA-3 is decided. They describe who an idea is aimed at,
 * written by staff; they are never profiles collected from visitors.
 */
export const AUDIENCES = [
  "children",
  "teens",
  "young_adults",
  "adults_25_40",
  "adults_41_59",
  "seniors",
  "families",
  "people_with_disabilities",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  children: "Crianças (até 12 anos)",
  teens: "Adolescentes (13–17)",
  young_adults: "Jovens (18–24)",
  adults_25_40: "Adultos (25–40)",
  adults_41_59: "Adultos (41–59)",
  seniors: "60+",
  families: "Famílias com crianças",
  people_with_disabilities: "Pessoas com deficiência",
};

/** `measured: false` marks indicators the platform cannot measure yet. */
export const INDICATORS = [
  { key: "page_views", label: "Visualizações da página", measured: true },
  { key: "unique_devices", label: "Dispositivos únicos (estimado)", measured: true },
  { key: "shares", label: "Compartilhamentos", measured: true },
  { key: "calendar_adds", label: "Adições à agenda", measured: true },
  { key: "promo_hits", label: "Acessos por link ou QR", measured: true },
  { key: "interested", label: "Interessados", measured: false },
  { key: "check_ins", label: "Check-ins", measured: false },
  { key: "csat", label: "Satisfação (CSAT)", measured: false },
  { key: "segment_sales", label: "Vendas do segmento (se integrado)", measured: false },
] as const;
export type IndicatorKey = (typeof INDICATORS)[number]["key"];
export const INDICATOR_KEYS = INDICATORS.map((i) => i.key) as [IndicatorKey, ...IndicatorKey[]];

export type Weights<K extends string> = Partial<Record<K, number>>;

/** Weighted items, strongest first, ignoring zeros: used to describe a template briefly. */
export function rankWeights<K extends string>(
  weights: Weights<K>,
  labels: Record<K, string>,
): { key: K; label: string; weight: number }[] {
  return (Object.keys(labels) as K[])
    .map((key) => ({ key, label: labels[key], weight: weights[key] ?? 0 }))
    .filter((w) => w.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}
