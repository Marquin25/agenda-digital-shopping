import { describe, expect, it } from "vitest";
import { formatDayHeading, formatEventDate, formatEventTime } from "@/ui/format";

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
