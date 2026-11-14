import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { createEvent } from "@/application/events/event-commands";
import { eventInputSchema } from "@/application/events/event-input";
import { applyRetention } from "@/application/metrics/retention";
import { ORPHAN_BANNER_GRACE_MS } from "@/domain/media/banner-variants";
import { createTestDb } from "./test-db";
import { MemoryFileStorage } from "./memory-file-storage";

const NOW = new Date("2026-11-13T12:00:00Z");
const OLD = new Date(NOW.getTime() - ORPHAN_BANNER_GRACE_MS - 60_000);
const RECENT = new Date(NOW.getTime() - 60_000);

describe("retention of orphan banner files", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());
  afterEach(() => vi.restoreAllMocks());

  const venueId = await saveVenue(db, null, venueInputSchema.parse({ name: "Praça", floor: "L1" }));
  await createEvent(
    db,
    null,
    eventInputSchema.parse({
      title: "Show de Natal",
      description: "Apresentação de músicas natalinas",
      startsAt: "2026-12-20T19:00",
      endsAt: "2026-12-20T21:00",
      venueId,
      categoryId: (await listCategories(db))[0]!.id,
      capacityMode: "unlimited",
      bannerAlt: "Palco iluminado",
    }),
    { path: "used.webp" },
  );

  async function storageWith(files: Record<string, Date>) {
    let clock = NOW;
    const storage = new MemoryFileStorage(() => clock);
    for (const [name, modifiedAt] of Object.entries(files)) {
      clock = modifiedAt;
      await storage.save(name, Buffer.from(name));
    }
    return storage;
  }

  it("removes unreferenced banners older than the grace period and reports how many", async () => {
    const storage = await storageWith({
      "used.webp": OLD,
      "used-600.webp": OLD,
      "orphan.webp": OLD,
      "orphan-600.webp": OLD,
      "uploading.webp": RECENT,
      "uploading-600.webp": RECENT,
    });

    const result = await applyRetention(db, storage, NOW);

    expect(result.orphanBanners).toBe(2);
    expect(storage.names()).toEqual(["uploading-600.webp", "uploading.webp", "used-600.webp", "used.webp"]);
  });

  it("keeps going when an orphan cannot be deleted and counts only the removed ones", async () => {
    const storage = await storageWith({ "stuck.webp": OLD, "gone.webp": OLD });
    storage.failDelete.add("stuck.webp");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await applyRetention(db, storage, NOW);

    expect(result.orphanBanners).toBe(1);
    expect(storage.names()).toEqual(["stuck.webp"]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("stuck.webp"));
  });
});
