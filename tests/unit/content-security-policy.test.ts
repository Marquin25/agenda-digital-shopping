import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/infrastructure/web/content-security-policy";

const directives = (policy: string) =>
  Object.fromEntries(policy.split("; ").map((d) => [d.split(" ")[0], d.split(" ").slice(1).join(" ")]));

describe("buildContentSecurityPolicy", () => {
  it("allows only scripts carrying this response's nonce, never inline or eval in production", () => {
    const csp = directives(buildContentSecurityPolicy({ nonce: "abc123", development: false }));
    expect(csp["script-src"]).toBe("'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp["object-src"]).toBe("'none'");
    expect(csp["frame-ancestors"]).toBe("'none'");
  });

  it("adds 'unsafe-eval' only in development (React debugging)", () => {
    const csp = directives(buildContentSecurityPolicy({ nonce: "abc123", development: true }));
    expect(csp["script-src"]).toBe("'self' 'nonce-abc123' 'strict-dynamic' 'unsafe-eval'");
  });
});
