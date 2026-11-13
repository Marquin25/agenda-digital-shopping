import { describe, expect, it } from "vitest";
import { retentionCutoffs } from "@/domain/privacy/retention-policy";

describe("retentionCutoffs (docs/spec/04 §Retenção)", () => {
  const cutoffs = retentionCutoffs(new Date("2026-11-13T12:00:00Z"));

  it("keeps device-level metrics for 30 local days, counting today", () => {
    // 2026-11-13 09:00 in São Paulo; rows from 2026-10-15 onwards (17 days in October + 13 in November) are kept.
    expect(cutoffs.deviceMetricsBefore).toBe("2026-10-15");
  });

  it("keeps the audit log for one year", () => {
    expect(cutoffs.auditLogBefore.toISOString()).toBe("2025-11-13T12:00:00.000Z");
  });

  it("uses the local (mall) day, not the UTC day", () => {
    // 02:00 UTC on the 14th is still the 13th in São Paulo.
    expect(retentionCutoffs(new Date("2026-11-14T02:00:00Z")).deviceMetricsBefore).toBe("2026-10-15");
  });
});
