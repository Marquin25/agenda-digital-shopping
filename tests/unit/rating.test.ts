import { describe, expect, it } from "vitest";
import {
  isLikelyAutomated,
  MAX_COMMENT_LENGTH,
  parseRatingForm,
  RATING_PERIOD_DAYS,
  ratingWindow,
  ratingWindowState,
  summarizeRatings,
} from "@/domain/ratings/rating";

const at = (iso: string) => new Date(iso);

describe("rating window (docs/spec/03 §8)", () => {
  const event = { endsAt: at("2026-11-10T21:00:00Z"), endedAt: null };

  it("opens when the event ends and closes N days later (7 by default)", () => {
    expect(RATING_PERIOD_DAYS.default).toBe(7);
    expect(ratingWindow(event, 7)).toEqual({
      opensAt: at("2026-11-10T21:00:00Z"),
      closesAt: at("2026-11-17T21:00:00Z"),
    });
  });

  it("starts from the actual end when the team ended the event early", () => {
    expect(ratingWindow({ ...event, endedAt: at("2026-11-10T19:30:00Z") }, 2).opensAt).toEqual(
      at("2026-11-10T19:30:00Z"),
    );
  });

  it("is not open before the end, open until the deadline, closed after it", () => {
    const window = ratingWindow(event, 7);
    expect(ratingWindowState(window, at("2026-11-10T20:59:59Z"))).toBe("not_open");
    expect(ratingWindowState(window, at("2026-11-10T21:00:00Z"))).toBe("open");
    expect(ratingWindowState(window, at("2026-11-17T20:59:59Z"))).toBe("open");
    expect(ratingWindowState(window, at("2026-11-17T21:00:00Z"))).toBe("closed");
  });
});

describe("rating form", () => {
  it("accepts a score with optional tags and comment, trimming the comment and ignoring repeated tags", () => {
    expect(
      parseRatingForm({ score: "4", tags: ["horario", "atracao", "horario"], comment: "  Gostei!  " }),
    ).toEqual({
      ok: true,
      value: { score: 4, tags: ["horario", "atracao"], comment: "Gostei!" },
    });
    expect(parseRatingForm({ score: "5", tags: [], comment: "   " })).toEqual({
      ok: true,
      value: { score: 5, tags: [], comment: null },
    });
  });

  it("requires a whole score from 1 to 5", () => {
    for (const score of [undefined, "", "0", "6", "3.5", "abc"]) {
      const result = parseRatingForm({ score, tags: [], comment: "" });
      expect(result).toEqual({ ok: false, errors: { score: "Escolha uma nota de 1 a 5." } });
    }
  });

  it("refuses unknown tags and comments longer than 280 characters", () => {
    expect(parseRatingForm({ score: "3", tags: ["preco"], comment: "" })).toEqual({
      ok: false,
      errors: { tags: "Escolha só entre as opções da lista." },
    });
    expect(MAX_COMMENT_LENGTH).toBe(280);
    expect(parseRatingForm({ score: "3", tags: [], comment: "a".repeat(281) })).toEqual({
      ok: false,
      errors: { comment: "O comentário pode ter até 280 caracteres." },
    });
  });
});

describe("automated submissions (honeypot and minimum filling time)", () => {
  const startedAt = at("2026-11-14T12:00:00Z").getTime();

  it("lets a person who took a few seconds through", () => {
    expect(isLikelyAutomated({ honeypot: "", startedAt: String(startedAt), now: startedAt + 4_000 })).toBe(
      false,
    );
  });

  it("flags a filled honeypot, a form sent too fast and a missing or invalid start time", () => {
    expect(isLikelyAutomated({ honeypot: "x", startedAt: String(startedAt), now: startedAt + 60_000 })).toBe(
      true,
    );
    expect(isLikelyAutomated({ honeypot: "", startedAt: String(startedAt), now: startedAt + 1_000 })).toBe(
      true,
    );
    expect(isLikelyAutomated({ honeypot: "", startedAt: "abc", now: startedAt })).toBe(true);
    expect(isLikelyAutomated({ honeypot: "", startedAt: undefined, now: startedAt })).toBe(true);
  });
});

describe("rating summary (CSAT is not NPS)", () => {
  it("reports the sample size, average, share of 4–5 scores and the distribution", () => {
    expect(summarizeRatings([5, 4, 3, 5, 1])).toEqual({
      count: 5,
      average: 3.6,
      csat: 0.6,
      distribution: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 2 },
    });
  });

  it("has no average or CSAT without ratings (never 0)", () => {
    expect(summarizeRatings([])).toEqual({
      count: 0,
      average: null,
      csat: null,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });
});
