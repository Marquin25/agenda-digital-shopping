import type { Database } from "@/infrastructure/db/client";
import { accessibilityFeatures, categories, segments } from "@/infrastructure/db/schema";

/** Initial categories confirmed by the product owner; editable later (P-PROD-4). */
export const INITIAL_CATEGORIES = [
  { slug: "infantil", name: "Infantil", sortOrder: 1 },
  { slug: "musica", name: "Música", sortOrder: 2 },
  { slug: "gastronomia", name: "Gastronomia", sortOrder: 3 },
  { slug: "inclusivo", name: "Inclusivo/Acessível", sortOrder: 4 },
];

export const INITIAL_ACCESSIBILITY_FEATURES = [
  {
    slug: "libras",
    name: "Intérprete de Libras",
    description: "Tradução para a Língua Brasileira de Sinais.",
  },
  {
    slug: "espaco-sensorial",
    name: "Espaço sensorial",
    description: "Área com estímulos reduzidos para descanso.",
  },
  { slug: "pet-friendly", name: "Pet friendly", description: "Animais de estimação são bem-vindos." },
  {
    slug: "cadeira-de-rodas",
    name: "Acessível para cadeira de rodas",
    description: "Acesso e espaço para cadeiras de rodas.",
  },
  { slug: "audiodescricao", name: "Audiodescrição", description: "Descrição em áudio do conteúdo visual." },
];

/** Starting list of commercial segments (docs/spec/10); staff can rename, add or deactivate them. */
export const INITIAL_SEGMENTS = [
  { slug: "alimentacao", name: "Alimentação" },
  { slug: "moda", name: "Moda" },
  { slug: "tecnologia", name: "Tecnologia" },
  { slug: "beleza", name: "Beleza" },
  { slug: "lazer", name: "Lazer" },
];

/** Idempotent: safe to run on every deploy. Keyed by slug, so staff edits are never overwritten. */
export async function seedReferenceData(db: Database): Promise<void> {
  await db.insert(categories).values(INITIAL_CATEGORIES).onConflictDoNothing({ target: categories.slug });
  await db
    .insert(accessibilityFeatures)
    .values(INITIAL_ACCESSIBILITY_FEATURES)
    .onConflictDoNothing({ target: accessibilityFeatures.slug });
  await db.insert(segments).values(INITIAL_SEGMENTS).onConflictDoNothing({ target: segments.slug });
}
