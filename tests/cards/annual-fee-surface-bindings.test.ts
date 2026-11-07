import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { annualFeeLabel, cardComparisonRows, formatAED } from "../../src/lib/cardsDataFormat.ts";
import { cardFeeNeedsReview as reexportedGuard } from "../../src/lib/cardFeeFacts.ts";
import { cardFeeNeedsReview, compareKnownAnnualFees } from "../../src/lib/cardFeeProvenance.ts";
const read = (file: string) => readFileSync(file, "utf8");
const base = getCardData("citi-cashback")!;
const source = getCardData("adib-smiles-visa-classic")!;
function expression(file: string, variable: string) {
  const match = read(file).match(new RegExp(`const ${variable} =\\s*([\\s\\S]*?);`));
  assert.ok(match, `${file}: ${variable}`); return match[1];
}

test("dependency-free guard is the unchanged FeeFacts export; trusted inline and editor-confirmed zero stay distinct from scraped zero", () => {
  assert.equal(reexportedGuard, cardFeeNeedsReview);
  assert.equal(cardFeeNeedsReview(source, "annualFee"), true);
  assert.deepEqual(annualFeeLabel(source), { amount: "Pending", qual: null });
  for (const field of ["annualFee", "annualFee.amount", "vatPolicy"]) {
    const card = { ...base, _provenance: { ...base._provenance, [field]: "needs-review" } };
    assert.deepEqual(annualFeeLabel(card), { amount: "Pending", qual: null }, field);
  }
  assert.equal(annualFeeLabel({ annualFee: { amount: 0 } }).amount, "Free", "trusted old inline props retain their contract");
  assert.equal(annualFeeLabel({ annualFee: { amount: 0 }, _provenance: { annualFee: "editor-confirmed" } }).amount, "Free");
  assert.equal(annualFeeLabel({ ...base, _provenance: { ...base._provenance, joiningFee: "needs-review" } }).amount, annualFeeLabel(base).amount);
  const conditional = { annualFee: { amount: 100 }, joiningFee: { amount: 200 } };
  assert.equal(annualFeeLabel(conditional).qual, "year 2+");
  assert.equal(annualFeeLabel({ ...conditional, _provenance: { joiningFee: "needs-review" } }).qual, null);
  const waiver = { year_one_waived: true, ongoing_threshold_aed: null, threshold_period: "annual" };
  assert.equal(annualFeeLabel({ annualFee: { amount: 100 }, annualFeeWaiver: waiver }).qual, "year 2+");
  assert.equal(annualFeeLabel({ annualFee: { amount: 100 }, annualFeeWaiver: waiver, _provenance: { annualFeeWaiver: "needs-review" } }).qual, null);
});

test("actual AtAGlance and FeeBlock fee expressions render Pending and suppress precise VAT tags for held source facts", () => {
  const glance = new Function("card", "annualFeeAmount", "formatAED", "cardFeeNeedsReview", `return (${expression("src/components/cards/AtAGlance.astro", "annualFeeLabel")});`);
  const block = new Function("annualFeePending", "annualFee", "formatAED", `return (${expression("src/components/cards/FeeBlock.astro", "feeLabel")});`);
  const select = new Function("resolved", "annualFee", "provenanceProp", `return (${expression("src/components/cards/FeeBlock.astro", "feeEvidence")});`);
  const cards = [source, ...["annualFee", "annualFee.amount", "vatPolicy"].map(field => ({ ...base, _provenance: { ...base._provenance, [field]: "needs-review" } }))];
  for (const card of cards) {
    assert.equal(glance(card, card.annualFee.amount, formatAED, cardFeeNeedsReview), "Pending");
    const inline = select(undefined, card.annualFee, card._provenance);
    assert.equal(cardFeeNeedsReview(inline, "annualFee"), true);
    assert.equal(block(cardFeeNeedsReview(inline, "annualFee"), card.annualFee, formatAED), "Pending");
  }
  assert.match(read("src/components/cards/AtAGlance.astro"), /showVatQual = !cardFeeNeedsReview\(card, "annualFee"\)/);
  assert.match(read("src/components/cards/FeeBlock.astro"), /showVatTag = !annualFeePending/);
  assert.match(read("src/components/cards/FeeBlock.astro"), /joining and other charges are not assumed to be zero/);
  assert.match(read("src/components/cards/SpecCard.astro"), /provenance=\{card\._provenance\}/);
});

test("actual Product graph omits held or unavailable Offers, retaining product identity, description and breadcrumbs", () => {
  const text = read("src/layouts/CardReviewLayout.astro");
  const object = text.match(/const schema = (\{[\s\S]*?\n\});\n---/)?.[1];
  assert.ok(object);
  const factory = new Function("cardName", "bankName", "category", "description", "canonicalUrl", "slug", "score", "bankSlug", "siteUrl", "annualFeePending", "annualFee", "applicationUnavailable", `return (${object});`);
  for (const pending of [true, false]) for (const unavailable of [true, false]) {
    const graph = factory("Example card", "Example issuer", "Cards", "Source-qualified description", "https://example.test/cards/example/", "example", undefined, "example-bank", "https://example.test", pending, 0, unavailable)["@graph"];
    assert.equal(graph[0].name, "Example card"); assert.equal(graph[0].description, "Source-qualified description");
    assert.equal(graph[0].sku, "example"); assert.equal(graph[1]["@type"], "BreadcrumbList");
    if (pending || unavailable) assert.equal(graph[0].offers, undefined);
    else assert.equal(graph[0].offers.price, 0, "a separately known zero fee is not deleted");
  }
  assert.match(text, /annualFeePending = cardData \? cardFeeNeedsReview\(cardData, "annualFee"\)/);
  assert.match(text, /applicationUnavailable = availabilityUnconfirmed \|\| cardData\?\.discontinuedForNewApplicants !== undefined/);
  assert.match(text, /vatQualifier = !annualFeePending/);
  assert.match(text, /cardFeeNeedsReview\(c, "annualFee"\) \? "Annual fee pending"/);
});

test("listings, SpecCard, homepage and review hero share the same provenance-aware annual label", () => {
  for (const file of ["src/components/cards/SpecCard.astro", "src/pages/cards/index.astro", "src/pages/cards/cashback.astro", "src/pages/cards/islamic.astro", "src/pages/cards/miles.astro", "src/pages/cards/perks/[perk].astro", "src/pages/cards/salary/[point].astro", "src/pages/banks/[slug].astro", "src/pages/index.astro", "src/layouts/CardReviewLayout.astro"])
    assert.match(read(file), /annualFeeLabel\(/, file);
  assert.match(read("src/components/cards/SpecCard.astro"), /feeLabel\.amount === "Pending" \? "annual fee pending"/);
  for (const card of getActiveCards().filter(card => cardFeeNeedsReview(card, "annualFee")))
    assert.deepEqual(annualFeeLabel(card), { amount: "Pending", qual: null }, card.slug);
});

test("held annual or joining fees cannot become a comparison winner, including absent-but-held joining fields", () => {
  for (const field of ["annualFee", "annualFee.amount", "vatPolicy"]) {
    const held = { ...base, _provenance: { ...base._provenance, [field]: "needs-review" } };
    const row = cardComparisonRows(held, base).find(row => row.key === "annualFee")!;
    assert.equal(row.leftValue, "Pending"); assert.equal(row.winner, "none");
  }
  const row = cardComparisonRows(source, base).find(row => row.key === "annualFee")!;
  assert.equal(row.leftValue, "Pending"); assert.equal(row.winner, "none");
  const joining = cardComparisonRows({ ...base, joiningFee: undefined, _provenance: { ...base._provenance, joiningFee: "needs-review" } }, base).find(row => row.key === "joiningFee")!;
  assert.equal(joining.leftValue, "Pending"); assert.equal(joining.winner, "none");
  const component = read("src/components/cards/CardComparison.astro");
  assert.match(component, /\{row\.leftValue\}/); assert.match(component, /\{row\.rightValue\}/);
});

test("shared annual-fee comparator never converts unknown or invalid values into cheapest zero", () => {
  assert.equal(compareKnownAnnualFees(null, null), 0);
  assert.ok(compareKnownAnnualFees(0, null) < 0); assert.ok(compareKnownAnnualFees(null, 0) > 0);
  assert.ok(compareKnownAnnualFees(100, 0) > 0);
  for (const invalid of [NaN, Infinity, -1]) { assert.ok(compareKnownAnnualFees(invalid, 0) > 0); assert.equal(compareKnownAnnualFees(invalid, null), 0); }
});

test("comparison VAT tags do not qualify a held annual or joining fee", () => {
  const source = read("src/components/cards/CardComparison.astro");
  const functionText = source.match(/function vatTagFor\([\s\S]*?\n\}/)?.[0];
  assert.ok(functionText);
  const body = functionText.slice(functionText.indexOf("): string | null {") + "): string | null {".length, -1);
  const tag = new Function("rowKey", "side", "leftCard", "rightCard", "leftVat", "rightVat", "cardFeeNeedsReview", body);
  for (const field of ["annualFee", "annualFee.amount", "joiningFee", "joiningFee.amount", "vatPolicy"]) {
    const held = { ...base, joiningFee: { amount: 100 }, _provenance: { ...base._provenance, [field]: "needs-review" } };
    const key = field.startsWith("joining") ? "joiningFee" : "annualFee";
    assert.equal(tag(key, "left", held, base, true, true, cardFeeNeedsReview), null, field);
  }
  assert.equal(tag("annualFee", "right", base, base, true, true, cardFeeNeedsReview), "(incl. VAT)");
});
