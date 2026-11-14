import { describe, expect, it } from "vitest";
import {
  nextSlideIndex,
  parseSignageSettings,
  selectHighlights,
  signageAgendaUrl,
  signageEventUrl,
} from "@/domain/signage/signage";
import { resolveTrafficSource } from "@/domain/metrics/traffic-source";

const params = (query: string) => new URLSearchParams(query);

describe("digital signage settings (per-screen URL parameters)", () => {
  it("uses safe defaults when the screen URL has no parameters", () => {
    const settings = parseSignageSettings(params(""));
    expect(settings.screen).toBeNull();
    expect(settings.intervalMs).toBe(12_000);
    expect(settings.limit).toBe(8);
    expect(settings.filters).toEqual({ query: "", categories: [], features: [], date: { kind: "all" } });
  });

  it("reads the screen name, rotation interval, number of highlights and agenda filters", () => {
    const settings = parseSignageSettings(
      params("tela=entrada-a&intervalo=20&limite=3&categoria=musica&acessibilidade=libras&data=hoje"),
    );
    expect(settings.screen).toBe("entrada-a");
    expect(settings.intervalMs).toBe(20_000);
    expect(settings.limit).toBe(3);
    expect(settings.filters.categories).toEqual(["musica"]);
    expect(settings.filters.features).toEqual(["libras"]);
    expect(settings.filters.date).toEqual({ kind: "today" });
  });

  it("keeps every slide on screen for at least 6 seconds and at most 60", () => {
    expect(parseSignageSettings(params("intervalo=1")).intervalMs).toBe(6_000);
    expect(parseSignageSettings(params("intervalo=600")).intervalMs).toBe(60_000);
    expect(parseSignageSettings(params("intervalo=abc")).intervalMs).toBe(12_000);
  });

  it("shows between 1 and 12 highlights", () => {
    expect(parseSignageSettings(params("limite=0")).limit).toBe(1);
    expect(parseSignageSettings(params("limite=99")).limit).toBe(12);
    expect(parseSignageSettings(params("limite=2.5")).limit).toBe(8);
  });

  it("ignores screen names that are not short lowercase slugs", () => {
    for (const bad of ["Entrada A", "<script>", "a".repeat(33), ""]) {
      expect(parseSignageSettings(params(`tela=${encodeURIComponent(bad)}`)).screen).toBeNull();
    }
  });

  it("ignores the agenda's free-text search (a screen has no keyboard)", () => {
    expect(parseSignageSettings(params("q=show")).filters.query).toBe("");
  });
});

describe("digital signage QR links", () => {
  const base = "https://agenda.example.com";

  it("tags the event link with the 'painel' origin and the screen name", () => {
    expect(signageEventUrl(base, "show-acustico", "entrada-a")).toBe(
      "https://agenda.example.com/eventos/show-acustico?utm_source=painel&utm_campaign=entrada-a",
    );
    expect(signageEventUrl(`${base}/`, "show-acustico", null)).toBe(
      "https://agenda.example.com/eventos/show-acustico?utm_source=painel",
    );
  });

  it("is counted under the digital signage channel when a visitor opens it", () => {
    const url = new URL(signageEventUrl(base, "show-acustico", "entrada-a"));
    const source = resolveTrafficSource(
      { utmSource: url.searchParams.get("utm_source"), utmCampaign: url.searchParams.get("utm_campaign") },
      null,
    );
    expect(source).toEqual({ channel: "digital_signage", promoCode: "entrada-a", fromCurrentPage: true });
  });

  it("points to the agenda when there is nothing to highlight", () => {
    expect(signageAgendaUrl(base, "praca")).toBe(
      "https://agenda.example.com/?utm_source=painel&utm_campaign=praca",
    );
  });
});

describe("digital signage highlights", () => {
  const at = (iso: string) => new Date(iso);
  const event = (
    slug: string,
    status: "scheduled" | "ongoing" | "cancelled" | "ended",
    startsAt: string,
  ) => ({
    slug,
    status,
    startsAt: at(startsAt),
  });

  it("shows what is happening now first, then the next events in start order", () => {
    const events = [
      event("tomorrow", "scheduled", "2026-11-15T19:00:00Z"),
      event("later-today", "scheduled", "2026-11-14T22:00:00Z"),
      event("now", "ongoing", "2026-11-14T15:00:00Z"),
    ];
    expect(selectHighlights(events, 8).map((e) => e.slug)).toEqual(["now", "later-today", "tomorrow"]);
  });

  it("leaves out cancelled and ended events and respects the limit", () => {
    const events = [
      event("cancelled", "cancelled", "2026-11-14T18:00:00Z"),
      event("ended", "ended", "2026-11-14T10:00:00Z"),
      event("a", "scheduled", "2026-11-14T19:00:00Z"),
      event("b", "scheduled", "2026-11-14T20:00:00Z"),
      event("c", "scheduled", "2026-11-14T21:00:00Z"),
    ];
    expect(selectHighlights(events, 2).map((e) => e.slug)).toEqual(["a", "b"]);
  });
});

describe("digital signage rotation", () => {
  it("advances to the next highlight and wraps around to the first", () => {
    expect(nextSlideIndex(0, 3)).toBe(1);
    expect(nextSlideIndex(2, 3)).toBe(0);
  });

  it("stays put when there is at most one highlight", () => {
    expect(nextSlideIndex(0, 1)).toBe(0);
    expect(nextSlideIndex(0, 0)).toBe(0);
  });
});
