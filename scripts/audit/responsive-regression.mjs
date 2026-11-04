// Opt-in smoke test for the built site. Use DP_CHROME_PATH when Playwright's
// bundled Chromium is not installed. No requests are made off the local origin.
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { deriveRoutes, startStaticServer } from "./_lib.mjs";

const dist = path.resolve(process.argv[2] ?? "dist");
const widths = [320, 390, 721, 768, 1024, 1440, 1920];
const entries = await readdir(dist, { withFileTypes: true, recursive: true });
const routes = deriveRoutes(entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => path.relative(dist, path.join(entry.parentPath, entry.name))));
assert.ok(routes.length > 100, "Expected the complete production build");
const server = await startStaticServer({ distDir: dist });
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 320, height: 880 }, reducedMotion: "reduce" });
  await context.route("**/*", (route) => route.request().url().startsWith(server.baseUrl + "/")
    ? route.continue() : route.abort());
  const pending = [...routes];
  const failures = [];
  const navigate = async (page, route) => {
    const response = await page.goto(server.baseUrl + route, { waitUntil: "load" });
    assert.equal(response?.status(), 200, route);
    await page.evaluate(() => document.fonts.ready.then(() => null));
  };
  await Promise.all(Array.from({ length: 5 }, async () => {
    const page = await context.newPage();
    try {
      for (let route; (route = pending.shift()) !== undefined;) {
        await page.setViewportSize({ width: widths[0], height: 880 });
        try {
          await navigate(page, route);
          for (const width of widths) {
            await page.setViewportSize({ width, height: 880 });
            const dimensions = await page.evaluate(() => ({
              width: document.documentElement.clientWidth,
              scroll: document.documentElement.scrollWidth,
            }));
            if (dimensions.scroll > dimensions.width + 1) failures.push({ route, width, ...dimensions });
          }
        } catch (error) {
          failures.push({ route, error: error.message });
        }
      }
    } finally {
      await page.close();
    }
  }));
  assert.deepEqual(failures.sort((a, b) => a.route.localeCompare(b.route)), [], "Page-level horizontal overflow or failed load");
  console.log(`Reflow: ${routes.length} built routes × ${widths.length} widths; no page-level overflow`);

  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 880 });
  await navigate(page, "/guides/uae-credit-card-eligibility-2026/");
  const cards = page.locator(".dp-header-nav summary").filter({ hasText: "Cards" });
  const cardsMenu = page.getByRole("region", { name: "Cards menu" });
  await cards.click();
  await cardsMenu.waitFor({ state: "visible" });
  await cardsMenu.getByRole("link", { name: /Card finder/ }).hover();
  assert.equal(await cardsMenu.isVisible(), true, "Desktop menu stays open over its links");
  await cardsMenu.getByRole("link", { name: /Card finder/ }).focus();
  await page.keyboard.press("Escape");
  assert.equal(await cardsMenu.isVisible(), false);
  assert.equal(await cards.evaluate((element) => document.activeElement === element), true);
  await cards.press("Space");
  await cardsMenu.waitFor({ state: "visible" });
  await page.mouse.click(2, 10);
  assert.equal(await cardsMenu.isVisible(), false);

  await page.setViewportSize({ width: 390, height: 880 });
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.press("Enter");
  const close = page.getByRole("button", { name: "Close menu" });
  await close.waitFor({ state: "visible" });
  assert.equal(await close.evaluate((element) => document.activeElement === element), true);
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await close.isVisible(), false);
  assert.equal(await menu.evaluate((element) => document.activeElement === element), true);
  const guideProse = page.locator(".dp-article-body .dp-prose");
  assert.match(await guideProse.innerText(), /starting point, not approval/);
  assert.doesNotMatch(await guideProse.innerText(), /usually mechanical|30–50 points/);
  assert.equal(await guideProse.getByRole("link", { name: /Shortlist cards by salary/ }).getAttribute("href"), "/cards/finder/");

  await page.setViewportSize({ width: 1440, height: 880 });
  const rail = await page.evaluate(() => ({
    heading: document.querySelector("main h1").getBoundingClientRect().left,
    prose: document.querySelector(".dp-article-body .dp-prose").getBoundingClientRect().left,
  }));
  assert.ok(Math.abs(rail.heading - rail.prose) < 2, JSON.stringify(rail));

  await page.setViewportSize({ width: 721, height: 880 });
  await navigate(page, "/guides/best-lounge-access-cards-uae-2026/");
  const tableRegion = page.getByRole("region", { name: "Data table", exact: true }).first();
  assert.equal(await tableRegion.getAttribute("tabindex"), "0");
  assert.ok(await tableRegion.getByRole("table").isVisible());
  await page.getByText("Check the issuer documents for these cards", { exact: true }).click();
  assert.ok(await page.locator(".dp-guide-issuer-sources").getByRole("link", { name: "issuer source", exact: true }).first().isVisible());

  for (const [slug, fee] of [["citi-cashback", "315"], ["adib-cashback-visa", "103.95"]]) {
    await navigate(page, "/cards/" + slug + "/");
    const glance = await page.locator(".dp-at-a-glance").innerText();
    const feeBlock = await page.locator(".dp-fee-block").first().innerText();
    for (const text of [glance, feeBlock]) {
      assert.ok(text.includes(fee), slug + " includes its verified gross fee");
      assert.match(text, /incl\. VAT/i);
    }
    assert.doesNotMatch(glance, /\+ 5% VAT/i);
    assert.equal(await page.locator(".dp-fee-block .vat").first().innerText(), "incl. VAT");
    if (slug === "citi-cashback") {
      assert.equal(await page.getByRole("link", { name: /Check the current Citi Cash Back terms/ }).getAttribute("href"),
        "https://www.citibank.ae/credit-cards/cashback/citi-cashback-credit-card");
      assert.match(await page.locator("main").innerText(), /not through a partner/);
    }
  }

  await page.setViewportSize({ width: 768, height: 880 });
  await navigate(page, "/salary-transfer/");
  await page.getByRole("button", { name: /^AED 8k/ }).click();
  const hsbc = page.locator(".dpst-cards").getByRole("link", { name: "HSBC", exact: true });
  await hsbc.waitFor({ state: "visible" });
  assert.match(await hsbc.locator("xpath=ancestor::div[contains(@class,'dpst-card ') or @class='dpst-card']").innerText(), /12,500/,
    "The AED 8k–15k band includes the HSBC offer starting part-way through that band");
  const ei = page.locator(".dpst-card").filter({
    has: page.getByRole("link", { name: "Emirates Islamic", exact: true }),
  });
  assert.match(await ei.locator(".dpst-card-val").innerText(), /800\s+Includes optional card reward/);
  await page.getByRole("button", { name: "No credit card required" }).click();
  assert.match(await ei.locator(".dpst-card-val").innerText(), /400\s+Account reward only/);
  await navigate(page, "/salary-transfer/aed-8000-to-15000/");
  await hsbc.waitFor({ state: "visible" });
  const dib = page.locator(".dpst-card").filter({ has: page.getByRole("link", { name: "Dubai Islamic Bank", exact: true }) });
  await dib.getByRole("button", { name: /Fine print/ }).click();
  const art = dib.locator(".dpst-card-example img");
  await art.waitFor({ state: "visible" });
  await art.evaluate((image) => image.decode());

  await page.setViewportSize({ width: 390, height: 880 });
  await navigate(page, "/salary-transfer/calculator/");
  await page.locator("astro-island[ssr]:has(.dpsc)").waitFor({ state: "detached" });
  const eiCalc = page.locator('[data-flip="emirates-islamic-2026-oct-2027-mar"]');
  const dibCalc = page.locator('[data-flip="dib-xtra-2026"]');
  assert.match(await eiCalc.innerText(), /1,000 cash-equivalent/);
  assert.doesNotMatch(await eiCalc.innerText(), /AED 1,500|AED 500/);
  assert.match(await dibCalc.innerText(), /Does not match your inputs/i);
  await page.getByRole("checkbox", { name: "Auto finance", exact: true }).check();
  assert.match(await dibCalc.innerText(), /Requires confirmation/i);
  assert.doesNotMatch(await dibCalc.innerText(), /cash-equivalent/);

  await navigate(page, "/cards/finder/?salary=20000&prefer=miles&spend=travel");
  const reward = page.getByRole("combobox", { name: "Reward preference" });
  assert.equal(await reward.inputValue(), "miles");
  assert.equal(await page.locator("#finder-more").getAttribute("open"), "");
  assert.ok(await reward.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight));
  await page.getByRole("combobox", { name: "Invitation-only cards" }).selectOption("false");
  await page.getByRole("button", { name: "Apply all filters" }).click();
  await page.waitForURL((url) => url.searchParams.get("include_invite_only") === "false");
  assert.equal(await page.getByRole("combobox", { name: "Invitation-only cards" }).inputValue(), "false");
  assert.match(await page.locator("#finder-count").innerText(), /^Showing \d+ of \d+ cards? that meets? your filters$/);
  const tiles = page.locator("#finder-grid > .dp-finder-tile:not([hidden])");
  const tileOrder = await tiles.evaluateAll((items) => items.map((item) => item.dataset.slug));
  const compareHref = await page.locator("#finder-compare").getAttribute("href");
  const comparePicks = new URL(compareHref, server.baseUrl).searchParams.get("cards").split(",");
  assert.deepEqual(comparePicks, tileOrder.slice(0, 3));
  await tiles.nth(0).getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  assert.equal(await tiles.nth(1).getByRole("link").first().evaluate((link) => document.activeElement === link), true);
  const filters = page.locator("#finder-filters");
  await filters.locator(":scope > summary").click();
  assert.equal(await filters.getAttribute("open"), null);
  await page.setViewportSize({ width: 1024, height: 880 });
  await page.waitForFunction(() => document.getElementById("finder-filters").open);

  await page.setViewportSize({ width: 320, height: 880 });
  await navigate(page, "/cards/compare/?cards=cbd-one,wio-credit,sc-platinum-x");
  assert.equal(await page.evaluate(() => Boolean(document.querySelector("#dp-compare-grid").compareDocumentPosition(document.querySelector("#dp-compare-matchups")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  await page.getByText("Pick cards to compare", { exact: true }).click();
  assert.ok(await page.getByRole("button", { name: "Update comparison" }).isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);

  await page.setViewportSize({ width: 390, height: 880 });
  await navigate(page, "/deals/");
  const dealTitles = page.locator("[data-deal]:not([data-deal-soon-item]):not([hidden]) h2");
  if (await dealTitles.count()) {
    assert.ok(await dealTitles.first().evaluate((el) => el.getBoundingClientRect().top < innerHeight));
    const travel = page.locator("[data-filter-sector]");
    if (await travel.locator('option[value="travel"]').count()) {
      await travel.selectOption("travel");
      const matchingSectors = await page.locator("[data-deal]:not([hidden])").evaluateAll((els) =>
        els.map((el) => el.dataset.sector));
      assert.ok(matchingSectors.length > 0);
      assert.ok(matchingSectors.every((sector) => sector === "travel"));
    }
  }
  assert.equal(await page.getByRole("searchbox", { name: "Search the site" }).count(), 1);
  await navigate(page, "/deals/dib-air-arabia-20pct-ultimate/");
  assert.equal(await page.locator("[data-deal-source]").getAttribute("href"),
    "https://www.dib.ae/offers/offer-detail/air-arabia");
  assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-deal-terms]").compareDocumentPosition(document.querySelector("[data-deal-artwork]")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  if (await page.locator("[data-copy-code]").count()) {
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-copy-code]").compareDocumentPosition(document.querySelector("[data-deal-artwork]")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  }
  console.log("Interactions: menus, guide, card fees, article sources, tracker, calculator, Finder, comparison, Deals");
} finally {
  await browser?.close();
  server.close();
}
