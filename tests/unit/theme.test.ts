import { describe, expect, it } from "vitest";
import { applyTheme, parseTheme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/ui/theme/theme";

function fakeStorage(initial: Record<string, string> = {}, broken = false) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => {
      if (broken) throw new Error("storage disabled");
      return data.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (broken) throw new Error("storage disabled");
      data.set(key, value);
    },
  };
}
const fakeRoot = () => ({ dataset: {} as Record<string, string | undefined> });

describe("theme preference (B-77)", () => {
  it("only recognises the dark theme; anything else is light", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect([null, "", "light", "DARK", "blue"].map(parseTheme)).toEqual([
      "light",
      "light",
      "light",
      "light",
      "light",
    ]);
  });

  it("applies the theme to the root element and remembers it in this browser only", () => {
    const root = fakeRoot();
    const storage = fakeStorage();
    applyTheme("dark", root, storage);
    expect(root.dataset.theme).toBe("dark");
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe("dark");
    applyTheme("light", root, storage);
    expect(root.dataset.theme).toBeUndefined();
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe("light");
  });

  it("still switches the theme when the browser blocks storage", () => {
    const root = fakeRoot();
    expect(() => applyTheme("dark", root, fakeStorage({}, true))).not.toThrow();
    expect(root.dataset.theme).toBe("dark");
  });

  it("restores a saved dark theme before paint, and ignores missing or blocked storage", () => {
    const run = (storage: ReturnType<typeof fakeStorage>) => {
      const document = { documentElement: fakeRoot() };
      new Function("document", "localStorage", THEME_INIT_SCRIPT)(document, storage);
      return document.documentElement.dataset.theme;
    };
    expect(run(fakeStorage({ [THEME_STORAGE_KEY]: "dark" }))).toBe("dark");
    expect(run(fakeStorage({ [THEME_STORAGE_KEY]: "light" }))).toBeUndefined();
    expect(run(fakeStorage())).toBeUndefined();
    expect(run(fakeStorage({}, true))).toBeUndefined();
  });
});
