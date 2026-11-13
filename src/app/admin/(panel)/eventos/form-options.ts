import { listAccessibilityFeatures, listCategories, listVenues } from "@/application/catalog/catalog";
import type { Database } from "@/infrastructure/db/client";

export async function loadEventFormOptions(db: Database) {
  const [venues, categories, features] = await Promise.all([
    listVenues(db),
    listCategories(db),
    listAccessibilityFeatures(db),
  ]);
  return {
    venues: venues.map((v) => ({ id: v.id, name: v.name, floor: v.floor })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    features: features.map((f) => ({ id: f.id, name: f.name })),
  };
}
