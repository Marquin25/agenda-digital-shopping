import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories, saveVenue, venueInputSchema } from "@/application/catalog/catalog";
import { EventRuleError } from "@/application/events/event-commands";
import { BannerStorageError, saveEventWithBanner, type NewBanner } from "@/application/events/event-banner";
import { eventInputSchema } from "@/application/events/event-input";
import { getEventForEdit } from "@/application/events/event-queries";
import { bannerFileNames } from "@/domain/media/banner-variants";
import { createTestDb } from "./test-db";
import { MemoryFileStorage } from "./memory-file-storage";

function banner(base: string): NewBanner {
  const fileName = `${base}.webp`;
  return {
    fileName,
    files: bannerFileNames(fileName).map((name) => ({ fileName: name, content: Buffer.from(name) })),
  };
}

describe("saving an event with a banner", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());
  afterEach(() => vi.restoreAllMocks());

  let userId: string;
  let input: ReturnType<typeof eventInputSchema.parse>;

  beforeAll(async () => {
    userId = await createAdminUser(db, null, {
      name: "Editor",
      email: "editor@example.test",
      role: "editor",
      temporaryPassword: "senha-de-teste-longa",
    });
    const venueId = await saveVenue(db, userId, venueInputSchema.parse({ name: "Praça", floor: "L1" }));
    input = eventInputSchema.parse({
      title: "Oficina de pintura",
      description: "Oficina de pintura para toda a família",
      startsAt: "2026-12-20T15:00",
      endsAt: "2026-12-20T17:00",
      venueId,
      categoryId: (await listCategories(db))[0]!.id,
      capacityMode: "unlimited",
      bannerAlt: "Crianças pintando",
    });
  });

  async function eventWithBanner(storage: MemoryFileStorage, base: string) {
    return saveEventWithBanner(db, storage, { userId, eventId: null, input, banner: banner(base) });
  }

  const bannerPathOf = async (eventId: string) => (await getEventForEdit(db, eventId))!.event.bannerPath;

  it("stores every variant and points the new event at the largest one", async () => {
    const storage = new MemoryFileStorage();
    const id = await eventWithBanner(storage, "aaa");
    expect(await bannerPathOf(id)).toBe("aaa.webp");
    expect(storage.names()).toEqual(["aaa-600.webp", "aaa.webp"]);
  });

  it("replaces the banner and deletes the old files", async () => {
    const storage = new MemoryFileStorage();
    const id = await eventWithBanner(storage, "old");
    await saveEventWithBanner(db, storage, { userId, eventId: id, input, banner: banner("new") });
    expect(await bannerPathOf(id)).toBe("new.webp");
    expect(storage.names()).toEqual(["new-600.webp", "new.webp"]);
  });

  it("keeps the new banner when deleting the old one fails", async () => {
    const storage = new MemoryFileStorage();
    const id = await eventWithBanner(storage, "old");
    storage.failDelete.add("old.webp");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await saveEventWithBanner(db, storage, { userId, eventId: id, input, banner: banner("new") });

    expect(await bannerPathOf(id)).toBe("new.webp");
    expect(await storage.read("new.webp")).not.toBeNull();
    expect(await storage.read("new-600.webp")).not.toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("old.webp"));
  });

  it("leaves no new variant behind and keeps the previous banner when a save fails", async () => {
    const storage = new MemoryFileStorage();
    const id = await eventWithBanner(storage, "old");
    storage.failSave.add("new-600.webp");

    await expect(
      saveEventWithBanner(db, storage, { userId, eventId: id, input, banner: banner("new") }),
    ).rejects.toBeInstanceOf(BannerStorageError);

    expect(storage.names()).toEqual(["old-600.webp", "old.webp"]);
    expect(await bannerPathOf(id)).toBe("old.webp");
  });

  it("deletes the new variants when the event breaks a rule", async () => {
    const storage = new MemoryFileStorage();
    await expect(
      saveEventWithBanner(db, storage, {
        userId,
        eventId: null,
        input: { ...input, bannerAlt: "" },
        banner: banner("new"),
      }),
    ).rejects.toBeInstanceOf(EventRuleError);
    expect(storage.names()).toEqual([]);
  });

  it("saves an event without a banner and keeps the current one", async () => {
    const storage = new MemoryFileStorage();
    const id = await eventWithBanner(storage, "kept");
    await saveEventWithBanner(db, storage, { userId, eventId: id, input, banner: null });
    expect(await bannerPathOf(id)).toBe("kept.webp");
    expect(storage.names()).toEqual(["kept-600.webp", "kept.webp"]);
  });
});
