import { describe, expect, it } from "vitest";
import { getDateWindow, parseAgendaFilters, toAgendaQueryString } from "@/domain/agenda/agenda-filters";
import { normalizeSearchText } from "@/domain/text/normalize";

describe("parseAgendaFilters", () => {
  it("reads text, repeated categories and accessibility features", () => {
    const filters = parseAgendaFilters(
      new URLSearchParams("q=Oficina&categoria=infantil&categoria=musica&acessibilidade=libras"),
    );
    expect(filters).toEqual({
      query: "Oficina",
      categories: ["infantil", "musica"],
      features: ["libras"],
      date: { kind: "all" },
    });
  });

  it("falls back to 'all' dates when a range is invalid", () => {
    const filters = parseAgendaFilters(new URLSearchParams("data=intervalo&de=2026-13-40&ate=2026-11-30"));
    expect(filters.date).toEqual({ kind: "all" });
  });

  it("swaps a reversed range", () => {
    const filters = parseAgendaFilters(new URLSearchParams("data=intervalo&de=2026-11-30&ate=2026-11-20"));
    expect(filters.date).toEqual({ kind: "range", from: "2026-11-20", to: "2026-11-30" });
  });

  it("ignores unsafe slugs", () => {
    const filters = parseAgendaFilters(new URLSearchParams("categoria=<script>&categoria=gastronomia"));
    expect(filters.categories).toEqual(["gastronomia"]);
  });
});

describe("getDateWindow", () => {
  it("'today' covers a single local day", () => {
    expect(getDateWindow({ kind: "today" }, "2026-11-18")).toEqual({
      from: "2026-11-18",
      toExclusive: "2026-11-19",
    });
  });

  it("'weekend' on a Wednesday covers the coming Saturday and Sunday", () => {
    expect(getDateWindow({ kind: "weekend" }, "2026-11-18")).toEqual({
      from: "2026-11-21",
      toExclusive: "2026-11-23",
    });
  });

  it("'weekend' on a Sunday covers only the rest of that Sunday", () => {
    expect(getDateWindow({ kind: "weekend" }, "2026-11-22")).toEqual({
      from: "2026-11-22",
      toExclusive: "2026-11-23",
    });
  });

  it("'range' includes the last day", () => {
    expect(getDateWindow({ kind: "range", from: "2026-11-20", to: "2026-11-21" }, "2026-11-18")).toEqual({
      from: "2026-11-20",
      toExclusive: "2026-11-22",
    });
  });

  it("'all' has no window", () => {
    expect(getDateWindow({ kind: "all" }, "2026-11-18")).toBeNull();
  });
});

describe("toAgendaQueryString", () => {
  it("serialises filters so links can be shared", () => {
    expect(
      toAgendaQueryString({ query: "show", categories: ["musica"], features: [], date: { kind: "today" } }),
    ).toBe("q=show&categoria=musica&data=hoje");
  });
});

describe("normalizeSearchText", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeSearchText("  Exposição de ARTE  ")).toBe("exposicao de arte");
  });
});
