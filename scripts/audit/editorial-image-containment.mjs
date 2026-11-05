// Built-browser regression for the Liv portrait-art defect found in visual QA.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer } from "./_lib.mjs";

const server = await startStaticServer({ distDir: process.argv[2] ?? "dist" });
const browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
try {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, reducedMotion: "reduce" });
    await context.route("**/*", (route) => route.request().url().startsWith(server.baseUrl + "/") ? route.continue() : route.abort());
    const page = await context.newPage();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [route, panel] of [
        ["/news/uae-card-change-log-liv-eligibility-vat-correction/", ".dp-prose .dp-card-art"],
        ["/news/", '[data-news-issuer-art="liv"]'],
        ["/news/banking/", '[data-news-issuer-art="liv"]'],
      ]) {
        assert.equal((await page.goto(server.baseUrl + route)).status(), 200);
        const box = page.locator(panel).first();
        await box.scrollIntoViewIfNeeded();
        const image = box.locator("img");
        await image.evaluate((img) => img.decode());
        const result = await box.evaluate((element) => {
          const img = element.querySelector("img");
          const outer = element.getBoundingClientRect(), inner = img.getBoundingClientRect();
          const css = getComputedStyle(element);
          return { fit: getComputedStyle(img).objectFit, width: inner.width, height: inner.height,
            availableWidth: outer.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
            availableHeight: outer.height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom),
            visible: img.naturalWidth > 0 && inner.width > 0 && inner.height > 0,
            overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert.equal(result.fit, "contain", JSON.stringify({ route, width, ...result }));
        assert.equal(result.visible, true);
        assert.equal(result.overflow, false);
        assert.ok(result.width <= result.availableWidth + 1 && result.height <= result.availableHeight + 1, JSON.stringify({ route, width, ...result }));
        if (!route.includes("eligibility-vat")) assert.match(await box.innerText(), /Card image: Liv/);
      }
    }
    await context.close();
  }
  console.log("Liv article and two news feeds: complete contained issuer art, visible credit and no overflow at four widths in both themes");
} finally { await browser.close(); server.close(); }
