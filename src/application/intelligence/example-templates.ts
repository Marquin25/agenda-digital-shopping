import type { Audience, IndicatorKey, Objective } from "@/domain/intelligence/experience-catalog";

export interface ExampleTemplate {
  name: string;
  description: string;
  objectiveWeights: Partial<Record<Objective, number>>;
  audienceWeights: Partial<Record<Audience, number>>;
  segmentSlugs: string[];
  costMin: number;
  costMax: number;
  minAreaSquareMeters?: number;
  minCapacity?: number;
  facilities: string;
  durationMinutes: number;
  indicators: IndicatorKey[];
}

const BASIC: IndicatorKey[] = ["page_views", "unique_devices", "shares", "calendar_adds"];

/**
 * Starting ideas suggested by the team; costs are illustrative placeholders. All are seeded as
 * "rascunho para revisão" until the mall reviews them (docs/spec/10 §2.2, P-INT-IA-1).
 */
export const EXAMPLE_TEMPLATES: ExampleTemplate[] = [
  {
    name: "Consultoria de estilo",
    description: "Consultores de moda atendem visitantes com dicas e combinações das lojas participantes.",
    objectiveWeights: { increase_sales: 3, strengthen_experience: 2, attract_new_audiences: 1 },
    audienceWeights: { adults_25_40: 3, adults_41_59: 2, young_adults: 1 },
    segmentSlugs: ["moda", "beleza"],
    costMin: 3000,
    costMax: 8000,
    minAreaSquareMeters: 30,
    facilities: "energia, mesa, espelho",
    durationMinutes: 240,
    indicators: [...BASIC, "promo_hits", "segment_sales"],
  },
  {
    name: "Festival de moda",
    description: "Desfiles curtos com as coleções das lojas, intercalados com música ao vivo.",
    objectiveWeights: { increase_sales: 3, increase_traffic: 2, attract_new_audiences: 2 },
    audienceWeights: { young_adults: 3, adults_25_40: 3, teens: 1 },
    segmentSlugs: ["moda", "beleza"],
    costMin: 15000,
    costMax: 40000,
    minAreaSquareMeters: 120,
    minCapacity: 150,
    facilities: "energia, som, palco",
    durationMinutes: 180,
    indicators: [...BASIC, "promo_hits", "csat"],
  },
  {
    name: "Ação integrada moda e gastronomia",
    description: "Roteiro que combina vitrines de moda com degustações na praça de alimentação.",
    objectiveWeights: { increase_sales: 3, increase_traffic: 2 },
    audienceWeights: { adults_25_40: 3, adults_41_59: 2 },
    segmentSlugs: ["moda", "alimentacao"],
    costMin: 5000,
    costMax: 12000,
    minAreaSquareMeters: 40,
    facilities: "energia, mesas",
    durationMinutes: 300,
    indicators: [...BASIC, "promo_hits", "segment_sales"],
  },
  {
    name: "Oficina infantil de artes",
    description: "Atividade guiada de pintura e colagem para crianças, com materiais incluídos.",
    objectiveWeights: { strengthen_experience: 3, increase_traffic: 2, attract_new_audiences: 1 },
    audienceWeights: { children: 3, families: 3 },
    segmentSlugs: ["lazer"],
    costMin: 1500,
    costMax: 4000,
    minAreaSquareMeters: 40,
    minCapacity: 30,
    facilities: "mesas, cadeiras infantis, pia próxima",
    durationMinutes: 180,
    indicators: [...BASIC, "check_ins", "csat"],
  },
  {
    name: "Show acústico",
    description: "Apresentação musical acústica no fim da tarde, com repertório popular.",
    objectiveWeights: { increase_traffic: 3, strengthen_experience: 3 },
    audienceWeights: { adults_25_40: 2, adults_41_59: 2, seniors: 2, families: 1 },
    segmentSlugs: ["alimentacao", "lazer"],
    costMin: 2000,
    costMax: 6000,
    minAreaSquareMeters: 50,
    minCapacity: 100,
    facilities: "energia, som, palco",
    durationMinutes: 120,
    indicators: [...BASIC, "csat"],
  },
  {
    name: "Feira gastronômica",
    description: "Barracas e degustações das lojas de alimentação, com pratos de época.",
    objectiveWeights: { increase_sales: 3, increase_traffic: 3 },
    audienceWeights: { families: 2, adults_25_40: 2, adults_41_59: 2 },
    segmentSlugs: ["alimentacao"],
    costMin: 6000,
    costMax: 18000,
    minAreaSquareMeters: 150,
    facilities: "energia, pontos de água, mesas",
    durationMinutes: 360,
    indicators: [...BASIC, "promo_hits", "segment_sales"],
  },
  {
    name: "Arena de games e tecnologia",
    description: "Estações de jogos e demonstrações de produtos das lojas de tecnologia.",
    objectiveWeights: { attract_new_audiences: 3, increase_traffic: 2, increase_sales: 1 },
    audienceWeights: { teens: 3, young_adults: 3 },
    segmentSlugs: ["tecnologia", "lazer"],
    costMin: 8000,
    costMax: 25000,
    minAreaSquareMeters: 80,
    facilities: "energia reforçada, internet, mesas",
    durationMinutes: 480,
    indicators: [...BASIC, "promo_hits", "check_ins"],
  },
  {
    name: "Dia da beleza e autocuidado",
    description: "Miniatendimentos e demonstrações das lojas de beleza, com horários marcados no local.",
    objectiveWeights: { increase_sales: 2, strengthen_experience: 3 },
    audienceWeights: { adults_25_40: 3, adults_41_59: 2, young_adults: 1 },
    segmentSlugs: ["beleza"],
    costMin: 2500,
    costMax: 7000,
    minAreaSquareMeters: 30,
    facilities: "energia, cadeiras, espelho",
    durationMinutes: 300,
    indicators: [...BASIC, "segment_sales", "csat"],
  },
  {
    name: "Sessão sensorial",
    description:
      "Programação com luz e som reduzidos, pensada para pessoas neurodivergentes e suas famílias.",
    objectiveWeights: { strengthen_experience: 3, attract_new_audiences: 2 },
    audienceWeights: { people_with_disabilities: 3, families: 3, children: 2 },
    segmentSlugs: ["lazer"],
    costMin: 1000,
    costMax: 3000,
    minAreaSquareMeters: 40,
    minCapacity: 30,
    facilities: "iluminação regulável, assentos",
    durationMinutes: 120,
    indicators: [...BASIC, "csat"],
  },
  {
    name: "Encontro de bem-estar 60+",
    description: "Aula leve de alongamento e roda de conversa em horário de menor movimento.",
    objectiveWeights: { attract_new_audiences: 3, strengthen_experience: 2 },
    audienceWeights: { seniors: 3, adults_41_59: 1 },
    segmentSlugs: ["lazer", "alimentacao"],
    costMin: 800,
    costMax: 2500,
    minAreaSquareMeters: 40,
    facilities: "som, cadeiras",
    durationMinutes: 90,
    indicators: [...BASIC, "check_ins", "csat"],
  },
];
