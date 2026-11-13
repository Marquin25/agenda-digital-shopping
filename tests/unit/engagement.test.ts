import { describe, expect, it } from "vitest";
import { isEngagementAction } from "@/domain/metrics/engagement";

describe("isEngagementAction", () => {
  it("accepts only the tracked actions", () => {
    expect(["share", "calendar_ics", "calendar_google"].every(isEngagementAction)).toBe(true);
    expect(isEngagementAction("interest")).toBe(false);
    expect(isEngagementAction(undefined)).toBe(false);
  });
});
