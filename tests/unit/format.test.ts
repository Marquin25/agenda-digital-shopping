import { describe, expect, it } from "vitest";
import {
  formatCostRange,
  formatDateKeyRange,
  formatDayHeading,
  formatDuration,
  formatEventDate,
  formatEventTime,
} from "@/ui/format";

describe("formatDayHeading", () => {
  it("capitalises only the first letter, as in Portuguese", () => {
    expect(formatDayHeading(new Date("2026-11-13T15:00:00Z"))).toBe("Sexta-feira, 13 de novembro");
  });
});

describe("event date and time, shown separately on the event page", () => {
  // 2026-11-13 19:00–21:00 in São Paulo.
  const start = new Date("2026-11-13T22:00:00Z");
  const end = new Date("2026-11-14T00:00:00Z");

  it("shows one date and the time range for a same-day event", () => {
    expect(formatEventDate(start, end)).toBe("Sexta-feira, 13 de novembro");
    expect(formatEventTime(start, end)).toBe("19:00 às 21:00");
  });

  it("shows both dates when the event spans several days", () => {
    const later = new Date("2026-11-15T23:00:00Z");
    expect(formatEventDate(start, later)).toBe("13 de novembro a 15 de novembro");
    expect(formatEventTime(start, later)).toBe("Das 19:00 de 13/11 às 20:00 de 15/11");
  });
});

describe("formatCostRange", () => {
  it("shows the informed range in reais without cents", () => {
    expect(formatCostRange(3000, 8000).replace(/\s/g, " ")).toBe("R$ 3.000 a R$ 8.000");
  });

  it("shows a single value when minimum and maximum match", () => {
    expect(formatCostRange(1500, 1500).replace(/\s/g, " ")).toBe("R$ 1.500");
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45 min"],
    [120, "2 h"],
    [90, "1 h 30 min"],
  ])("%i minutes → %s", (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe("formatDateKeyRange", () => {
  it("shows a planning period in Brazilian date format", () => {
    expect(formatDateKeyRange("2027-03-01", "2027-03-31")).toBe("01/03/2027 a 31/03/2027");
  });

  it("shows a single date when the period is one day", () => {
    expect(formatDateKeyRange("2027-03-06", "2027-03-06")).toBe("06/03/2027");
  });
});
