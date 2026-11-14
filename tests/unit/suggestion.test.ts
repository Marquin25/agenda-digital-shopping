import { describe, expect, it } from "vitest";
import {
  MAX_SUGGESTION_LENGTH,
  parseSuggestionForm,
  SUGGESTION_STATUS_LABELS,
} from "@/domain/suggestions/suggestion";

describe("suggestion form (B-29, docs/spec/04: texto ≤ 500, categoria opcional)", () => {
  it("accepts a trimmed text with or without a category", () => {
    expect(
      parseSuggestionForm({ text: "  Mais oficinas para crianças aos sábados.  ", categoryId: "3" }),
    ).toEqual({
      ok: true,
      value: { text: "Mais oficinas para crianças aos sábados.", categoryId: 3 },
    });
    expect(parseSuggestionForm({ text: "Show de jazz no fim da tarde", categoryId: "" })).toEqual({
      ok: true,
      value: { text: "Show de jazz no fim da tarde", categoryId: null },
    });
  });

  it("requires at least 10 characters and at most 500", () => {
    expect(MAX_SUGGESTION_LENGTH).toBe(500);
    for (const text of [undefined, "", "   ", "curto"]) {
      expect(parseSuggestionForm({ text, categoryId: "" })).toEqual({
        ok: false,
        errors: { text: "Escreva sua sugestão com pelo menos 10 caracteres." },
      });
    }
    expect(parseSuggestionForm({ text: "a".repeat(501), categoryId: "" })).toEqual({
      ok: false,
      errors: { text: "A sugestão pode ter até 500 caracteres." },
    });
  });

  it("refuses a malformed category", () => {
    expect(parseSuggestionForm({ text: "Mais eventos de música", categoryId: "musica" })).toEqual({
      ok: false,
      errors: { categoryId: "Escolha um tema da lista." },
    });
  });

  it("names the three triage states in Portuguese", () => {
    expect(SUGGESTION_STATUS_LABELS).toEqual({ new: "Nova", read: "Lida", archived: "Arquivada" });
  });
});
