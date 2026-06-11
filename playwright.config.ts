import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Next.js dev compiles routes on-demand and serializes badly with parallel
  // workers — keep workers=1 in dev. For prod-build E2E, we can crank up.
  workers: 1,
  timeout: 30_000,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "mock",
      testDir: "./e2e",
      testIgnore: ["**/*.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real",
      testDir: "./e2e-real",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.E2E_REAL_BASE_URL ?? BASE_URL,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
