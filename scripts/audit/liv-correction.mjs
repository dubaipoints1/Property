// Focused built-site proof for the source-scoped Liv correction. No network
// outside the local build, no analytics, no data or source writes.
// node scripts/audit/liv-correction.mjs [dist] [screenshot-directory]
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { startStaticServer } from "./_lib.mjs";
import { parseLivKfsProductTable } from "../ci/parse-liv-kfs.mjs";

const facts = parseLivKfsProductTable(readFileSync("tests/fixtures/issuer/liv-kfs-january-2026-product-table.txt", "utf8"));
const output = process.argv[3];
if (output) mkdirSync(output, { recursive: true });
const server = await startStaticServer({ distDir: process.argv[2] ?? "dist" });
const browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });
const errors = [];
const normal = (text) => String(text).replace(/\s+/g, " ");
const amount = (n) => n.toLocaleString("en-GB");
const aed = (n) => new Intl.NumberFormat("en-AE", {style:"currency",currency:"AED",maximumFractionDigits:0}).format(n);
try {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, reducedMotion: "reduce" });
    await context.route("**/*", (route) => route.request().url().startsWith(server.baseUrl + "/") ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const go = async (path) => { const response = await page.goto(server.baseUrl + path); assert.equal(response.status(), 200, path); await page.evaluate(() => document.fonts.ready); };
    const salaryRegular = facts["liv-cashback"].minSalary;
    const salaryPlus = facts["liv-cashback-plus"].minSalary;
    for (const salary of [salaryRegular - 1, salaryRegular, salaryPlus - 1, salaryPlus]) {
      await go(`/cards/finder/?salary=${salary}`);
      const index = await page.locator("#finder-card-index").textContent().then(JSON.parse);
      for (const [slug, source] of Object.entries(facts)) {
        assert.equal(index.find((card) => card.slug === slug).minSalary, source.minSalary);
        const tile = page.locator(`.dp-finder-tile[data-slug="${slug}"]`);
        assert.ok(normal(await tile.locator(".dp-finder-key-facts").textContent()).includes(amount(source.minSalary)));
        if (salary < source.minSalary) assert.equal(await tile.isVisible(), false, `${slug} must not be presented below its minimum`);
      }
      const expected = index.filter((card) => !card.invitationOnly && !card.discontinued && card.minSalary <= salary).length;
      await page.waitForFunction((count) => {
        const text = document.querySelector("#finder-count").textContent;
        return count === 0 ? text === "No cards meet your filters" : text.includes(`of ${count} `);
      }, expected);
    }
    for (const [slug, source] of Object.entries(facts)) {
      await go(`/cards/${slug}/`);
      const salaryTile = page.locator(".dp-at-a-glance .tile").filter({has: page.getByText("Min salary", {exact:true})}).first();
      assert.ok(normal(await salaryTile.textContent()).includes(amount(source.minSalary)));
      if (source.annualFee) {
        assert.match(normal(await page.locator(".dp-fee-block").first().textContent()), new RegExp(`AED ${source.annualFee} incl\\. VAT`));
        assert.doesNotMatch(normal(await page.locator("#main-content").textContent()), /AED[ -]700/);
      }
      for (const [width, height] of [[320,740], [390,844], [1440,900]]) {
        await page.setViewportSize({width,height});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${slug} ${width}px overflow`);
        if (output && width === 390) await page.screenshot({path: join(output, `${slug}-${colorScheme}-mobile.png`), fullPage: true});
      }
      if (output) await page.screenshot({path: join(output, `${slug}-${colorScheme}-desktop.png`), fullPage: true});
    }
    await go("/cards/compare/?cards=liv-cashback,liv-cashback-plus");
    for (const [slug, source] of Object.entries(facts)) {
      const column = page.locator(`.dp-compare-col[data-slug="${slug}"]`);
      await column.waitFor({state:"visible"});
      assert.ok(normal(await column.locator(".dp-eligibility-primary").textContent()).includes(amount(source.minSalary)));
      if (source.annualFee) assert.match(normal(await column.locator(".dp-fee-block").textContent()), new RegExp(`AED ${source.annualFee} incl\\. VAT`));
    }
    for (const salary of [5000,8000,12000,20000,30000]) {
      await go(`/cards/salary/${salary}/`);
      for (const [slug, source] of Object.entries(facts)) assert.equal(await page.locator(`.dp-compare-table tbody a[href="/cards/${slug}/"]`).count(), salary >= source.minSalary ? 1 : 0);
    }
    await go("/cards/fees/");
    for (const [slug, source] of Object.entries(facts)) {
      const row = page.locator(".dp-data-table tbody tr").filter({has: page.locator(`a[href="/cards/${slug}/"]`)});
      const cells = await row.locator("td").allTextContents();
      assert.ok(normal(cells[5]).includes(amount(source.minSalary)));
      if (source.annualFee) assert.ok(normal(cells[2]).includes(amount(source.annualFee)));
    }
    for (const route of ["/banks/liv/", "/guides/best-cashback-cards-uae-2026/", "/guides/best-skywards-cards-uae-2026/", "/guides/best-lounge-access-cards-uae-2026/", "/guides/best-no-annual-fee-cards-uae-2026/", "/guides/uae-credit-card-eligibility-2026/"]) {
      await go(route);
      const content = normal(await page.locator("#main-content").textContent());
      if (/cashback-cards|banks\/liv|skywards-cards|lounge-access/.test(route)) assert.ok(content.includes("735 including VAT"), route);
      if (route.includes("best-cashback-cards")) {
        const row = page.locator("table").filter({hasText:"Year-two fee"}).locator("tbody tr").filter({has: page.locator('a[href="/cards/liv-cashback-plus/"]')}).first();
        const text = normal(await row.textContent());
        for (const gross of [420,720,7200]) assert.ok(text.includes(normal(aed(gross - facts["liv-cashback-plus"].annualFee))), text);
        if (output) {
          await page.setViewportSize({width:390,height:844});
          await page.screenshot({path:join(output, `liv-guide-${colorScheme}-mobile.png`), fullPage:true});
          await page.setViewportSize({width:1440,height:900});
        }
      }
    }
    await context.close();
    console.log(`${colorScheme}: Finder thresholds/counts, reviews, Compare, all five salary pages, fee index, bank and five guides passed`);
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport:{width:390,height:844} });
  await nojs.route("**/*", (route) => route.request().url().startsWith(server.baseUrl + "/") ? route.continue() : route.abort());
  const page = await nojs.newPage();
  await page.goto(server.baseUrl + "/cards/liv-cashback-plus/");
  const salaryTile = page.locator(".dp-at-a-glance .tile").filter({has:page.getByText("Min salary", {exact:true})}).first();
  assert.ok(normal(await salaryTile.textContent()).includes(amount(facts["liv-cashback-plus"].minSalary)));
  assert.match(normal(await page.locator(".dp-fee-block").first().textContent()), /735 incl\. VAT/);
  await nojs.close();
  assert.deepEqual(errors, []);
  console.log("No-JS Liv review retains issuer salary and inclusive fee; zero page errors");
} catch (error) { console.error(error.message); throw error; }
finally { await browser.close(); server.close(); }
