import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { listCategories } from "@/application/catalog/catalog";
import { deleteDeviceData } from "@/application/metrics/record-metrics";
import { applyRetention } from "@/application/metrics/retention";
import {
  countSuggestionsByStatus,
  listSuggestions,
  setSuggestionStatus,
  submitSuggestion,
  SUGGESTIONS_PER_DEVICE_PER_DAY,
} from "@/application/suggestions/suggestions";
import { auditLog, suggestions } from "@/infrastructure/db/schema";
import { MemoryFileStorage } from "./memory-file-storage";
import { createTestDb } from "./test-db";

const NOW = new Date("2026-11-14T15:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const idea = (text: string, categoryId: number | null = null) => ({ text, categoryId });

describe("suggestions wall (B-29)", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());

  const userId = await createAdminUser(db, null, {
    name: "Editor",
    email: "editor@example.test",
    role: "editor",
    temporaryPassword: "senha-de-teste-longa",
  });
  const music = (await listCategories(db)).find((c) => c.name === "Música")!;

  it("records a suggestion with an optional theme, as new", async () => {
    expect(
      await submitSuggestion(db, { deviceHash: "s1", input: idea("Mais shows de jazz", music.id), now: NOW }),
    ).toBe("recorded");
    const [listed] = await listSuggestions(db, {});
    expect(listed).toMatchObject({ text: "Mais shows de jazz", categoryName: "Música", status: "new" });
    expect(JSON.stringify(listed)).not.toMatch(/s1|deviceHash/);
  });

  it("refuses a theme that does not exist", async () => {
    expect(
      await submitSuggestion(db, { deviceHash: "s2", input: idea("Tema inválido aqui", 99_999), now: NOW }),
    ).toBe("invalid_category");
  });

  it("accepts 3 suggestions per device in 24 hours (docs/spec/03 §5)", async () => {
    expect(SUGGESTIONS_PER_DEVICE_PER_DAY).toBe(3);
    for (let i = 0; i < 3; i++)
      expect(
        await submitSuggestion(db, { deviceHash: "s3", input: idea(`Ideia número ${i}`), now: NOW }),
      ).toBe("recorded");
    expect(await submitSuggestion(db, { deviceHash: "s3", input: idea("Ideia número 4"), now: NOW })).toBe(
      "daily_limit",
    );
    const nextDay = new Date(NOW.getTime() + DAY);
    expect(
      await submitSuggestion(db, { deviceHash: "s3", input: idea("Ideia do dia seguinte"), now: nextDay }),
    ).toBe("recorded");
  });

  it("moves a suggestion between new, read and archived, audited without the text", async () => {
    await submitSuggestion(db, { deviceHash: "s4", input: idea("Feira de adoção de pets"), now: NOW });
    const target = (await listSuggestions(db, {})).find((s) => s.text === "Feira de adoção de pets")!;
    expect(await setSuggestionStatus(db, userId, target.id, "read")).toBe(true);
    expect(await setSuggestionStatus(db, userId, target.id, "archived")).toBe(true);
    expect(await setSuggestionStatus(db, userId, crypto.randomUUID(), "read")).toBe(false);

    expect((await listSuggestions(db, { status: "archived" })).map((s) => s.text)).toEqual([
      "Feira de adoção de pets",
    ]);
    const counts = await countSuggestionsByStatus(db);
    expect(counts.archived).toBe(1);
    expect(counts.new).toBeGreaterThanOrEqual(1);

    const entries = await db.select().from(auditLog).where(eq(auditLog.entityId, target.id));
    expect(entries.map((e) => [e.action, e.details])).toEqual([
      ["suggestion.status", { status: "read" }],
      ["suggestion.status", { status: "archived" }],
    ]);
    expect(JSON.stringify(entries)).not.toContain("pets");
  });

  it("deletes a device's suggestions when the visitor deletes this device's data", async () => {
    await submitSuggestion(db, { deviceHash: "gone", input: idea("Apagar esta sugestão"), now: NOW });
    expect(await deleteDeviceData(db, "gone")).toBeGreaterThanOrEqual(1);
    expect((await listSuggestions(db, {})).some((s) => s.text === "Apagar esta sugestão")).toBe(false);
  });

  it("retention clears the device hash after 30 days and deletes suggestions after 2 years", async () => {
    await submitSuggestion(db, { deviceHash: "old", input: idea("Sugestão antiga"), now: NOW });
    const storage = new MemoryFileStorage();
    const hashOf = async () =>
      (
        await db
          .select({ h: suggestions.deviceHash })
          .from(suggestions)
          .where(eq(suggestions.text, "Sugestão antiga"))
      )[0]?.h;

    await applyRetention(db, storage, new Date(NOW.getTime() + 29 * DAY));
    expect(await hashOf()).toBe("old");
    const cleared = await applyRetention(db, storage, new Date(NOW.getTime() + 31 * DAY));
    expect(cleared.suggestionDeviceHashes).toBeGreaterThanOrEqual(1);
    expect(await hashOf()).toBeNull();

    const deleted = await applyRetention(db, storage, new Date(NOW.getTime() + 731 * DAY));
    expect(deleted.suggestions).toBeGreaterThanOrEqual(1);
    expect(await hashOf()).toBeUndefined();
  });
});
