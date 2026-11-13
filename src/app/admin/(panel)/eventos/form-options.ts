import { listAccessibilityFeatures, listCategories, listVenues } from "@/application/catalog/catalog";
import { listStores } from "@/application/catalog/stores";
import type { Database } from "@/infrastructure/db/client";

/** `linkedStoreIds` keeps inactive stores already linked, so saving the event does not drop them. */
export async function loadEventFormOptions(db: Database, linkedStoreIds: string[] = []) {
  const [venues, categories, features, active, all] = await Promise.all([
    listVenues(db),
    listCategories(db),
    listAccessibilityFeatures(db),
    listStores(db),
    listStores(db, { includeInactive: true }),
  ]);
  const activeIds = new Set(active.map((s) => s.id));
  const stores = all.filter((s) => activeIds.has(s.id) || linkedStoreIds.includes(s.id));
  return {
    venues: venues.map((v) => ({ id: v.id, name: v.name, floor: v.floor })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    features: features.map((f) => ({ id: f.id, name: f.name })),
    stores: stores.map((s) => ({
      id: s.id,
      name: activeIds.has(s.id) ? s.name : `${s.name} (inativa)`,
      floor: s.floor,
      segmentName: s.segmentName,
    })),
  };
}
