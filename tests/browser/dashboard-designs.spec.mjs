import { expect, test } from "@playwright/test";

const views = ["overview", "policies", "connect"];

async function signIn(page) {
  await page.goto("/mcp#overview");
  await page.locator("#token-fallback").evaluate((details) => { details.open = true; });
  await page.locator("#token-input").fill("local-playwright-token");
  await page.locator("#sign-in-button").click();
  await expect(page.locator("body")).toHaveAttribute("data-authenticated", "true");
  await expect(page.locator("html")).toHaveAttribute("data-concept", "c");
}

test.describe("MCP Control Room dashboard", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`${viewport.name}: every view stays usable`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await signIn(page);

      if (viewport.name === "desktop") {
        const centers = await page.evaluate(() => {
          const center = (selector) => {
            const box = document.querySelector(selector)?.getBoundingClientRect();
            return box ? box.left + box.width / 2 : NaN;
          };
          return [center(".brand img"), center(".rail-toggle"), ...[...document.querySelectorAll(".nav-item moss-icon")].map((icon) => {
            const box = icon.getBoundingClientRect();
            return box.left + box.width / 2;
          })];
        });
        expect(Math.max(...centers) - Math.min(...centers), `rail centers: ${centers.join(", ")}`).toBeLessThanOrEqual(1.5);

        const collapsedTransform = await page.locator(".rail-arrow").evaluate((arrow) => getComputedStyle(arrow).transform);
        await page.locator(".rail-toggle").click();
        await expect(page.locator("#sidebar")).not.toHaveAttribute("collapsed", "");
        await expect(page.locator(".rail-toggle")).toHaveAttribute("aria-expanded", "true");
        await expect.poll(() => page.locator(".rail-arrow").evaluate((arrow) => getComputedStyle(arrow).transform)).not.toBe(collapsedTransform);
        await page.screenshot({ path: testInfo.outputPath("desktop-rail-expanded.png"), fullPage: false });
        await page.locator(".rail-toggle").click();
      }

      for (const view of views) {
        await page.locator(`[data-view-target="${view}"]`).click();
        const panel = page.locator(`[data-view="${view}"]`);
        await expect(panel).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`#${view}$`));
        await expect(page.locator(`[data-view-target="${view}"]`)).toHaveAttribute("aria-current", "page");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

        if (view === "policies" && viewport.name === "desktop") {
          const workflowDisclosure = page.locator('[data-category-id="workflows"]').locator("xpath=..").locator(".category-disclosure");
          if (await workflowDisclosure.getAttribute("aria-expanded") !== "true") await workflowDisclosure.click();
          const nestedRow = page.locator('[data-parent-category-id="workflows"] > .category-row.is-nested').first();
          await expect(nestedRow).toBeVisible();
          expect(await nestedRow.evaluate((row) => getComputedStyle(row, "::before").borderLeftWidth)).toBe("1px");
          await expect(page.locator(".category-button > i")).toHaveCount(0);
        }

        await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${view}.png`), fullPage: false });
      }

      await context.close();
    });
  }

  test("sign-in and dark mode preserve the selected direction", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/mcp");
    await expect(page.locator("#auth-gate")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("signin.png"), fullPage: false });
    await signIn(page);
    await page.locator("#topbar-more-button").click();
    await page.locator(".topbar-more-panel [data-theme-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("#topbar-more-button").click();
    await page.screenshot({ path: testInfo.outputPath("desktop-dark-overview.png"), fullPage: false });
    await context.close();
  });
});
