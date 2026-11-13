import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "./playwright.config";

const PORT = 3300;

/** Regenerates docs/telas/*.png from a disposable database with demo data: `npm run screens`. */
export default defineConfig({
  testDir: "tests/screens",
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx tsx scripts/e2e-prepare.ts && npx tsx scripts/seed.ts && npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `http://localhost:${PORT}/api/saude`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "pglite:./storage/e2e-screens",
      E2E_ADMIN_PASSWORD,
      DEVICE_ID_PEPPER: "screens-only-pepper-not-a-secret-0123456789",
      PUBLIC_BASE_URL: `http://localhost:${PORT}`,
      UPLOAD_DIR: "./storage/e2e-screens-uploads",
    },
  },
});
