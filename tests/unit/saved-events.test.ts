import { describe, expect, it } from "vitest";
import { MAX_SAVED_EVENTS, parseSavedSlugs, toggleSavedSlug } from "@/domain/agenda/saved-events";

describe("saved events (kept only on the visitor's device)", () => {
  it("reads the slugs stored on the device", () => {
    expect(parseSavedSlugs('["show-de-natal","feira-geek"]')).toEqual(["show-de-natal", "feira-geek"]);
  });

  it("treats missing, corrupted or foreign data as an empty list", () => {
    expect(parseSavedSlugs(null)).toEqual([]);
    expect(parseSavedSlugs("{not json")).toEqual([]);
    expect(parseSavedSlugs('{"a":1}')).toEqual([]);
  });

  it("keeps only valid, distinct slugs", () => {
    expect(parseSavedSlugs('["show", "show", 42, "<script>", "Feira Geek", "feira-geek"]')).toEqual([
      "show",
      "feira-geek",
    ]);
  });

  it("saves an event at the top of the list and removes it on the second toggle", () => {
    expect(toggleSavedSlug(["feira-geek"], "show")).toEqual(["show", "feira-geek"]);
    expect(toggleSavedSlug(["show", "feira-geek"], "show")).toEqual(["feira-geek"]);
  });

  it("forgets the oldest saved events beyond the limit", () => {
    const full = Array.from({ length: MAX_SAVED_EVENTS }, (_, i) => `evento-${i}`);
    const next = toggleSavedSlug(full, "novo");
    expect(next).toHaveLength(MAX_SAVED_EVENTS);
    expect(next[0]).toBe("novo");
    expect(next).not.toContain(`evento-${MAX_SAVED_EVENTS - 1}`);
  });
});
