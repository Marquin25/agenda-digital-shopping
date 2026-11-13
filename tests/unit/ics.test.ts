import { describe, expect, it } from "vitest";
import { buildIcs } from "@/domain/calendar/ics";

const event = {
  id: "8f14e45f-ceea-467a-9b3c-1a2b3c4d5e6f",
  title: "Show; Acústico, de Sábado",
  description: "Linha 1\nLinha 2",
  location: "Piso L1, próximo à Fonte",
  url: "https://agenda.example.com/eventos/show-acustico",
  startsAt: new Date("2026-11-22T22:00:00Z"),
  endsAt: new Date("2026-11-23T00:00:00Z"),
  sequence: 2,
  cancelled: false,
};

describe("buildIcs (RFC 5545)", () => {
  const ics = buildIcs(event, { domain: "agenda.example.com", now: new Date("2026-11-13T12:00:00Z") });
  const unfolded = ics.replace(/\r\n /g, "");

  it("uses CRLF line endings and wraps a single VEVENT", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(unfolded).toContain("BEGIN:VEVENT\r\n");
  });

  it("has a stable UID, DTSTAMP and UTC start/end", () => {
    expect(unfolded).toContain("UID:event-8f14e45f-ceea-467a-9b3c-1a2b3c4d5e6f@agenda.example.com\r\n");
    expect(unfolded).toContain("DTSTAMP:20261113T120000Z\r\n");
    expect(unfolded).toContain("DTSTART:20261122T220000Z\r\n");
    expect(unfolded).toContain("DTEND:20261123T000000Z\r\n");
    expect(unfolded).toContain("SEQUENCE:2\r\n");
  });

  it("escapes commas, semicolons and newlines in text", () => {
    expect(unfolded).toContain("SUMMARY:Show\; Acústico\\, de Sábado\r\n");
    expect(unfolded).toContain("DESCRIPTION:Linha 1\\nLinha 2\r\n");
  });

  it("folds lines longer than 75 octets", () => {
    const long = buildIcs({ ...event, description: "é".repeat(100) }, { domain: "d", now: new Date(0) });
    for (const line of long.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("marks cancelled events", () => {
    const cancelled = buildIcs({ ...event, cancelled: true }, { domain: "d", now: new Date(0) });
    expect(cancelled).toContain("STATUS:CANCELLED\r\n");
  });
});
