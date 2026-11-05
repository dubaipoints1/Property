import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { calculateCashOrMiles } from "../../src/lib/cashOrMiles.ts";
import { dpValueFils } from "../../src/lib/valuations.ts";
import { parseLivKfsProductTable } from "../../scripts/ci/parse-liv-kfs.mjs";

const readArticle = (slug: string) => readFileSync(new URL(`../../src/content/news/${slug}.mdx`, import.meta.url), "utf8");

test("reused article photographs use the existing responsive delivery pipeline", () => {
  for (const slug of ["cash-or-miles-emirates-three-quotes", "uae-salary-switch-payout-calendar"]) {
    assert.match(readArticle(slug), /<StockImage[^>]*delivery="feature"[^>]*sizes=/);
  }
});

test("the three-price teaching example uses the published calculator and labels its inputs hypothetical", () => {
  const text = readArticle("cash-or-miles-emirates-three-quotes");
  const match = text.match(/export const example = (\{[^\n]+\});/);
  assert.ok(match, "The source must retain the explicit editor-created input object");
  const example = JSON.parse(match[1]);
  const target = String(dpValueFils("skywards"));
  const cashPlus = calculateCashOrMiles({ cashFare: example.cashFare, miles: example.cashPlusMiles, awardFees: example.cashPlusMilesCash, target });
  const classic = calculateCashOrMiles({ cashFare: example.cashFare, miles: example.classicMiles, awardFees: example.classicCash, target });
  assert.ok(cashPlus.ok && classic.ok);
  if (!cashPlus.ok || !classic.ok) return;
  assert.equal(cashPlus.result.cashSavedFils, 20_000);
  assert.equal(cashPlus.result.filsPerMile.toFixed(2), "1.33");
  assert.equal(cashPlus.result.breakEvenFareFils, 110_000);
  assert.equal(classic.result.cashSavedFils, 70_000);
  assert.equal(classic.result.filsPerMile.toFixed(2), "2.33");
  assert.equal(classic.result.breakEvenFareFils, 90_000);
  assert.match(text, /basis="hypothetical"/);
  assert.match(text, /no flight was priced, booked or held/);
  assert.match(text, /calculateCashOrMiles\(\{ cashFare: example\.cashFare/);
  assert.match(text, /dpValueFils\("skywards"\)/);
  assert.doesNotMatch(text, /basis="priced-not-booked"|client:/);
});

test("the salary follow-up reuses checksum-gated dated timelines without a new reward or payout formula", () => {
  const text = readArticle("uae-salary-switch-payout-calendar");
  assert.match(text, /getSalaryTransferTimeline\(offer\)/);
  assert.match(text, /if \(!timeline\) throw new Error/);
  assert.match(text, /entryToOffer\(entry\)/);
  assert.match(text, /getEntry\("salaryTransferOfferHistory", id\)/);
  assert.match(text, /dated examples, not confirmation that you qualify/);
  assert.match(text, /keeps home finance unpriced/);
  assert.match(text, /<SalaryTransferTimeline/);
  assert.doesNotMatch(text, /AED\s*\d|Math\.(?:ceil|floor|round)|client:/);
});

test("the Liv historical entry parses its curated source snapshot at build rather than importing live model facts", () => {
  const text = readArticle("uae-card-change-log-liv-eligibility-vat-correction");
  const fixture = readFileSync(new URL("../fixtures/issuer/liv-kfs-january-2026-product-table.txt", import.meta.url), "utf8");
  const parsed = parseLivKfsProductTable(fixture);
  assert.ok(parsed["liv-cashback"].minSalary > 0);
  assert.ok(parsed["liv-cashback-plus"].annualFee > 0);
  assert.match(text, /liv-kfs-january-2026-product-table\.txt\?raw/);
  assert.match(text, /parseLivKfsProductTable\(livKfsTable\)/);
  assert.match(text, /money\(cashback\.minSalary\)/);
  assert.match(text, /money\(plus\.annualFee\)/);
  assert.match(text, /not evidence that Liv has just changed/);
  assert.match(text, /not a fresh verification of every reward rate/);
  assert.doesNotMatch(text, /getCardData|CardSalaryMinimum|CardFeeAmount|AED\s*\d|client:/);
});

test("new article image keys retain original provenance and show contextual credits without missing-image exceptions", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../data/stock/manifest.json", import.meta.url), "utf8"));
  const entries = new Map<string, Record<string, unknown>>(manifest.entries.map((entry: Record<string, unknown>) => [entry.slug, entry]));
  const reused = [
    ["cash-or-miles-emirates-three-quotes", "programme-skywards", /not the fictional flight/],
    ["uae-salary-switch-payout-calendar", "news-rakbank-salary-cash-reward-closes-31-august", /not a bank's payroll system/],
  ] as const;
  for (const [slug, originalSlug, limitation] of reused) {
    const entry = entries.get(`news-${slug}`)!;
    const original = entries.get(originalSlug)!;
    assert.ok(entry && original);
    for (const field of ["source", "source_url", "source_id", "photographer", "photographer_url", "licence", "licence_url", "file", "width", "height", "fetched_at"]) {
      assert.equal(entry[field], original[field], `${slug}: preserve ${field}`);
    }
    const article = readArticle(slug);
    assert.match(article, limitation);
    assert.match(article, new RegExp(`<ImageCredit slug="news-${slug}"`));
  }
  const slug = "uae-card-change-log-liv-eligibility-vat-correction";
  const entry = entries.get(`news-${slug}`)!;
  const art = JSON.parse(readFileSync(new URL("../../data/card-art/manifest.json", import.meta.url), "utf8"))["liv-cashback-plus"];
  assert.equal(entry.source, "editorial");
  assert.equal(entry.source_url, art.url);
  assert.equal(entry.photographer_url, art.page);
  assert.equal(entry.fetched_at, art.fetchedAt);
  assert.equal(entry.width, art.width);
  assert.equal(entry.height, art.height);
  const original = readFileSync(new URL(`../../public/${art.file}`, import.meta.url));
  const alias = readFileSync(new URL(`../../public/${entry.file}`, import.meta.url));
  assert.deepEqual(alias, original, "The issuer asset alias must be byte-identical");
  const hash = createHash("sha256").update(alias).digest("hex");
  assert.ok(readFileSync(new URL("../../data/stock/LIBRARY.md", import.meta.url), "utf8").includes(hash));
  assert.match(readArticle(slug), /Card image: <a href="https:\/\/www\.liv\.me\/en\/liv-credit-card">Liv/);
  const coverageTest = readFileSync(new URL("../images/content-coverage.test.ts", import.meta.url), "utf8");
  for (const articleSlug of [...reused.map(([id]) => id), slug]) assert.ok(!coverageTest.includes(`"news-${articleSlug}"`));
});
