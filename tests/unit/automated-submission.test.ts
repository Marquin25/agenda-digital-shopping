import { describe, expect, it } from "vitest";
import { isLikelyAutomated } from "@/domain/abuse/automated-submission";

const at = (iso: string) => new Date(iso);

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
