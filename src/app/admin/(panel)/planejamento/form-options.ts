import { listVenues } from "@/application/catalog/catalog";
import { listSegments, listStores } from "@/application/catalog/stores";
import type { Database } from "@/infrastructure/db/client";

/** Active options plus inactive ones already linked to the brief, so saving does not drop them. */
export async function loadPlanFormOptions(
  db: Database,
  linked: { segmentIds: number[]; storeIds: string[]; venueIds: string[] } = {
    segmentIds: [],
    storeIds: [],
    venueIds: [],
  },
) {
  const [segments, activeStores, allStores, venues] = await Promise.all([
    listSegments(db, { includeInactive: true }),
    listStores(db),
    listStores(db, { includeInactive: true }),
    listVenues(db, { includeInactive: true }),
  ]);
  const activeStoreIds = new Set(activeStores.map((s) => s.id));
  const inactive = (name: string, active: boolean) => (active ? name : `${name} (inativo)`);
  return {
    segments: segments
      .filter((s) => s.active || linked.segmentIds.includes(s.id))
      .map((s) => ({ id: s.id, name: inactive(s.name, s.active) })),
    stores: allStores
      .filter((s) => activeStoreIds.has(s.id) || linked.storeIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        name: inactive(s.name, activeStoreIds.has(s.id)),
        segmentName: s.segmentName,
      })),
    venues: venues
      .filter((v) => v.active || linked.venueIds.includes(v.id))
      .map((v) => ({ id: v.id, name: inactive([v.floor, v.name].filter(Boolean).join(" · "), v.active) })),
  };
}
