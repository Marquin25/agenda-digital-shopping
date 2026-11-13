import { describe, expect, it } from "vitest";
import { getEventStatus } from "@/domain/events/event-status";

const startsAt = new Date("2026-11-22T22:00:00Z");
const endsAt = new Date("2026-11-23T00:00:00Z");
const base = { publicationStatus: "published" as const, startsAt, endsAt, endedAt: null };

describe("getEventStatus", () => {
  it("returns draft for unpublished events regardless of dates", () => {
    expect(getEventStatus({ ...base, publicationStatus: "draft" }, new Date("2026-11-22T23:00:00Z"))).toBe(
      "draft",
    );
  });

  it("returns cancelled for cancelled events", () => {
    expect(getEventStatus({ ...base, publicationStatus: "cancelled" }, startsAt)).toBe("cancelled");
  });

  it("is scheduled before the start", () => {
    expect(getEventStatus(base, new Date("2026-11-22T21:59:59Z"))).toBe("scheduled");
  });

  it("is ongoing exactly at the start", () => {
    expect(getEventStatus(base, startsAt)).toBe("ongoing");
  });

  it("is ended exactly at the planned end", () => {
    expect(getEventStatus(base, endsAt)).toBe("ended");
  });

  it("is ended after an early manual end even before the planned end", () => {
    const endedAt = new Date("2026-11-22T23:00:00Z");
    expect(getEventStatus({ ...base, endedAt }, new Date("2026-11-22T23:30:00Z"))).toBe("ended");
  });
});
