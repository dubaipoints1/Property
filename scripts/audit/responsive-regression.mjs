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
const files = new Set(entries.filter((entry) => entry.isFile())
  .map((entry) => path.relative(dist, path.join(entry.parentPath, entry.name))));
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
          const images = await page.locator("img[src]").evaluateAll((nodes) => [...new Set(nodes
            .map((node) => new URL(node.src))
            .filter((url) => url.origin === location.origin)
            .map((url) => decodeURIComponent(url.pathname.slice(1))))]);
          for (const image of images) {
            if (!files.has(image)) failures.push({ route, image, error: "missing local image file" });
          }
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
  assert.deepEqual(failures.sort((a, b) => a.route.localeCompare(b.route)), [], "Page-level horizontal overflow, failed load or missing local image");
  console.log(`Reflow: ${routes.length} built routes × ${widths.length} widths; no page-level overflow or missing local image src`);

  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 880 });
  await navigate(page, "/guides/uae-credit-card-eligibility-2026/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  assert.ok(await skip.evaluate((element) => element === document.activeElement));
  assert.ok((await skip.boundingBox()).y >= 0);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
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
  await menu.waitFor({ state: "visible" });
  await menu.press("Enter");
  const close = page.getByRole("button", { name: "Close menu" });
  await close.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Close menu");
  assert.equal(await close.evaluate((element) => document.activeElement === element), true);
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await close.isVisible(), false);
  assert.equal(await menu.evaluate((element) => document.activeElement === element), true);
  for (const quickLink of await page.getByRole("navigation", { name: "Quick links" }).getByRole("link").all()) {
    assert.ok((await quickLink.boundingBox()).height >= 44);
  }
  const guideProse = page.locator(".dp-article-body .dp-prose");
  assert.match(await guideProse.innerText(), /starting point, not approval/);
  assert.doesNotMatch(await guideProse.innerText(), /usually mechanical|30–50 points/);
  assert.equal(await guideProse.getByRole("link", { name: /Shortlist cards by salary/ }).getAttribute("href"), "/cards/finder/");
  await navigate(page, "/guides/uae-transfer-ratios-2026/");
  const guideIntro = page.locator(".dp-article-body .dp-prose p").first();
  assert.ok(await guideIntro.evaluate((el) => el.getBoundingClientRect().top < 844));
  assert.match(await page.locator("[data-reading-media] .dp-ai-label").innerText(), /not a photograph/i);

  await page.setViewportSize({ width: 1440, height: 880 });
  const rail = await page.evaluate(() => ({
    heading: document.querySelector("main h1").getBoundingClientRect().left,
    prose: document.querySelector(".dp-article-body .dp-prose").getBoundingClientRect().left,
  }));
  assert.ok(Math.abs(rail.heading - rail.prose) < 2, JSON.stringify(rail));
  await navigate(page, "/guides/");
  assert.equal(await page.locator('main img[data-stock-slug="guide-uae-transfer-ratios-2026"]').count(), 0);
  assert.equal(await page.locator("main").getByText("Trending now", { exact: true }).count(), 0);

  await page.setViewportSize({ width: 721, height: 880 });
  await navigate(page, "/guides/best-lounge-access-cards-uae-2026/");
  const tableRegion = page.getByRole("region", { name: /^Data table/ }).first();
  assert.equal(await tableRegion.getAttribute("tabindex"), "0");
  assert.ok(await tableRegion.getByRole("table").isVisible());
  await page.getByText("Check the issuer documents for these cards", { exact: true }).click();
  assert.ok(await page.locator(".dp-guide-issuer-sources").getByRole("link", { name: "issuer source", exact: true }).first().isVisible());

  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 390, height: 880 });
    await navigate(page, "/airlines/skywards/");
    const skyTakeaways = page.locator(".dp-reading-takeaways");
    assert.equal(await skyTakeaways.locator("dt").count(), 3);
    assert.ok(await skyTakeaways.evaluate((el) => el.getBoundingClientRect().top < innerHeight));
    const jumpMenu = page.getByRole("navigation", { name: "Jump to section" });
    await jumpMenu.locator("summary").press("Space");
    await jumpMenu.getByRole("link", { name: "Expiry mechanics", exact: true }).press("Enter");
    assert.equal(new URL(page.url()).hash, "#mile-expiry-mechanics");
    await page.waitForFunction(() => {
      const heading = document.getElementById("mile-expiry-mechanics");
      const r = heading.getBoundingClientRect();
      return heading.contains(document.elementFromPoint(r.left + 12, r.top + r.height / 2));
    });
    await skyTakeaways.getByRole("link", { name: "Read the expiry rules" }).press("Enter");
    assert.equal(new URL(page.url()).hash, "#mile-expiry-mechanics");
    const summary = page.locator("#programme-expiry summary");
    await summary.press("Space");
    assert.equal(await page.locator("#programme-expiry").getAttribute("open"), "");
    assert.ok(await page.locator("#programme-expiry p").isVisible());
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 880 });
  for (const route of ["/airlines/skywards/", "/airlines/etihad-guest/", "/hotels/marriott-bonvoy/"]) {
    await navigate(page, route);
    const reference = page.getByRole("complementary", { name: "Programme quick reference" });
    assert.ok(await reference.isVisible());
    assert.equal(await reference.getByText(/Skywards Miles are valid/).count(), 0);
    for (const link of await reference.getByRole("link").all()) {
      const href = await link.getAttribute("href");
      if (href.startsWith("#")) assert.equal(await page.locator(href).count(), 1);
      else assert.ok(href.startsWith("/airlines/") || href.startsWith("/hotels/"));
    }
    assert.ok(await page.locator(".dp-prog-prose").evaluate((el) => getComputedStyle(el).fontSize !== "13px"));
    const tableLabels = await page.locator(".dp-prose-table-scroll").evaluateAll((regions) =>
      regions.map((region) => region.getAttribute("aria-label")));
    assert.equal(new Set(tableLabels).size, tableLabels.length);
  }

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
      const verdict = page.locator("[data-card-hero-verdict]");
      assert.ok(await verdict.evaluate((el) => el.getBoundingClientRect().bottom < innerHeight));
      assert.equal(await page.getByRole("link", { name: /Check the current Citi Cash Back terms/ }).getAttribute("href"),
        "https://www.citibank.ae/credit-cards/cashback/citi-cashback-credit-card");
      assert.match(await page.locator("main").innerText(), /not through a partner/);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, "/cards/citi-cashback/");
  assert.ok(await page.locator("[data-card-hero-verdict]").evaluate((el) => el.getBoundingClientRect().bottom < innerHeight));
  await navigate(page, "/banks/dib/");
  assert.match(await page.locator("#bank-salary-transfer").innerText(), /check deadline with the bank/i);

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
  await page.locator(".dpst-options > summary").click();
  await page.getByRole("button", { name: "No credit card required" }).click();
  assert.match(await ei.locator(".dpst-card-val").innerText(), /400\s+Account reward only/);
  await navigate(page, "/salary-transfer/aed-8000-to-15000/");
  await hsbc.waitFor({ state: "visible" });
  const dib = page.locator(".dpst-card").filter({ has: page.getByRole("link", { name: "Dubai Islamic Bank", exact: true }) });
  await dib.getByRole("button", { name: /Fine print/ }).click();
  const dibTimeline = dib.locator("[data-payday-timeline]");
  assert.equal(await dibTimeline.locator("ol li").count(), 4);
  assert.match(await dibTimeline.innerText(), /do not give a fixed end date/);
  assert.equal(await dibTimeline.getByRole("link", { name: /offer history/i }).getAttribute("href"), "/salary-transfer/history/dib/");
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
  await page.locator(".dpsc-options > summary").click();
  await page.getByRole("checkbox", { name: "Auto finance", exact: true }).check();
  assert.match(await dibCalc.innerText(), /Requires confirmation/i);
  assert.doesNotMatch(await dibCalc.innerText(), /cash-equivalent/);

  await navigate(page, "/cards/finder/");
  const defaultTile = page.locator("#finder-grid > .dp-finder-tile:not([hidden])").first();
  await defaultTile.waitFor({ state: "visible" });
  const firstMatchY = await defaultTile.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  assert.ok(firstMatchY < 844, `A default Finder result should start on the first phone screen; y=${firstMatchY}`);
  assert.equal(await page.locator("#finder-filters").getAttribute("open"), null);
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
  const whyMatch = tiles.first().locator(".dp-finder-match summary");
  await whyMatch.press("Enter");
  assert.ok(await tiles.first().locator("[data-finder-ranking]").isVisible());
  assert.match(await page.locator("#finder-mode").innerText(), /not.*approval decision/i);
  await whyMatch.press("Enter");
  await tiles.nth(0).getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  assert.equal(await tiles.nth(1).getByRole("link").first().evaluate((link) => document.activeElement === link), true);
  const filters = page.locator("#finder-filters");
  await filters.locator(":scope > summary").click();
  assert.equal(await filters.getAttribute("open"), null);
  await page.setViewportSize({ width: 1024, height: 880 });
  await page.waitForFunction(() => document.getElementById("finder-filters").open);

  await page.setViewportSize({ width: 320, height: 880 });
  const compareArtRequests = [];
  const collectCompareArt = (request) => {
    const asset = new URL(request.url()).pathname;
    if (request.resourceType() === "image" && asset.startsWith("/images/cards/")) {
      compareArtRequests.push(asset);
    }
  };
  page.on("request", collectCompareArt);
  await navigate(page, "/cards/compare/?cards=cbd-one,wio-credit,sc-platinum-x");
  const activeComparison = page.locator("#dp-compare-grid > .dp-compare-col:not([hidden])");
  assert.deepEqual(await activeComparison.evaluateAll((columns) => columns.map((col) => col.dataset.slug)),
    ["cbd-one", "wio-credit", "sc-platinum-x"]);
  const selectedArt = page.locator("#dp-compare-grid img[data-compare-card-art]");
  assert.deepEqual(await selectedArt.evaluateAll((images) => images.map((img) => img.dataset.compareCardArt)),
    ["cbd-one", "sc-platinum-x"], "Only selected cards with approved art render images");
  assert.match(await activeComparison.nth(1).getByRole("heading").innerText(), /Wio/i);
  const firstFee = activeComparison.first().locator(".dp-fee-block");
  assert.equal(await activeComparison.first().getByText("Annual fee", { exact: true }).count(), 1);
  for (const feePart of await firstFee.locator(".amt, .lbl").all()) {
    assert.ok(await feePart.evaluate((el) => el.getBoundingClientRect().bottom < innerHeight));
  }
  for (const art of await selectedArt.all()) {
    await art.scrollIntoViewIfNeeded();
    await art.evaluate((img) => img.decode());
    assert.equal(await art.getAttribute("alt"), "");
    assert.ok((await art.boundingBox()).width <= 56);
  }
  page.off("request", collectCompareArt);
  assert.deepEqual([...new Set(compareArtRequests.map((asset) => path.basename(asset)))].sort(),
    ["cbd-one.webp", "sc-platinum-x.webp"], "The picker does not fetch other cards' art");
  assert.equal(await page.evaluate(() => Boolean(document.querySelector("#dp-compare-grid").compareDocumentPosition(document.querySelector("#dp-compare-matchups")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  await page.getByText("Pick cards to compare", { exact: true }).click();
  assert.ok(await page.getByRole("button", { name: "Update comparison" }).isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
  await navigate(page, "/cards/compare/fab-cashback-vs-citi-cashback/");
  const pairArt = page.locator(".dp-card-comparison img[data-compare-card-art]");
  assert.deepEqual(await pairArt.evaluateAll((images) => images.map((img) => img.dataset.compareCardArt)),
    ["fab-cashback", "citi-cashback"]);
  for (const art of await pairArt.all()) {
    await art.scrollIntoViewIfNeeded();
    await art.evaluate((img) => img.decode());
    assert.ok((await art.boundingBox()).width <= 56);
  }

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
  await page.setViewportSize({ width: 1280, height: 844 });
  await navigate(page, "/deals/");
  if (await dealTitles.count()) {
    assert.ok(await dealTitles.first().evaluate((el) => el.getBoundingClientRect().bottom < innerHeight));
  }
  await page.setViewportSize({ width: 390, height: 880 });
  await navigate(page, "/deals/dib-air-arabia-20pct-ultimate/");
  assert.equal(await page.locator("[data-deal-source]").getAttribute("href"),
    "https://www.dib.ae/offers/offer-detail/air-arabia");
  assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-deal-terms]").compareDocumentPosition(document.querySelector("[data-deal-artwork]")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  if (await page.locator("[data-copy-code]").count()) {
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-copy-code]").compareDocumentPosition(document.querySelector("[data-deal-artwork]")) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  }
  await navigate(page, "/news/uae-card-change-log-citi-cash-back-application-route/");
  assert.ok(await page.locator("body.dp-system-typography").count());
  assert.equal(await page.locator('link[rel="preload"][as="font"], .article-hero-image').count(), 0);
  assert.ok(await page.getByRole("heading", { level: 1, name: /UAE Card Change Log/ }).isVisible());
  assert.ok(await page.getByRole("link", { name: "Citi Cash Back review", exact: true }).isVisible());
  await navigate(page, "/news/cash-or-miles-uae-flight-break-even/");
  assert.match(await page.locator("main").innerText(), /hypothetical/i);
  assert.equal(await page.locator('link[rel="preload"][as="font"], .article-hero-image').count(), 0);
  assert.equal(await page.locator('[data-travel-evidence="hypothetical"]').count(), 2);
  await navigate(page, "/news/cash-or-miles-etihad-abu-dhabi-muscat/");
  const fareEvidence = page.locator('[data-travel-evidence="priced-not-booked"]');
  assert.match(await fareEvidence.innerText(), /EY 696/);
  assert.match(await fareEvidence.innerText(), /AED 615/);
  assert.match(await fareEvidence.innerText(), /10,000 Etihad Guest Miles \+ AED 135/);
  assert.match(await page.locator("main").innerText(), /4\.80 fils per mile/);
  assert.equal(await page.locator('link[rel="preload"][as="font"], .article-hero-image').count(), 0);
  await navigate(page, "/news/flydubai-dubai-skopje-three-weekly-from-1-april-2027/");
  assert.match(await page.locator('[data-travel-evidence="issuer-announcement"]').innerText(), /Award fare\s+Not priced/);
  await navigate(page, "/news/uae-salary-switch-scorecard/");
  assert.equal(await page.locator('link[rel="preload"][as="font"], .article-hero-image, main [data-news-preview]').count(), 0);

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 880 });
    for (const [route, expected] of [
      ["/news/", ["cash-or-miles", "cash-or-miles-quote", "issuer-card", "salary-scorecard"]],
      ["/news/banking/", ["issuer-card", "salary-scorecard"]],
      ["/news/airlines/", ["cash-or-miles", "cash-or-miles-quote"]],
      ["/news/hotels/", []],
    ]) {
      await navigate(page, route);
      assert.equal(await page.locator("main").getByText("Trending now", { exact: true }).count(), 0);
      const latest = page.locator("[data-news-latest]");
      const datedStories = await latest.locator("time[datetime]").evaluateAll((nodes) => nodes.map((el) => el.dateTime));
      assert.deepEqual(datedStories, [...datedStories].sort().reverse(), route + " is chronological");
      const feature = page.locator("[data-news-feature]");
      if (route === "/news/banking/") assert.equal(await feature.count(), 0, "Banking photos remain inline");
      if (await feature.count()) {
        const featuredHref = await feature.getAttribute("href");
        const rowLinks = await latest.getByRole("link").evaluateAll((nodes) => nodes.map((el) => el.getAttribute("href")));
        assert.ok(!rowLinks.includes(featuredHref), route + " does not repeat the feature in its latest list");
      }
      assert.equal(await page.locator("main .intel-main svg.dp-cover").count(), 0, route);
      const previews = page.locator("main [data-news-preview]");
      const actual = await previews.evaluateAll((nodes) => nodes.map((node) => node.dataset.newsPreview));
      assert.deepEqual(actual.sort(), expected.sort(), route);
      for (const visual of await previews.all()) {
        assert.equal(await visual.getAttribute("aria-hidden"), "true");
        assert.ok((await visual.boundingBox()).height <= 110, route);
        for (const img of await visual.locator("img").all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate((element) => element.decode());
        }
      }
    }
  }
  await navigate(page, "/news/");
  const newsArchive = page.locator("[data-news-archive]");
  assert.equal(await newsArchive.getAttribute("open"), null);
  const archiveStory = newsArchive.getByRole("link").first();
  assert.equal(await archiveStory.isVisible(), false);
  await newsArchive.locator("summary").press("Space");
  assert.ok(await archiveStory.isVisible());
  await navigate(page, "/guides/paint-protection-film-dubai/");
  const stageCredit = page.locator("main [data-reading-media] .dp-ai-label");
  assert.equal(await stageCredit.count(), 1);
  assert.ok(await stageCredit.isVisible());
  assert.equal(await stageCredit.innerText(), "Image: Modcare");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 880 });
    await navigate(page, "/hotels/");
    const hotelPhotos = page.locator("main .dp-dir-tile img[data-stock-slug]");
    assert.equal(await hotelPhotos.count(), 5);
    for (const photo of await hotelPhotos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await photo.evaluate((element) => element.decode());
    }
    await navigate(page, "/hotels/accor-all/");
    const accorCredit = page.locator("main .dp-prog-photo-credit");
    assert.ok(await accorCredit.getByText("Novotel Barcelona City ·", { exact: true }).isVisible());
    assert.ok(await accorCredit.getByRole("link", { name: "Ghassan Hani", exact: true }).isVisible());
    const accorPhoto = page.locator("main .dp-prog-figure img[data-stock-slug]");
    assert.match(await accorPhoto.getAttribute("data-stock-slug"), /news-all-accor-triple-points/);
    await accorPhoto.scrollIntoViewIfNeeded();
    await accorPhoto.evaluate((image) => image.decode());
  }
  await page.setViewportSize({ width: 390, height: 880 });
  await navigate(page, "/calculator/cash-or-miles/");
  const calc = page.locator("[data-cash-or-miles]");
  await calc.getByRole("button", { name: "Compare fares", exact: true }).press("Enter");
  const cashFare = calc.locator("#dp-cm-cashFare");
  assert.equal(await cashFare.getAttribute("aria-invalid"), "true");
  assert.equal(await cashFare.evaluate((el) => document.activeElement === el), true);
  await cashFare.fill("615");
  await calc.locator("#dp-cm-miles").fill("10000");
  await calc.locator("#dp-cm-awardFees").fill("135");
  await calc.locator(".dp-cm-target > summary").click();
  await calc.locator("#dp-cm-target").fill("2");
  await calc.getByRole("button", { name: "Compare fares", exact: true }).press("Enter");
  assert.match(await calc.locator("[data-cm-saving]").innerText(), /AED\s*480/);
  assert.match(await calc.locator("[data-cm-value]").innerText(), /4\.80 fils/);
  assert.match(await calc.locator("[data-cm-break-even]").innerText(), /AED\s*335/);
  assert.equal(new URL(page.url()).search, "");
  await calc.getByRole("button", { name: "Clear", exact: true }).press("Enter");
  assert.equal(await cashFare.inputValue(), "");

  for (const [route, id] of [["/airlines/skywards/", "skywards"], ["/airlines/etihad-guest/", "etihad-guest"]]) {
    await navigate(page, route);
    const tools = page.locator(".dp-programme-tools");
    assert.equal(await tools.getByRole("link", { name: "Find UAE points that transfer in" }).getAttribute("href"), `/transfer-finder/?to=${id}`);
    await tools.locator("details > summary").first().press("Space");
    await tools.getByRole("button", { name: "Try a hypothetical example" }).press("Enter");
    assert.match(await tools.locator("[data-cm-value]").innerText(), /2\.67 fils/);
  }
  await navigate(page, "/transfer-finder/?to=etihad-guest");
  const filterTo = page.locator("[data-transfer-destination]");
  const filterFrom = page.locator("[data-transfer-origin]");
  assert.equal(await filterTo.inputValue(), "etihad-guest");
  const transferTiles = page.locator("[data-transfer-route]:not([hidden])");
  assert.ok(await transferTiles.count() > 1);
  assert.ok((await transferTiles.evaluateAll((items) => items.map((item) => item.dataset.to))).every((to) => to === "etihad-guest"));
  await filterFrom.selectOption("fab-rewards");
  assert.equal(await transferTiles.count(), 1);
  assert.match(await transferTiles.first().innerText(), /FAB Rewards/);
  assert.equal(new URL(page.url()).searchParams.get("from"), "fab-rewards");
  await page.getByRole("button", { name: "Reset filters", exact: true }).press("Enter");
  assert.equal(new URL(page.url()).search, "");
  assert.equal(await transferTiles.count(), 16);
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 880 } });
  try {
    await noScript.route("**/*", (request) => request.request().url().startsWith(server.baseUrl + "/")
      ? request.continue() : request.abort());
    const plain = await noScript.newPage();
    await plain.goto(server.baseUrl + "/transfer-finder/?to=etihad-guest");
    assert.equal(await plain.locator("[data-transfer-route]:not([hidden])").count(), 16);
    assert.equal(await plain.locator("[data-transfer-offer]:not([hidden])").count(), 0);
  } finally {
    await noScript.close();
  }
  await page.clock.setFixedTime(new Date("2026-12-01T04:00:00+04:00"));
  await navigate(page, "/transfer-finder/?to=skywards");
  assert.equal(await page.locator("[data-transfer-offer]:not([hidden])").count(), 0);
  await page.clock.setFixedTime(new Date());

  await navigate(page, "/cards/compare/?cards=citi-cashback,wio-credit");
  const citiValue = page.locator(".dp-compare-col[data-slug='citi-cashback']");
  assert.match(await citiValue.locator("[data-card-value-first]").innerText(), /AED\s+936/);
  assert.match(await citiValue.locator("[data-card-value-later]").innerText(), /AED\s+621/);
  await page.locator("[data-card-value-scenario] summary").press("Space");
  await page.getByLabel("Monthly spend (AED)", { exact: true }).fill("10000");
  await page.getByRole("button", { name: "Update estimates", exact: true }).press("Enter");
  assert.match(await citiValue.locator("[data-card-value-first]").innerText(), /AED\s+1,200/);
  assert.match(await citiValue.locator("[data-card-value-later]").innerText(), /AED\s+885/);
  assert.equal(new URL(page.url()).searchParams.size, 1);
  const wioValue = page.locator(".dp-compare-col[data-slug='wio-credit']");
  assert.equal(await wioValue.locator("[data-card-value-first]").innerText(), "Not estimated");
  assert.match(await wioValue.locator("[data-card-value-reward-issue]").innerText(), /plan/i);

  await navigate(page, "/");
  assert.equal(await page.locator("body.dp-system-typography").count(), 0);
  assert.equal(await page.locator('link[rel="preload"][as="font"]').count(), 2);
  await navigate(page, "/search/?q=skywards");
  const search = page.locator(".pagefind-ui__search-input[aria-label='Search DubaiPoints']");
  await search.waitFor();
  assert.equal(await search.inputValue(), "skywards");
  assert.ok((await search.boundingBox()).height >= 44);
  await navigate(page, "/editorial-policy/");
  assert.ok(await page.locator(".dp-trust-meta time[datetime]").isVisible());
  assert.equal(await page.getByRole("contentinfo").getByRole("navigation").count(), 3);
  await navigate(page, "/404.html");
  const recover = page.locator("main").getByRole("link", { name: "Search DubaiPoints", exact: true });
  assert.equal(await recover.getAttribute("href"), "/search/");
  assert.ok((await recover.boundingBox()).height >= 44);
  console.log("Interactions: menus, guide, programme quick reference, card fees and net value, article sources and fare evidence, tracker, calculators, Finder, comparison, Deals and news");
} finally {
  await browser?.close();
  server.close();
}
