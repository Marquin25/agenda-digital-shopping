import { listCategories } from "@/application/catalog/catalog";
import { listSegments } from "@/application/catalog/stores";
import type { Database } from "@/infrastructure/db/client";

/** `linkedSegmentIds` keeps deactivated segments already linked, so saving does not drop them. */
export async function loadTemplateFormOptions(db: Database, linkedSegmentIds: number[] = []) {
  const [all, categories] = await Promise.all([
    listSegments(db, { includeInactive: true }),
    listCategories(db),
  ]);
  return {
    segments: all
      .filter((s) => s.active || linkedSegmentIds.includes(s.id))
      .map((s) => ({ id: s.id, name: s.active ? s.name : `${s.name} (inativo)` })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
  };
}
