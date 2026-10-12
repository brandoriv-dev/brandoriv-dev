import { defineConfig } from "@playwright/test";

// File name kept for CI history; the MCP dashboard it once covered is retired.
const port = Number(process.env.BROWSER_TEST_PORT || 8791);

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: ["moss-catalog.spec.mjs"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  preserveOutput: "always",
  expect: { timeout: 10_000 },
  outputDir: "test-results/moss",
  reporter: [["line"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    colorScheme: "light",
    locale: "en-US",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bunx wrangler dev --local --port ${port}`,
    url: `http://127.0.0.1:${port}/moss/`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
