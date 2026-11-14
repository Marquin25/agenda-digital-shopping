import { describe, expect, it } from "vitest";
import { can } from "@/domain/auth/permissions";

describe("permissions matrix (docs/spec/01 §7)", () => {
  it("lets every role view dashboards", () => {
    expect(can("administrator", "dashboard:view")).toBe(true);
    expect(can("editor", "dashboard:view")).toBe(true);
    expect(can("analyst", "dashboard:view")).toBe(true);
  });

  it("lets editors manage events, venues and promo links but not users", () => {
    expect(can("editor", "events:manage")).toBe(true);
    expect(can("editor", "venues:manage")).toBe(true);
    expect(can("editor", "promo-links:manage")).toBe(true);
    expect(can("editor", "users:manage")).toBe(false);
  });

  it("lets administrators and editors manage stores and segments, not analysts", () => {
    expect(can("administrator", "stores:manage")).toBe(true);
    expect(can("editor", "stores:manage")).toBe(true);
    expect(can("analyst", "stores:manage")).toBe(false);
  });

  it("lets only administrators maintain the experience catalog until P-INT-IA-1 is decided", () => {
    expect(can("administrator", "catalog:manage")).toBe(true);
    expect(can("editor", "catalog:manage")).toBe(false);
    expect(can("analyst", "catalog:manage")).toBe(false);
  });

  it("lets administrators and analysts write planning briefs until P-INT-IA-2 is decided", () => {
    expect(can("administrator", "plans:manage")).toBe(true);
    expect(can("analyst", "plans:manage")).toBe(true);
    expect(can("editor", "plans:manage")).toBe(false);
  });

  it("lets administrators and editors moderate ratings and suggestions; analysts only read them", () => {
    expect(can("administrator", "feedback:moderate")).toBe(true);
    expect(can("editor", "feedback:moderate")).toBe(true);
    expect(can("analyst", "feedback:moderate")).toBe(false);
  });

  it("keeps analysts read-only", () => {
    expect(can("analyst", "events:manage")).toBe(false);
    expect(can("analyst", "promo-links:manage")).toBe(false);
  });

  it("reserves user management and audit to administrators", () => {
    expect(can("administrator", "users:manage")).toBe(true);
    expect(can("administrator", "audit:view")).toBe(true);
    expect(can("analyst", "audit:view")).toBe(false);
  });
});
