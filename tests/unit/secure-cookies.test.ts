import { describe, expect, it } from "vitest";
import { shouldUseSecureCookies } from "@/infrastructure/config";

describe("secure cookies", () => {
  const production = { isProduction: true, allowInsecureLocalhostCookies: false };

  it("are secure in production", () => {
    expect(shouldUseSecureCookies({ ...production, publicBaseUrl: "https://agenda.example.com" })).toBe(true);
    expect(shouldUseSecureCookies({ ...production, publicBaseUrl: "http://localhost:3000" })).toBe(true);
  });

  it("are not secure in development", () => {
    expect(
      shouldUseSecureCookies({
        isProduction: false,
        allowInsecureLocalhostCookies: false,
        publicBaseUrl: "http://localhost:3000",
      }),
    ).toBe(false);
  });

  it("may drop Secure in a production build only when explicitly allowed and served over plain-HTTP loopback", () => {
    const allowed = { isProduction: true, allowInsecureLocalhostCookies: true };
    expect(shouldUseSecureCookies({ ...allowed, publicBaseUrl: "http://localhost:3201" })).toBe(false);
    expect(shouldUseSecureCookies({ ...allowed, publicBaseUrl: "http://127.0.0.1:3201" })).toBe(false);
    // The opt-in never weakens a real deployment.
    expect(shouldUseSecureCookies({ ...allowed, publicBaseUrl: "https://localhost:3201" })).toBe(true);
    expect(shouldUseSecureCookies({ ...allowed, publicBaseUrl: "http://agenda.example.com" })).toBe(true);
    expect(shouldUseSecureCookies({ ...allowed, publicBaseUrl: "http://localhost.example.com" })).toBe(true);
  });
});
