import { describe, expect, it } from "vitest";
import { clientIp } from "@/infrastructure/web/request";

describe("clientIp", () => {
  it("uses the address appended by the trusted proxy, not the client-supplied prefix", () => {
    const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" });
    expect(clientIp(headers, 1)).toBe("203.0.113.7");
  });

  it("skips the addresses appended by every trusted proxy when there is more than one", () => {
    // Client forged 6.6.6.6; the edge proxy appended the real client, the internal proxy appended the edge.
    const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.5" });
    expect(clientIp(headers, 2)).toBe("203.0.113.7");
  });

  it("uses the first address when the header has fewer entries than trusted proxies", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7" }), 2)).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP and then to a shared key", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }), 1)).toBe("198.51.100.2");
    expect(clientIp(new Headers(), 1)).toBe("unknown");
  });
});
