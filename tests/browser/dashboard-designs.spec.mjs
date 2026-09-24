import { expect, test } from "@playwright/test";

const concepts = [
  { id: "a", name: "Command Deck" },
  { id: "b", name: "Field Guide" },
  { id: "c", name: "Control Room" },
];
const views = ["overview", "policies", "connect"];

test.describe("MCP dashboard design directions", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`${viewport.name}: every direction keeps every view usable`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();

      await page.goto("/mcp?concept=a#overview");
      await page.locator("#token-fallback").evaluate((details) => { details.open = true; });
      await page.locator("#token-input").fill("local-playwright-token");
      await page.locator("#sign-in-button").click();
      await expect(page.locator("body")).toHaveAttribute("data-authenticated", "true");

      if (viewport.name === "mobile") {
        await page.locator("#topbar-more-button").click();
        await expect(page.locator(".concept-picker-mobile")).toBeVisible();
        await page.locator(".concept-picker-mobile [data-concept-choice=\"b\"]").click();
        await expect(page.locator("html")).toHaveAttribute("data-concept", "b");
      }

      for (const concept of concepts) {
        await page.goto(`/mcp?concept=${concept.id}#overview`);
        await expect(page.locator("html")).toHaveAttribute("data-concept", concept.id);
        await expect(page.locator("[data-concept-name]")).toHaveText(concept.name);

        for (const view of views) {
          await page.locator(`[data-view-target="${view}"]`).click();
          const panel = page.locator(`[data-view="${view}"]`);
          await expect(panel).toBeVisible();
          await expect(page).toHaveURL(new RegExp(`concept=${concept.id}#${view}$`));
          await expect(page.locator(`[data-view-target="${view}"]`)).toHaveAttribute("aria-current", "page");
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
          await page.screenshot({
            path: testInfo.outputPath(`${viewport.name}-${concept.id}-${view}.png`),
            fullPage: false,
          });
        }
      }

      await context.close();
    });
  }

  test("sign-in can preview all three directions without authenticating", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    for (const concept of concepts) {
      await page.goto(`/mcp?concept=${concept.id}`);
      await expect(page.locator("#auth-gate")).toBeVisible();
      await expect(page.locator(`.auth-concept-picker [data-concept-choice="${concept.id}"]`)).toHaveAttribute("aria-pressed", "true");
      await page.screenshot({ path: testInfo.outputPath(`signin-${concept.id}.png`), fullPage: false });
    }
  });
});
