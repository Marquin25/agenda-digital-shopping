import { describe, expect, it } from "vitest";
import { formatDayHeading } from "@/ui/format";

describe("formatDayHeading", () => {
  it("capitalises only the first letter, as in Portuguese", () => {
    expect(formatDayHeading(new Date("2026-11-13T15:00:00Z"))).toBe("Sexta-feira, 13 de novembro");
  });
});
