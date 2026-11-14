import { describe, expect, it } from "vitest";
import { readConfig } from "@/infrastructure/config";

// Obviously fake values: none of them is a real secret.
const BASE = { DATABASE_URL: "pglite:./storage/test-db", NODE_ENV: "test" };
const SHORT_SECRET = "short-fake-cron-value";
const VALID_SECRET = "fake-cron-secret-for-tests-only-0123456789";

describe("cron secret configuration", () => {
  it("disables scheduled jobs when CRON_SECRET is absent", () => {
    expect(readConfig(BASE).cronSecret).toBeNull();
  });

  it("treats an empty or blank CRON_SECRET as absent, as .env.example promises", () => {
    expect(readConfig({ ...BASE, CRON_SECRET: "" }).cronSecret).toBeNull();
    expect(readConfig({ ...BASE, CRON_SECRET: "   " }).cronSecret).toBeNull();
  });

  it("rejects a short CRON_SECRET without echoing its value", () => {
    let message = "";
    try {
      readConfig({ ...BASE, CRON_SECRET: SHORT_SECRET });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain("CRON_SECRET");
    expect(message).not.toContain(SHORT_SECRET);
  });

  it("accepts a CRON_SECRET with at least 32 characters", () => {
    expect(readConfig({ ...BASE, CRON_SECRET: VALID_SECRET }).cronSecret).toBe(VALID_SECRET);
  });
});

describe("blank values in other variables", () => {
  it("still refuses to start in production with a blank DEVICE_ID_PEPPER", () => {
    expect(() => readConfig({ ...BASE, NODE_ENV: "production", DEVICE_ID_PEPPER: "  " })).toThrow(
      /DEVICE_ID_PEPPER must be set/,
    );
  });

  it("falls back to the defaults when optional variables are blank", () => {
    const config = readConfig({ ...BASE, PUBLIC_BASE_URL: "", STORAGE_DRIVER: "", UPLOAD_DIR: "" });
    expect(config.publicBaseUrl).toBe("http://localhost:3000");
    expect(config.storage).toEqual({ driver: "local", uploadDir: "./storage/uploads" });
  });
});

describe("trusted proxy hops", () => {
  it("trusts exactly one proxy by default", () => {
    expect(readConfig(BASE).trustedProxyHops).toBe(1);
  });

  it("accepts from 1 to 5 trusted proxies", () => {
    expect(readConfig({ ...BASE, TRUSTED_PROXY_HOPS: "2" }).trustedProxyHops).toBe(2);
    for (const value of ["0", "6", "um"]) {
      expect(() => readConfig({ ...BASE, TRUSTED_PROXY_HOPS: value })).toThrow(/TRUSTED_PROXY_HOPS/);
    }
  });
});
