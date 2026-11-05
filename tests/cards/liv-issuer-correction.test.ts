import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseLivKfsProductTable } from "../../scripts/ci/parse-liv-kfs.mjs";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { cardComparisonRows, formatAED } from "../../src/lib/cardsDataFormat.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { buildFeeIndex } from "../../src/lib/feeIndex.ts";

const fixture = readFileSync("tests/fixtures/issuer/liv-kfs-january-2026-product-table.txt", "utf8");
const source = JSON.parse(readFileSync("tests/fixtures/issuer/liv-kfs-january-2026-source.json", "utf8"));
const parsed = parseLivKfsProductTable(fixture);

test("Liv source capture has an explicit edition, PDF hash and unchanged complete table", () => {
  assert.match(source.pdfSha256, /^[a-f0-9]{64}$/);
  assert.equal(createHash("sha256").update(fixture).digest("hex"), source.fixtureSha256);
  assert.equal(source.sourcePage, 1);
  assert.equal(source.checkedAt, "2026-11-05");
  assert.match(fixture, /Tamayaz Platinum\s{2,}Tamayaz World\s{2,}Tamayaz World Elite/);
});

test("Liv parser fails closed on changed edition, order, duplicate/missing rows or malformed amounts", () => {
  const cases = [
    fixture.replace("January 2026", "January 2025"),
    fixture.replace("Cashback Card", "OTHER"),
    fixture.replace("Cashback Card", "Cashback+ Card"),
    fixture.replace("Renewal Fee", "Renewal amount"),
    fixture.replace("AED 15,000", "AED 15.000"),
    fixture.replace("AED 15,000", "N/A"),
    fixture.replace("AED 735", "735"),
    fixture.replace(/ {2,}/g, " "),
    fixture.replace("Important Terms and Conditions", fixture.split("\n").find((line) => line.includes("Renewal Fee"))! + "\nImportant Terms and Conditions"),
  ];
  for (const text of cases) assert.throws(() => parseLivKfsProductTable(text));
  const changedNeighbour = fixture.replace("AED 12,000", "AED 25,000");
  assert.deepEqual(parseLivKfsProductTable(changedNeighbour), parsed, "neighbouring Tamayaz eligibility must not leak into Cashback");
});

test("model values and protected provenance match named issuer columns without a full-card reverify claim", () => {
  for (const [slug, facts] of Object.entries(parsed) as Array<[string, {minSalary: number; joiningFee: number; annualFee: number}]>) {
    const card = getCardData(slug)!;
    assert.equal(card.eligibility.minSalary, facts.minSalary);
    assert.equal(card.annualFee.amount, facts.annualFee);
    assert.equal(card.joiningFee?.amount ?? 0, facts.joiningFee);
    assert.equal(card._provenance?.eligibility, "editor-corrected");
    assert.equal(card.kfsUrl, source.sourceUrl);
    assert.ok(card.sources.includes(source.sourceUrl));
    assert.equal(card.lastVerified.toISOString().slice(0, 10), "2026-11-01", "field-only review must not freshen the full-card scrape date");
    assert.ok(!card.perks.some((p) => /No minimum salary is published/.test(p)));
    if (facts.annualFee > 0) {
      assert.equal(card.vatPolicy, "inclusive");
      assert.equal(card._provenance?.annualFee, "editor-corrected");
      assert.equal(card._provenance?.joiningFee, "editor-corrected");
    }
  }
});

test("Finder, salary listings, Compare and fee-index consume the same corrected L2 facts", () => {
  const cards = getActiveCards().filter((c) => c.bank === "liv");
  for (const card of cards) {
    const facts = parsed[card.slug];
    const evidence = finderEvidence(card);
    assert.equal(evidence.salaryPending, false);
    assert.equal(evidence.salaryLabel, formatAED(facts.minSalary));
    assert.equal(cards.filter((c) => c.eligibility.minSalary <= facts.minSalary - 1).some((c) => c.slug === card.slug), false);
    assert.equal(cards.filter((c) => c.eligibility.minSalary <= facts.minSalary).some((c) => c.slug === card.slug), true);
    const fee = buildFeeIndex(cards).rows.find((row) => row.slug === card.slug)!;
    assert.equal(fee.minSalary, facts.minSalary);
    assert.equal(fee.annualFee, facts.annualFee);
    if (facts.annualFee) assert.ok(evidence.feeNotes.some((note) => note.includes(formatAED(facts.annualFee)) && note.includes("incl. VAT")));
  }
  const rows = cardComparisonRows(getCardData("liv-cashback")!, getCardData("liv-cashback-plus")!);
  assert.equal(rows.find((row) => row.key === "minSalary")?.leftValue, `${formatAED(parsed["liv-cashback"].minSalary)}/mo`);
  assert.equal(rows.find((row) => row.key === "minSalary")?.rightValue, `${formatAED(parsed["liv-cashback-plus"].minSalary)}/mo`);
  assert.equal(rows.find((row) => row.key === "annualFee")?.rightValue, formatAED(parsed["liv-cashback-plus"].annualFee));
});

test("Liv prose no longer claims missing salary or duplicates the old pre-VAT fee", () => {
  for (const file of ["src/content/cards/liv-cashback.mdx", "src/content/cards/liv-cashback-plus.mdx", "src/content/banks/liv.mdx"]) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /no\s+(?:published\s+)?(?:minimum salary|salary minimum|salary gate)|publishes no salary minimum|does not\s+state one/i);
    assert.doesNotMatch(text, /AED[ -]700|AED 175 late fee|AED 25 card replacement/);
  }
  for (const file of ["src/content/guides/best-lounge-access-cards-uae-2026.mdx", "src/content/guides/best-no-annual-fee-cards-uae-2026.mdx", "src/content/guides/uae-credit-card-eligibility-2026.mdx"]) {
    assert.match(readFileSync(file, "utf8"), /<CardSalaryMinimum card="liv-cashback"/);
  }
  for (const file of ["src/content/guides/best-cashback-cards-uae-2026.mdx", "src/content/guides/best-skywards-cards-uae-2026.mdx"]) {
    const text = readFileSync(file, "utf8");
    assert.match(text, /<CardFeeAmount card="liv-cashback-plus"/);
    assert.doesNotMatch(text, /Liv Cashback\+[^\n]*AED 700|after the AED 700 fee|AED 6,500 after/);
  }
});
