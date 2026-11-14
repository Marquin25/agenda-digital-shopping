import { defineConfig, devices } from "@playwright/test";

/** Throwaway credential for the disposable E2E database only. */
export const E2E_ADMIN_PASSWORD = "e2e-only-temporary-password";
export const E2E_CRON_SECRET = "e2e-only-cron-secret-not-a-real-secret";

/**
 * The suite is serial and stateful (first sign-in forces a password change, event names are unique),
 * so every browser project gets its own server, port, database and uploads, all prepared from scratch.
 */
const targets = [
  { name: "mobile-chromium", device: devices["Pixel 7"], port: 3200 },
  { name: "mobile-webkit", device: devices["iPhone 15"], port: 3201 },
] as const;

const baseUrl = (port: number) => `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  use: { trace: "retain-on-failure" },
  projects: targets.map(({ name, device, port }) => ({
    name,
    use: { ...device, baseURL: baseUrl(port) },
  })),
  webServer: targets.map(({ name, port }) => ({
    command: `npx tsx scripts/e2e-prepare.ts && npx next start -H 127.0.0.1 -p ${port}`,
    url: `${baseUrl(port)}/api/saude`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: `pglite:./storage/e2e-db-${name}`,
      E2E_ADMIN_PASSWORD,
      CRON_SECRET: E2E_CRON_SECRET,
      DEVICE_ID_PEPPER: "e2e-only-pepper-not-a-secret-0123456789abcdef",
      PUBLIC_BASE_URL: baseUrl(port),
      // WebKit drops `Secure` cookies on http://localhost; this opt-in only works for loopback URLs.
      ALLOW_INSECURE_LOCALHOST_COOKIES: "true",
      UPLOAD_DIR: `./storage/e2e-uploads-${name}`,
    },
  })),
});
