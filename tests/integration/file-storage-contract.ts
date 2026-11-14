import { describe, expect, it } from "vitest";
import type { FileStorage } from "@/infrastructure/storage/file-storage";

/** Behaviour every `FileStorage` adapter must share (docs/spec/05 §6, Liskov). */
export function describeFileStorageContract(name: string, createStorage: () => Promise<FileStorage>) {
  describe(`${name} (FileStorage contract)`, () => {
    it("reads back what was saved and returns null for a missing file", async () => {
      const storage = await createStorage();
      await storage.save("banner-a.webp", Buffer.from("first"));
      expect((await storage.read("banner-a.webp"))?.toString()).toBe("first");
      expect(await storage.read("missing.webp")).toBeNull();
    });

    it("overwrites a file saved again under the same name", async () => {
      const storage = await createStorage();
      await storage.save("banner-a.webp", Buffer.from("first"));
      await storage.save("banner-a.webp", Buffer.from("second"));
      expect((await storage.read("banner-a.webp"))?.toString()).toBe("second");
    });

    it("deletes a file and ignores a missing one", async () => {
      const storage = await createStorage();
      await storage.save("banner-a.webp", Buffer.from("first"));
      await storage.delete("banner-a.webp");
      await storage.delete("banner-a.webp");
      expect(await storage.read("banner-a.webp")).toBeNull();
    });

    it("lists stored files with their modification time", async () => {
      const storage = await createStorage();
      expect(await storage.list()).toEqual([]);
      const before = Date.now() - 1000;
      await storage.save("banner-a.webp", Buffer.from("a"));
      await storage.save("banner-b-600.webp", Buffer.from("b"));
      const files = await storage.list();
      expect(files.map((f) => f.name).sort()).toEqual(["banner-a.webp", "banner-b-600.webp"]);
      for (const file of files) {
        expect(file.modifiedAt).toBeInstanceOf(Date);
        expect(file.modifiedAt.getTime()).toBeGreaterThanOrEqual(before);
      }
    });

    it("rejects unsafe file names before touching the storage", async () => {
      const storage = await createStorage();
      for (const unsafe of ["../secret.webp", "a/b.webp", "Banner.webp", "banner.png"]) {
        await expect(storage.save(unsafe, Buffer.from("x"))).rejects.toThrow("Invalid file name");
        await expect(storage.read(unsafe)).rejects.toThrow("Invalid file name");
        await expect(storage.delete(unsafe)).rejects.toThrow("Invalid file name");
      }
      expect(await storage.list()).toEqual([]);
    });
  });
}
