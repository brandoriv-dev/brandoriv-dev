import { defineConfig } from "@playwright/test";

const port = Number(process.env.MCP_TEST_PORT || 8791);

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: ["dashboard-designs.spec.mjs", "moss-catalog.spec.mjs"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  preserveOutput: "always",
  expect: { timeout: 10_000 },
  outputDir: "test-results/mcp-designs",
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
    command: `bunx wrangler dev --local --port ${port} --var MCP_RETIRED:false --var MCP_BEARER_TOKEN:local-playwright-token`,
    url: `http://127.0.0.1:${port}/mcp/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
