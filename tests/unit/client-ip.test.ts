import { describe, expect, it } from "vitest";
import { clientIp } from "@/infrastructure/web/request";

describe("clientIp", () => {
  it("uses the address appended by the trusted proxy, not the client-supplied prefix", () => {
    const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP and then to a shared key", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
