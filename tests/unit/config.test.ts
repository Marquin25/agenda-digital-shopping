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

describe("public base URL on Vercel previews", () => {
  const PREVIEW = { ...BASE, VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "conecta-git-feat-x-team.vercel.app" };

  it("uses the branch URL of a preview when PUBLIC_BASE_URL is not set, so links and QR codes never point to localhost", () => {
    expect(readConfig(PREVIEW).publicBaseUrl).toBe("https://conecta-git-feat-x-team.vercel.app");
    expect(readConfig({ ...PREVIEW, PUBLIC_BASE_URL: "" }).publicBaseUrl).toBe(
      "https://conecta-git-feat-x-team.vercel.app",
    );
  });

  it("keeps an explicit PUBLIC_BASE_URL", () => {
    expect(readConfig({ ...PREVIEW, PUBLIC_BASE_URL: "https://preview.example.com/" }).publicBaseUrl).toBe(
      "https://preview.example.com",
    );
  });

  it("never applies the fallback outside previews", () => {
    expect(readConfig({ ...BASE, VERCEL_BRANCH_URL: "x.vercel.app" }).publicBaseUrl).toBe(
      "http://localhost:3000",
    );
    expect(
      readConfig({ ...BASE, VERCEL_ENV: "production", VERCEL_BRANCH_URL: "x.vercel.app" }).publicBaseUrl,
    ).toBe("http://localhost:3000");
  });

  it("ignores a branch URL that is not a plain host name", () => {
    expect(readConfig({ ...PREVIEW, VERCEL_BRANCH_URL: "evil.example/path?x" }).publicBaseUrl).toBe(
      "http://localhost:3000",
    );
  });
});
