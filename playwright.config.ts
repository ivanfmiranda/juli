import { defineConfig, devices } from "@playwright/test";

const STANDALONE_PORT = Number(process.env.PORT || process.env.JULI_E2E_PORT || 4200);
const explicitBaseUrl = process.env.JULI_E2E_BASE_URL?.trim();
const defaultServerMode = explicitBaseUrl ? "external" : process.env.CI ? "standalone" : "proxy";
const serverMode = (process.env.JULI_E2E_SERVER_MODE || defaultServerMode).toLowerCase();
const baseURL =
  explicitBaseUrl || (serverMode === "standalone" ? `http://localhost:${STANDALONE_PORT}` : "http://localhost");
const useStandaloneServer = serverMode === "standalone";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL,
    ignoreHTTPSErrors: baseURL.startsWith("https://"),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useStandaloneServer
    ? {
        command: `PORT=${STANDALONE_PORT} node server.js`,
        port: STANDALONE_PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
});
