import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/infrastructure/web/security-headers";

const asMap = (production: boolean) =>
  Object.fromEntries(securityHeaders({ production }).map((h) => [h.key, h.value]));

describe("security headers (docs/seguranca/asvs-nivel-1.md)", () => {
  it("sets the browser hardening headers on every response", () => {
    expect(asMap(false)).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      "X-Frame-Options": "DENY",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
  });

  it("adds HSTS only in production, where the site is served over HTTPS", () => {
    expect(asMap(true)["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(asMap(false)).not.toHaveProperty("Strict-Transport-Security");
  });
});
