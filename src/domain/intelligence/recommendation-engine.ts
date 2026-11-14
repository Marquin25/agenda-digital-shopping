/**
 * Objective = (2 * primary + sum(distinct secondaries)) / (MAX_WEIGHT * (2 + secondary count)).
 * Audience = mean(desired catalog weights) / MAX_WEIGHT; segment = matched / desired segments.
 * Empty audience/segment sets contribute 0. Score = weighted sum / sum of all scoring weights,
 * clamped to [0, 1] and rounded to four decimals before sorting. History contributes 0 without
 * sufficient data: with the default weights, the maximum score without history is 0.90.
 */
import {
  MAX_WEIGHT,
  type Audience,
  type IndicatorKey,
  type Objective,
  type Weights,
} from "./experience-catalog";
import { slugify } from "../text/normalize";

export interface BriefInput {
  primaryObjective: Objective;
  secondaryObjectives: Objective[];
  audiences: Audience[];
  segmentIds: number[];
  budgetMin: number;
  budgetMax: number;
  periodStart: string;
  periodEnd: string;
  dailyWindowMinutes: number | null;
}

export interface VenueCandidate {
  id: string;
  name: string;
  areaSquareMeters: number | null;
  capacity: number | null;
  facilities: string[];
}

export interface TemplateCandidate {
  id: string;
  name: string;
  objectiveWeights: Weights<Objective>;
  audienceWeights: Weights<Audience>;
  segmentIds: number[];
  costMin: number;
  costMax: number;
  minAreaSquareMeters: number | null;
  minCapacity: number | null;
  facilities: string[];
  durationMinutes: number;
  indicators: IndicatorKey[];
  reviewStatus: "draft" | "reviewed";
  updatedAt: Date;
}

/** Comparable history aggregated outside the engine. */
export interface TemplateHistory {
  templateId: string;
  comparableEvents: number;
  estimatedDevices: number;
  /** Relative performance normalized to [-1, 1]. */
  adjustment: number;
}

export interface ScoringWeights {
  objective: number;
  audience: number;
  segment: number;
  history: number;
}

export interface RecommendationInput {
  brief: BriefInput;
  venues: VenueCandidate[];
  templates: TemplateCandidate[];
  history: TemplateHistory[];
  weights: ScoringWeights;
  rulesVersion: string;
  topN?: number;
}

export type Confidence = "low" | "medium" | "high";

export interface Recommendation {
  templateId: string;
  name: string;
  score: number;
  confidence: Confidence;
  reasons: string[];
  assumptions: string[];
  compatibleVenueIds: string[];
  matchedSegmentIds: number[];
  costMin: number;
  costMax: number;
  indicators: IndicatorKey[];
  historyApplied: boolean;
}

export interface EliminatedTemplate {
  templateId: string;
  name: string;
  reasons: string[];
}

export interface RecommendationResult {
  rulesVersion: string;
  weights: ScoringWeights;
  recommendations: Recommendation[];
  eliminated: EliminatedTemplate[];
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = Object.freeze({
  objective: 0.4,
  audience: 0.3,
  segment: 0.2,
  history: 0.1,
});
export const RULES_VERSION = "1.0.0";

export function recommend(input: RecommendationInput): RecommendationResult {
  const totalWeight =
    input.weights.objective + input.weights.audience + input.weights.segment + input.weights.history;
  if (
    [input.weights.objective, input.weights.audience, input.weights.segment, input.weights.history].some(
      (weight) => !Number.isFinite(weight) || weight < 0,
    ) ||
    !Number.isFinite(totalWeight) ||
    totalWeight <= 0
  ) {
    throw new RangeError("Scoring weights must be finite, non-negative, and have a finite positive sum.");
  }
  const eliminated: EliminatedTemplate[] = [];
  const recommendations: Recommendation[] = [];

  for (const template of input.templates) {
    const reasons: string[] = [];
    if (template.costMin > input.brief.budgetMax) {
      reasons.push("custo mínimo informado acima do orçamento");
    }
    const reasonsBeforeVenueChecks = reasons.length;
    const minimumArea = template.minAreaSquareMeters;
    if (
      minimumArea !== null &&
      !input.venues.some((venue) => venue.areaSquareMeters !== null && venue.areaSquareMeters >= minimumArea)
    ) {
      reasons.push("nenhum espaço disponível atende à área mínima necessária");
    }
    const minimumCapacity = template.minCapacity;
    if (
      minimumCapacity !== null &&
      !input.venues.some((venue) => venue.capacity !== null && venue.capacity >= minimumCapacity)
    ) {
      reasons.push("nenhum espaço disponível atende à capacidade mínima necessária");
    }
    if (
      !input.venues.some((venue) =>
        template.facilities.every((facility) => venue.facilities.map(slugify).includes(slugify(facility))),
      )
    ) {
      reasons.push("nenhum espaço disponível atende à estrutura necessária");
    }
    if (
      reasons.length === reasonsBeforeVenueChecks &&
      !input.venues.some(
        (venue) =>
          (minimumArea === null ||
            (venue.areaSquareMeters !== null && venue.areaSquareMeters >= minimumArea)) &&
          (minimumCapacity === null || (venue.capacity !== null && venue.capacity >= minimumCapacity)) &&
          template.facilities.every((facility) => venue.facilities.map(slugify).includes(slugify(facility))),
      )
    ) {
      reasons.push(
        "nenhum espaço disponível atende à área, à capacidade e à estrutura necessárias em conjunto",
      );
    }
    if (
      input.brief.dailyWindowMinutes !== null &&
      template.durationMinutes > input.brief.dailyWindowMinutes
    ) {
      reasons.push("duração do modelo maior que a janela diária disponível");
    }
    if (reasons.length > 0) {
      eliminated.push({ templateId: template.id, name: template.name, reasons });
      continue;
    }
    const secondaryObjectives = [...new Set(input.brief.secondaryObjectives)].filter(
      (objective) => objective !== input.brief.primaryObjective,
    );
    const objective =
      (2 * (template.objectiveWeights[input.brief.primaryObjective] ?? 0) +
        secondaryObjectives.reduce((sum, key) => sum + (template.objectiveWeights[key] ?? 0), 0)) /
      (MAX_WEIGHT * (2 + secondaryObjectives.length));

    const audiences = [...new Set(input.brief.audiences)];
    const audience =
      audiences.length === 0
        ? 0
        : audiences.reduce((sum, key) => sum + (template.audienceWeights[key] ?? 0), 0) /
          (MAX_WEIGHT * audiences.length);

    const segmentIds = [...new Set(input.brief.segmentIds)];
    const matchedSegmentIds = segmentIds
      .filter((id) => template.segmentIds.includes(id))
      .sort((a, b) => a - b);
    const segment = segmentIds.length === 0 ? 0 : matchedSegmentIds.length / segmentIds.length;
    const history = input.history.find((entry) => entry.templateId === template.id);
    const eligibleHistory =
      history && history.comparableEvents >= 3 && history.estimatedDevices >= 30 ? history : undefined;
    const weightedScore =
      (input.weights.objective * objective +
        input.weights.audience * audience +
        input.weights.segment * segment +
        input.weights.history * (eligibleHistory?.adjustment ?? 0)) /
      totalWeight;

    recommendations.push({
      templateId: template.id,
      name: template.name,
      score: Math.round(Math.max(0, Math.min(1, weightedScore)) * 10000) / 10000,
      confidence: eligibleHistory
        ? eligibleHistory.comparableEvents >= 10 && eligibleHistory.estimatedDevices >= 300
          ? "high"
          : "medium"
        : "low",
      reasons: [],
      assumptions: eligibleHistory ? [] : ["sem histórico suficiente"],
      compatibleVenueIds: input.venues
        .filter(
          (venue) =>
            (minimumArea === null ||
              (venue.areaSquareMeters !== null && venue.areaSquareMeters >= minimumArea)) &&
            (minimumCapacity === null || (venue.capacity !== null && venue.capacity >= minimumCapacity)) &&
            template.facilities.every((facility) =>
              venue.facilities.map(slugify).includes(slugify(facility)),
            ),
        )
        .map((venue) => venue.id),
      matchedSegmentIds,
      costMin: template.costMin,
      costMax: template.costMax,
      indicators: [...template.indicators],
      historyApplied: eligibleHistory !== undefined,
    });
  }

  return {
    rulesVersion: input.rulesVersion,
    weights: { ...input.weights },
    recommendations,
    eliminated,
  };
}
