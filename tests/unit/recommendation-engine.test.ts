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
});
