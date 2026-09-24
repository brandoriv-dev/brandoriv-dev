import { expect, test } from "@playwright/test";

const views = ["overview", "policies", "guidelines", "resources", "connect"];

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
        const collapsedWorkspace = await page.locator(".workspace").boundingBox();
        await page.locator(".rail-toggle").click();
        await expect(page.locator("#sidebar")).not.toHaveAttribute("collapsed", "");
        await expect(page.locator(".rail-toggle")).toHaveAttribute("aria-expanded", "true");
        await expect.poll(() => page.locator(".rail-arrow").evaluate((arrow) => getComputedStyle(arrow).transform)).not.toBe(collapsedTransform);
        await expect.poll(async () => (await page.locator(".workspace").boundingBox())?.x).toBeGreaterThan((collapsedWorkspace?.x ?? 0) + 100);
        await page.screenshot({ path: testInfo.outputPath("desktop-rail-expanded.png"), fullPage: false });
        await page.locator(".rail-toggle").click();
        await expect.poll(async () => (await page.locator(".workspace").boundingBox())?.x).toBeCloseTo(collapsedWorkspace?.x ?? 0, 0);
      }

      for (const view of views) {
        await page.locator(`[data-view-target="${view}"]`).click();
        const panel = page.locator(`[data-view="${view}"]`);
        await expect(panel).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`#${view}$`));
        await expect(page.locator(`[data-view-target="${view}"]`)).toHaveAttribute("aria-current", "page");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

        if (view === "policies" && viewport.name === "desktop") {
          const disclosures = page.locator(".category-disclosure:not([hidden])");
          expect(await disclosures.count()).toBeGreaterThan(2);
          for (let index = 0; index < await disclosures.count(); index += 1) await expect(disclosures.nth(index)).toHaveAttribute("aria-expanded", "true");
          const nestedNode = page.locator('[data-parent-category-id="workflows"] > .category-node').first();
          await expect(nestedNode).toBeVisible();
          expect(await nestedNode.evaluate((node) => getComputedStyle(node, "::before").borderLeftWidth)).toBe("1px");
          expect(await nestedNode.evaluate((node) => getComputedStyle(node, "::after").borderTopWidth)).toBe("1px");
          await expect(page.locator(".category-button > i")).toHaveCount(0);
          const browserBox = await page.locator(".policy-browser").boundingBox();
          expect((browserBox?.y ?? 0) + (browserBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);
          const treeScroll = await page.locator("#category-nav").evaluate((tree) => ({ client: tree.clientHeight, scroll: tree.scrollHeight }));
          expect(treeScroll.scroll).toBeGreaterThan(treeScroll.client);
          await expect(page.locator("#policy-title")).not.toHaveText("Always on");
        }

        if (view === "overview") {
          await expect(page.locator(".trend-item")).toHaveCount(4);
          await expect(page.getByText("Visible answer output", { exact: true })).toHaveCount(0);
          const evidenceCells = page.locator(".evidence-grid > div");
          await expect(evidenceCells).toHaveCount(4);
          const widths = await evidenceCells.evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().width));
          expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
          const disclosure = page.locator(".evidence-disclosure");
          await expect(disclosure.locator("[data-panel]")).toBeHidden();
          await disclosure.locator("button").click();
          await expect(disclosure.locator("[data-panel]")).toBeVisible();
          await disclosure.locator("button").click();
        }

        if (view === "connect") {
          await expect(page.locator(".client-tab")).toHaveCount(10);
          await expect(page.locator(".client-tab").first()).toContainText("Codex");
          await expect(page.locator(".client-tab.is-recommended")).toHaveCount(3);
        }

        await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${view}.png`), fullPage: false });
      }

      await context.close();
    });
  }

  test("canonical brand and compact live status are visible", async ({ page }) => {
    await signIn(page);
    await expect(page.locator(".topbar-service")).toContainText("Operational");
    await expect(page.locator("body")).not.toContainText("Bullfrog");
  });

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
