import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCORING_WEIGHTS,
  RULES_VERSION,
  recommend,
  type RecommendationInput,
} from "@/domain/intelligence/recommendation-engine";

function createInput(): RecommendationInput {
  return {
    brief: {
      primaryObjective: "increase_sales",
      secondaryObjectives: [],
      audiences: ["adults_25_40"],
      segmentIds: [1],
      budgetMin: 5000,
      budgetMax: 10000,
      periodStart: "2026-11-20",
      periodEnd: "2026-11-22",
      dailyWindowMinutes: 240,
    },
    venues: [
      {
        id: "central-square",
        name: "Praça Central",
        areaSquareMeters: 100,
        capacity: 100,
        facilities: ["Energia"],
      },
    ],
    templates: [
      {
        id: "style-consultation",
        name: "Consultoria de estilo",
        objectiveWeights: { increase_sales: 3 },
        audienceWeights: { adults_25_40: 3 },
        segmentIds: [1],
        costMin: 10000,
        costMax: 15000,
        minAreaSquareMeters: 30,
        minCapacity: 20,
        facilities: ["Energia"],
        durationMinutes: 120,
        indicators: ["page_views"],
        reviewStatus: "reviewed",
        updatedAt: new Date("2026-11-13T12:00:00Z"),
      },
    ],
    history: [],
    weights: { objective: 1, audience: 0, segment: 0, history: 0 },
    rulesVersion: "budget-filter-test",
  };
}

describe("recommend", () => {
  it("eliminates a template whose minimum cost exceeds the maximum budget", () => {
    const input = createInput();
    input.templates[0]!.costMin = 10001;

    expect(recommend(input)).toEqual({
      rulesVersion: "budget-filter-test",
      weights: { objective: 1, audience: 0, segment: 0, history: 0 },
      recommendations: [],
      eliminated: [
        {
          templateId: "style-consultation",
          name: "Consultoria de estilo",
          reasons: ["custo mínimo informado acima do orçamento"],
        },
      ],
    });
  });

  it("eliminates a template when no venue meets its minimum area", () => {
    const input = createInput();
    input.venues[0]!.areaSquareMeters = 29;

    expect(recommend(input).eliminated).toEqual([
      {
        templateId: "style-consultation",
        name: "Consultoria de estilo",
        reasons: ["nenhum espaço disponível atende à área mínima necessária"],
      },
    ]);
    expect(recommend(input).recommendations).toEqual([]);
  });
  it("eliminates a template when no venue meets its minimum capacity", () => {
    const input = createInput();
    input.venues[0]!.capacity = 19;

    const result = recommend(input);

    expect(result.eliminated).toEqual([
      {
        templateId: "style-consultation",
        name: "Consultoria de estilo",
        reasons: ["nenhum espaço disponível atende à capacidade mínima necessária"],
      },
    ]);
    expect(result.recommendations).toEqual([]);
  });
  it("eliminates a template when no venue provides every required facility", () => {
    const input = createInput();
    input.templates[0]!.facilities = ["Energia", "Mesa"];

    expect(recommend(input).eliminated).toEqual([
      {
        templateId: "style-consultation",
        name: "Consultoria de estilo",
        reasons: ["nenhum espaço disponível atende à estrutura necessária"],
      },
    ]);
  });
  it("compares required facilities without case or accents", () => {
    const input = createInput();
    input.templates[0]!.facilities = ["Energia elétrica"];
    input.venues[0]!.facilities = ["ENERGIA ELETRICA"];

    expect(recommend(input).eliminated).toEqual([]);
  });
  it("requires one venue to satisfy area, capacity and facilities together", () => {
    const input = createInput();
    input.venues = [
      { id: "large", name: "Espaço amplo", areaSquareMeters: 30, capacity: 19, facilities: ["Energia"] },
      { id: "small", name: "Espaço pequeno", areaSquareMeters: 29, capacity: 20, facilities: ["Energia"] },
    ];

    expect(recommend(input).eliminated).toEqual([
      {
        templateId: "style-consultation",
        name: "Consultoria de estilo",
        reasons: [
          "nenhum espaço disponível atende à área, à capacidade e à estrutura necessárias em conjunto",
        ],
      },
    ]);
  });
  it("eliminates a template whose duration exceeds the daily window", () => {
    const input = createInput();
    input.templates[0]!.durationMinutes = 241;

    expect(recommend(input).eliminated).toEqual([
      {
        templateId: "style-consultation",
        name: "Consultoria de estilo",
        reasons: ["duração do modelo maior que a janela diária disponível"],
      },
    ]);
  });
  it("reports every failed filter even when the budget already eliminates the template", () => {
    const input = createInput();
    input.templates[0]!.costMin = 10001;
    input.templates[0]!.durationMinutes = 241;
    input.venues = [
      { id: "large", name: "Espaço amplo", areaSquareMeters: 30, capacity: 19, facilities: ["Energia"] },
      { id: "small", name: "Espaço pequeno", areaSquareMeters: 29, capacity: 20, facilities: ["Energia"] },
    ];

    expect(recommend(input).eliminated[0]!.reasons).toEqual([
      "custo mínimo informado acima do orçamento",
      "nenhum espaço disponível atende à área, à capacidade e à estrutura necessárias em conjunto",
      "duração do modelo maior que a janela diária disponível",
    ]);
  });
  it("accepts exact budget, area, capacity and duration boundaries", () => {
    const input = createInput();
    input.venues[0]!.areaSquareMeters = 30;
    input.venues[0]!.capacity = 20;
    input.templates[0]!.durationMinutes = 240;

    expect(recommend(input).eliminated).toEqual([]);
  });

  it.each([
    ["areaSquareMeters", "nenhum espaço disponível atende à área mínima necessária"],
    ["capacity", "nenhum espaço disponível atende à capacidade mínima necessária"],
  ] as const)("rejects an unknown required venue %s", (field, reason) => {
    const input = createInput();
    input.venues[0]![field] = null;

    expect(recommend(input).eliminated[0]!.reasons).toEqual([reason]);
  });

  it("does not impose a duration limit when the daily window is unspecified", () => {
    const input = createInput();
    input.brief.dailyWindowMinutes = null;
    input.templates[0]!.durationMinutes = 1440;

    expect(recommend(input).eliminated).toEqual([]);
  });

  it("eliminates a template when no venues are available", () => {
    const input = createInput();
    input.venues = [];

    expect(recommend(input).eliminated[0]!.reasons).toEqual([
      "nenhum espaço disponível atende à área mínima necessária",
      "nenhum espaço disponível atende à capacidade mínima necessária",
      "nenhum espaço disponível atende à estrutura necessária",
    ]);
  });
  it("normalizes objective adherence with the primary objective weighted twice", () => {
    const input = createInput();
    input.brief.secondaryObjectives = ["strengthen_experience", "increase_traffic"];
    input.templates[0]!.objectiveWeights = {
      increase_sales: 3,
      strengthen_experience: 2,
      increase_traffic: 1,
    };

    expect(recommend(input).recommendations[0]!.score).toBe(0.75);
  });
  it("normalizes audience adherence over the distinct desired audiences", () => {
    const input = createInput();
    input.weights = { objective: 0, audience: 1, segment: 0, history: 0 };
    input.brief.audiences = ["families", "young_adults"];
    input.templates[0]!.audienceWeights = { families: 3 };

    expect(recommend(input).recommendations[0]!.score).toBe(0.5);
  });
  it("normalizes segment adherence by the desired segments", () => {
    const input = createInput();
    input.weights = { objective: 0, audience: 0, segment: 1, history: 0 };
    input.brief.segmentIds = [1, 2, 3];
    input.templates[0]!.segmentIds = [1, 3, 4];

    const result = recommend(input);

    expect(result.recommendations[0]!.score).toBe(0.6667);
    expect(result.recommendations[0]!.matchedSegmentIds).toEqual([1, 3]);
  });
  it("combines the approved default weights into a score of 0.6500", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.rulesVersion = RULES_VERSION;
    input.brief.audiences = ["families", "young_adults"];
    input.templates[0]!.audienceWeights = { families: 3 };
    input.brief.segmentIds = [1, 2];

    const result = recommend(input);

    expect(result.weights).toEqual({ objective: 0.4, audience: 0.3, segment: 0.2, history: 0.1 });
    expect(result.rulesVersion).toBe("1.0.0");
    expect(result.recommendations[0]!.score).toBe(0.65);
  });
  it("normalizes custom scoring weights without dropping the history weight", () => {
    const input = createInput();
    input.weights = { objective: 4, audience: 3, segment: 2, history: 1 };
    input.brief.audiences = ["families", "young_adults"];
    input.templates[0]!.audienceWeights = { families: 3 };
    input.brief.segmentIds = [1, 2];

    const result = recommend(input);

    expect(result.recommendations[0]!.score).toBe(0.65);
    expect(result.weights).toEqual({ objective: 4, audience: 3, segment: 2, history: 1 });
  });
  it.each([
    { objective: -1, audience: 1, segment: 1, history: 1 },
    { objective: 1, audience: Number.NaN, segment: 0, history: 0 },
    { objective: 1, audience: 0, segment: Number.POSITIVE_INFINITY, history: 0 },
    { objective: 0, audience: 0, segment: 0, history: 0 },
    { objective: Number.MAX_VALUE, audience: Number.MAX_VALUE, segment: 0, history: 0 },
  ])("rejects invalid scoring weights: %j", (weights) => {
    const input = createInput();
    input.weights = weights;

    expect(() => recommend(input)).toThrow(RangeError);
    expect(() => recommend(input)).toThrow(
      "Scoring weights must be finite, non-negative, and have a finite positive sum.",
    );
  });
  it.each([
    { objective: 0, audience: 1, segment: 0, history: 0 },
    { objective: 0, audience: 0, segment: 1, history: 0 },
  ])("assigns zero adherence to unspecified audiences and segments: %j", (weights) => {
    const input = createInput();
    input.weights = weights;
    input.brief.audiences = [];
    input.brief.segmentIds = [];

    expect(recommend(input).recommendations[0]!.score).toBe(0);
  });

  it("does not count duplicated objectives, audiences or segments twice", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.brief.secondaryObjectives = ["increase_sales", "strengthen_experience", "strengthen_experience"];
    input.brief.audiences = ["families", "families", "young_adults"];
    input.brief.segmentIds = [2, 1, 1];
    input.templates[0]!.audienceWeights = { families: 3 };
    input.templates[0]!.segmentIds = [1, 1];

    const result = recommend(input);

    expect(result.recommendations[0]!.score).toBe(0.5167);
    expect(result.recommendations[0]!.matchedSegmentIds).toEqual([1]);
  });

  it("caps the default score without history at 0.90", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;

    expect(recommend(input).recommendations[0]!.score).toBe(0.9);
  });
  it.each([
    { comparableEvents: 2, estimatedDevices: 100 },
    { comparableEvents: 3, estimatedDevices: 29 },
  ])("ignores insufficient comparable history: %j", (counts) => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.history = [{ templateId: "style-consultation", ...counts, adjustment: 1 }];

    const recommendation = recommend(input).recommendations[0]!;

    expect(recommendation.score).toBe(0.9);
    expect(recommendation.historyApplied).toBe(false);
    expect(recommendation.confidence).toBe("low");
    expect(recommendation.assumptions).toContain("sem histórico suficiente");
  });
  it("applies history at exactly three events and thirty estimated devices", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.history = [
      { templateId: "style-consultation", comparableEvents: 3, estimatedDevices: 30, adjustment: 1 },
    ];

    const recommendation = recommend(input).recommendations[0]!;

    expect(recommendation.score).toBe(1);
    expect(recommendation.historyApplied).toBe(true);
    expect(recommendation.confidence).toBe("medium");
    expect(recommendation.assumptions).not.toContain("sem histórico suficiente");
  });
  it("raises confidence at exactly ten events and three hundred estimated devices", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.history = [
      { templateId: "style-consultation", comparableEvents: 10, estimatedDevices: 300, adjustment: 0.5 },
    ];

    const recommendation = recommend(input).recommendations[0]!;

    expect(recommendation.score).toBe(0.95);
    expect(recommendation.confidence).toBe("high");
    expect(recommendation.historyApplied).toBe(true);
  });
  it("clamps a negative weighted history score to zero", () => {
    const input = createInput();
    input.weights = { objective: 0, audience: 0, segment: 0, history: 1 };
    input.history = [
      { templateId: "style-consultation", comparableEvents: 3, estimatedDevices: 30, adjustment: -1 },
    ];

    expect(recommend(input).recommendations[0]!.score).toBe(0);
  });
  it.each([
    { comparableEvents: 9, estimatedDevices: 300 },
    { comparableEvents: 10, estimatedDevices: 299 },
  ])("requires both high-confidence thresholds: %j", (counts) => {
    const input = createInput();
    input.history = [{ templateId: "style-consultation", ...counts, adjustment: 0 }];

    expect(recommend(input).recommendations[0]!.confidence).toBe("medium");
  });

  it.each([
    { adjustment: -1, score: 0.8 },
    { adjustment: 0, score: 0.9 },
  ])("preserves the signed eligible history adjustment: %j", ({ adjustment, score }) => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.history = [
      { templateId: "style-consultation", comparableEvents: 3, estimatedDevices: 30, adjustment },
    ];

    const recommendation = recommend(input).recommendations[0]!;

    expect(recommendation.score).toBe(score);
    expect(recommendation.historyApplied).toBe(true);
    expect(recommendation.confidence).toBe("medium");
  });

  it("does not borrow history from another template", () => {
    const input = createInput();
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.history = [
      { templateId: "another-template", comparableEvents: 10, estimatedDevices: 300, adjustment: 1 },
    ];

    const recommendation = recommend(input).recommendations[0]!;

    expect(recommendation.score).toBe(0.9);
    expect(recommendation.confidence).toBe("low");
    expect(recommendation.historyApplied).toBe(false);
    expect(recommendation.assumptions).toContain("sem histórico suficiente");
  });
  it("keeps draft templates eligible with a review assumption", () => {
    const input = createInput();
    input.templates[0]!.reviewStatus = "draft";

    const result = recommend(input);

    expect(result.eliminated).toEqual([]);
    expect(result.recommendations[0]!.templateId).toBe("style-consultation");
    expect(result.recommendations[0]!.score).toBe(1);
    expect(result.recommendations[0]!.assumptions).toContain("modelo em rascunho para revisão");
  });
  it("returns five recommendations by default", () => {
    const input = createInput();
    const template = input.templates[0]!;
    input.templates = ["a", "b", "c", "d", "e", "f", "g"].map((id) => ({ ...template, id, name: id }));

    expect(recommend(input).recommendations.map((recommendation) => recommendation.templateId)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });
  it.each([
    { topN: 0, ids: [] },
    { topN: 2, ids: ["a", "b"] },
    { topN: 10, ids: ["a", "b", "c"] },
  ])("honors the requested recommendation count: %j", ({ topN, ids }) => {
    const input = createInput();
    const template = input.templates[0]!;
    input.topN = topN;
    input.templates = ["a", "b", "c"].map((id) => ({ ...template, id, name: id }));

    const result = recommend(input);

    expect(result.recommendations.map((recommendation) => recommendation.templateId)).toEqual(ids);
    expect(result.eliminated).toEqual([]);
  });
  it("sorts by score, then name and id before applying topN", () => {
    const input = createInput();
    const template = input.templates[0]!;
    input.topN = 4;
    input.templates = [
      { ...template, id: "low", name: "Abaixo", objectiveWeights: { increase_sales: 1 } },
      { ...template, id: "z", name: "Zeta" },
      { ...template, id: "b", name: "Alfa" },
      { ...template, id: "a", name: "Alfa" },
      { ...template, id: "middle", name: "Médio", objectiveWeights: { increase_sales: 2 } },
    ];

    const result = recommend(input);

    expect(result.recommendations.map(({ templateId, score }) => ({ templateId, score }))).toEqual([
      { templateId: "a", score: 1 },
      { templateId: "b", score: 1 },
      { templateId: "z", score: 1 },
      { templateId: "middle", score: 0.6667 },
    ]);
    expect(result.eliminated).toEqual([]);
  });
  it("breaks ties using the rounded score rather than the raw score", () => {
    const input = createInput();
    const template = input.templates[0]!;
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.templates = [
      { ...template, id: "z", name: "Zeta" },
      { ...template, id: "a", name: "Alfa" },
    ];
    input.history = [
      { templateId: "z", comparableEvents: 3, estimatedDevices: 30, adjustment: 0.0004 },
      { templateId: "a", comparableEvents: 3, estimatedDevices: 30, adjustment: 0.0001 },
    ];

    expect(recommend(input).recommendations.map(({ templateId, score }) => ({ templateId, score }))).toEqual([
      { templateId: "a", score: 0.9 },
      { templateId: "z", score: 0.9 },
    ]);
  });

  it("returns identical results for shuffled inputs without mutating them", () => {
    const input = createInput();
    const template = input.templates[0]!;
    const venue = input.venues[0]!;
    input.weights = DEFAULT_SCORING_WEIGHTS;
    input.brief.segmentIds = [3, 1];
    input.templates = [
      { ...template, id: "b", name: "Alfa", segmentIds: [3, 1], indicators: ["shares", "page_views"] },
      { ...template, id: "a", name: "Alfa", segmentIds: [3, 1], indicators: ["shares", "page_views"] },
      { ...template, id: "removed-z", name: "Zeta", costMin: 10001 },
      { ...template, id: "removed-a", name: "Alfa", costMin: 10001 },
    ];
    input.venues = [
      { ...venue, id: "z" },
      { ...venue, id: "a" },
      { ...venue, id: "incompatible", areaSquareMeters: 29 },
    ];
    input.history = [
      { templateId: "b", comparableEvents: 3, estimatedDevices: 30, adjustment: 0 },
      { templateId: "a", comparableEvents: 3, estimatedDevices: 30, adjustment: 0 },
    ];
    const before = structuredClone(input);
    const shuffled = structuredClone(input);
    shuffled.templates = [
      shuffled.templates[2]!,
      shuffled.templates[0]!,
      shuffled.templates[3]!,
      shuffled.templates[1]!,
    ].map((candidate) => ({
      ...candidate,
      segmentIds: [...candidate.segmentIds].reverse(),
      indicators: [...candidate.indicators].reverse(),
    }));
    shuffled.venues.reverse();
    shuffled.history.reverse();
    shuffled.brief.segmentIds.reverse();
    const shuffledBefore = structuredClone(shuffled);

    const result = recommend(input);

    expect(result.recommendations.map((recommendation) => recommendation.templateId)).toEqual(["a", "b"]);
    expect(result.eliminated.map((template) => template.templateId)).toEqual(["removed-a", "removed-z"]);
    expect(result.recommendations[0]!.compatibleVenueIds).toEqual(["a", "z"]);
    expect(result.recommendations[0]!.matchedSegmentIds).toEqual([1, 3]);
    expect(result.recommendations[0]!.indicators).toEqual(["page_views", "shares"]);
    expect(recommend(shuffled)).toEqual(result);
    expect(input).toEqual(before);
    expect(shuffled).toEqual(shuffledBefore);
  });
});
