import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
/** Throwaway credential for the disposable E2E database only. */
export const E2E_ADMIN_PASSWORD = "e2e-only-temporary-password";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx tsx scripts/e2e-prepare.ts && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/saude`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "pglite:./storage/e2e-db",
      E2E_ADMIN_PASSWORD,
      DEVICE_ID_PEPPER: "e2e-only-pepper-not-a-secret-0123456789abcdef",
      PUBLIC_BASE_URL: `http://localhost:${PORT}`,
      UPLOAD_DIR: "./storage/e2e-uploads",
    },
  },
});
