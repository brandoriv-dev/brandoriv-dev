import { expect, test } from "@playwright/test";

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
  test(`Moss ${viewport.name}: authenticated tabs, charts, and fonts`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/mcp/");
    await page.locator("#token-fallback").evaluate((details) => { details.open = true; });
    await page.locator("#token-input").fill("local-playwright-token");
    await page.locator("#sign-in-button").click();
    await expect(page.locator("body")).toHaveAttribute("data-authenticated", "true");
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (new URL(response.url()).pathname.startsWith("/moss/") && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto("/moss/?page=navigation#pagination");
    const tabs = page.getByRole("tablist", { name: "Pagination documentation" });
    await expect(tabs.getByRole("tab")).toHaveCount(4);
    await expect(tabs.getByRole("tab", { name: "Example", exact: true })).toHaveAttribute("aria-selected", "true");
    for (const name of ["Implementation", "States", "Responsibilities", "Example"]) {
      await tabs.getByRole("tab", { name, exact: true }).click();
      await expect(tabs.getByRole("tab", { name, exact: true })).toHaveAttribute("aria-selected", "true");
    }
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-moss-tabs.png`), fullPage: false });
    await page.goto("/moss/charts.html");
    await expect(page.locator("[data-chart-example]")).toHaveCount(70);
    const chart = page.locator("moss-chart").first();
    await expect(chart).toHaveAttribute("data-chart-state", "ready");
    await expect(chart.locator(".moss-chart-runtime__viewport svg")).toBeVisible();
    expect(await chart.locator(".moss-chart-runtime__viewport svg path").count()).toBeGreaterThan(3);
    const font = await page.evaluate(async () => {
      const response = await fetch("/moss/src/vendor/geist/files/geist-latin-wght-normal.woff2");
      return { status: response.status, bytes: (await response.arrayBuffer()).byteLength };
    });
    expect(font.status).toBe(200);
    expect(font.bytes).toBeGreaterThan(1000);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-moss-charts.png`), fullPage: false });
    expect(errors).toEqual([]);
  });
}

test("Moss assets stay publicly readable", async ({ request }) => {
  for (const path of ["/moss/", "/moss/vendor.json", "/moss/src/vendor/echarts.esm.min.js", "/moss/src/vendor/geist/index.css"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
  }
});

test("Moss bare route loads relative catalog assets from the Moss base", async ({ page }) => {
  const failed = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if ((url.pathname === "/app.js" || url.pathname.startsWith("/moss/")) && response.status() >= 400) {
      failed.push(`${response.status()} ${url.pathname}`);
    }
  });
  await page.goto("/moss?page=structure#main");
  await expect(page).toHaveURL(/\/moss\/?\?page=structure#main$/);
  await expect(page.locator("#catalog-page")).toHaveValue("structure");
  await expect(page.getByRole("heading", { name: "Application structure", level: 1 })).toBeVisible();
  expect(await page.locator("script[src='/app.js'], script[src='https://brandoriv.dev/app.js']").count()).toBe(0);
  expect(failed).toEqual([]);
});
