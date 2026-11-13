import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  localDateTimeToUtc,
  toLocalDateKey,
  toLocalDateTimeInput,
  weekdayOf,
} from "@/domain/time/time-zone";

describe("localDateTimeToUtc (America/Sao_Paulo)", () => {
  it("converts a current (UTC-3) local time", () => {
    expect(localDateTimeToUtc("2026-11-22T19:00").toISOString()).toBe("2026-11-22T22:00:00.000Z");
  });

  it("uses the historical offset when daylight saving was in force (UTC-2 in Jan 2019)", () => {
    expect(localDateTimeToUtc("2019-01-15T19:00").toISOString()).toBe("2019-01-15T21:00:00.000Z");
  });

  it("rejects malformed input", () => {
    expect(() => localDateTimeToUtc("22/11/2026 19:00")).toThrow();
  });
});

describe("local date helpers", () => {
  it("returns the local calendar date for a UTC instant late at night", () => {
    expect(toLocalDateKey(new Date("2026-11-23T01:30:00Z"))).toBe("2026-11-22");
  });

  it("round-trips a UTC instant to a datetime-local value", () => {
    expect(toLocalDateTimeInput(new Date("2026-11-22T22:00:00Z"))).toBe("2026-11-22T19:00");
  });

  it("adds days across a month boundary", () => {
    expect(addDaysToDateKey("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("knows the weekday of a date key (0 = Sunday)", () => {
    expect(weekdayOf("2026-11-22")).toBe(0);
  });
});
