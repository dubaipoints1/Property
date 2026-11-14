import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CITI_EXPANSION_PRODUCTS, parseCitiActiveProduct } from "../../scripts/scrape/_citi-expansion.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { eligibleForSalaryFilter } from "../../src/lib/cardSelection.ts";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat.ts";

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const fresh = () => read("./fixtures/2026-11-citi-new-cards.json").sources;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const namedLandingPages: Record<string, string> = {
  "citi-simplicity": "https://www.citibank.ae/credit-cards/no-annual-fee/citi-simplicity-credit-card",
  "citi-rewards": "https://www.citibank.ae/credit-cards/rewards/citi-rewards-credit-card",
  "citi-premier": "https://www.citibank.ae/credit-cards/rewards/citi-premier-credit-card",
  "citi-prestige": "https://www.citibank.ae/credit-cards/rewards/citi-prestige-credit-card",
  "citi-ultima": "https://www.citibank.ae/credit-cards/travel/citi-ultima-credit-card",
};

test("five new Citi profiles bind published income and VAT-inclusive fee to the exact named issuer rows", () => {
  const cards = read("../../src/data/cards.json");
  const routes = read("../../scripts/scrape/manual-primary.registry.json").cards;
  const applications = new Set();
  for (const slug of Object.keys(CITI_EXPANSION_PRODUCTS)) {
    const original = parseCitiActiveProduct(fresh(), slug);
    assert.ok(original, slug);
    const card = cards[slug];
    assert.equal(card.annualFee.amount, original.annualFee);
    assert.equal(card.vatPolicy, "inclusive");
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.publishedMinMonthlyIncome, original.minSalary);
    assert.deepEqual(card.annualFeeWaiver, original.annualFeeWaiver);
    // Citi's form is session-sensitive. The official named product page
    // is the safe hand-off; raw form targets are only discovery evidence.
    assert.equal(card.applyUrl, namedLandingPages[slug]);
    assert.ok(card.sources.includes(card.applyUrl));
    assert.deepEqual(card._fieldEvidence, original.evidence);
    assert.equal(card.fxFee, null);
    assert.equal(card.earnRates.everythingElse, null);
    assert.equal(card.refreshMode, "manual-primary");
    assert.equal(hasUsableSalaryMinimum(card), false);
    assert.equal(eligibleForSalaryFilter(card._provenance, card.eligibility.minSalary), false);
    assert.ok(!applications.has(original.applyUrl));
    applications.add(original.applyUrl);
    assert.equal(routes.filter((r: { slug: string }) => r.slug === slug).length, 1);
    assert.match(readFileSync(new URL(`../../src/content/cards/${slug}.mdx`, import.meta.url), "utf8"),
      new RegExp(`^slug: ${slug}$`, "m"));
  }
});

test("Citi Rewards uses a renewal fee qualifier in headline fee displays", () => {
  const cards = read("../../src/data/cards.json");
  assert.equal(annualFeeLabel(cards["citi-rewards"]).qual, "year 2+");
  assert.equal(annualFeeLabel(cards["citi-premier"]).qual, null);
});

test("parser withholds names outside this group, drifted rows, duplicate pins, unsupported VAT and URL changes", () => {
  const original = fresh();
  assert.equal(parseCitiActiveProduct(original, "citi-cashback"), null);
  assert.equal(parseCitiActiveProduct(original, "citi-ready-credit"), null);
  const altered = (id: string, update: (s: string) => string) => {
    const sources = fresh();
    const item = sources.find((s: { id: string }) => s.id === id);
    item.text = update(item.text);
    item.fixtureTextSha256 = sha(item.text);
    return sources;
  };
  assert.equal(parseCitiActiveProduct(altered("citi-kfs-fees-salary", s => s.replace("Citi Premier | 15,000", "Citi Premier | 15,001")), "citi-premier"), null);
  assert.equal(parseCitiActiveProduct(altered("citi-kfs-fees-salary", s => s + "\nCiti Simplicity | 5,000 | -"), "citi-simplicity"), null);
  assert.equal(parseCitiActiveProduct(altered("citi-vat", s => s.replace("over and above", "included in")), "citi-prestige"), null);
  assert.equal(parseCitiActiveProduct(altered("product-simplicity", s => s.replaceAll("online.citibank.ae", "other.invalid")), "citi-simplicity"), null);
  assert.equal(parseCitiActiveProduct(original.filter((s: { id: string }) => s.id !== "citi-rewards-waiver"), "citi-rewards"), null);
});
