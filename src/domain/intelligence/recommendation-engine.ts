import type { Audience, IndicatorKey, Objective, Weights } from "./experience-catalog";
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

export function recommend(input: RecommendationInput): RecommendationResult {
  const eliminated: EliminatedTemplate[] = [];

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
    }
  }

  return {
    rulesVersion: input.rulesVersion,
    weights: { ...input.weights },
    recommendations: [],
    eliminated,
  };
}
