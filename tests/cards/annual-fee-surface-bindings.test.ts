import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { annualFeeLabel, cardComparisonRows, formatAED } from "../../src/lib/cardsDataFormat.ts";
import { cardFeeNeedsReview as reexportedGuard } from "../../src/lib/cardFeeFacts.ts";
import { cardFeeNeedsReview, compareKnownAnnualFees } from "../../src/lib/cardFeeProvenance.ts";
const read = (file: string) => readFileSync(file, "utf8");
const base = getCardData("citi-cashback")!;
const confirmedClassic = getCardData("adib-smiles-visa-classic")!;
const source = { ...confirmedClassic, _provenance: { ...confirmedClassic._provenance, annualFee: "scraped" as const } };
function expression(file: string, variable: string) {
  const match = read(file).match(new RegExp(`const ${variable} =\\s*([\\s\\S]*?);`));
  assert.ok(match, `${file}: ${variable}`); return match[1];
}

test("dependency-free guard is the unchanged FeeFacts export; trusted inline and editor-confirmed zero stay distinct from scraped zero", () => {
  assert.equal(reexportedGuard, cardFeeNeedsReview);
  assert.equal(cardFeeNeedsReview(source, "annualFee"), true);
  assert.deepEqual(annualFeeLabel(source), { amount: "Pending", qual: null });
  assert.equal(cardFeeNeedsReview(confirmedClassic, "annualFee"), false);
  assert.deepEqual(annualFeeLabel(confirmedClassic), { amount: "Free", qual: null });
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
  const glance = new Function("card", "annualFeeLabel", `return (${expression("src/components/cards/AtAGlance.astro", "recurringFee")});`);
  const block = new Function("annualFeePending", "annualFee", "formatAED", `return (${expression("src/components/cards/FeeBlock.astro", "feeLabel")});`);
  const select = new Function("resolved", "annualFee", "provenanceProp", `return (${expression("src/components/cards/FeeBlock.astro", "feeEvidence")});`);
  const cards = [source, ...["annualFee", "annualFee.amount", "vatPolicy"].map(field => ({ ...base, _provenance: { ...base._provenance, [field]: "needs-review" } }))];
  for (const card of cards) {
    assert.deepEqual(glance(card, annualFeeLabel), { amount: "Pending", qual: null });
    const inline = select(undefined, card.annualFee, card._provenance);
    assert.equal(cardFeeNeedsReview(inline, "annualFee"), true);
    assert.equal(block(cardFeeNeedsReview(inline, "annualFee"), card.annualFee, formatAED), "Pending");
  }
  assert.match(read("src/components/cards/AtAGlance.astro"), /showVatQual = !cardFeeNeedsReview\(card, "annualFee"\)/);
  assert.match(read("src/components/cards/AtAGlance.astro"), /recurringFee\.qual &&/);
  assert.match(read("src/components/cards/FeeBlock.astro"), /showVatTag = !annualFeePending/);
  assert.match(read("src/components/cards/FeeBlock.astro"), /joining and other charges are not assumed to be zero/);
  assert.match(read("src/components/cards/SpecCard.astro"), /provenance=\{card\._provenance\}/);
});

test("actual Product graph omits held or unavailable Offers, retaining product identity, description and breadcrumbs", () => {
  const text = read("src/layouts/CardReviewLayout.astro");
  const object = text.match(/const schema = (\{[\s\S]*?\n\});\n---/)?.[1];
  assert.ok(object);
  const factory = new Function("cardName", "bankName", "category", "description", "canonicalUrl", "slug", "score", "bankSlug", "siteUrl", "singleFeeOffer", "annualFee", `return (${object});`);
  const singleOffer = new Function("annualFeePending", "applicationUnavailable", "cardData", "recurringFee", "annualFee", "cardFeeNeedsReview", `return (${expression("src/layouts/CardReviewLayout.astro", "singleFeeOffer")});`);
  const knownZero = { ...confirmedClassic, joiningFee: { amount: 0, currency: "AED" },
    _provenance: { ...confirmedClassic._provenance, joiningFee: "editor-confirmed" } };
  for (const pending of [true, false]) for (const unavailable of [true, false]) {
    const graph = factory("Example card", "Example issuer", "Cards", "Source-qualified description", "https://example.test/cards/example/", "example", undefined, "example-bank", "https://example.test", singleOffer(pending, unavailable, knownZero, { qual: null }, 0, cardFeeNeedsReview), 0)["@graph"];
    assert.equal(graph[0].name, "Example card"); assert.equal(graph[0].description, "Source-qualified description");
    assert.equal(graph[0].sku, "example"); assert.equal(graph[1]["@type"], "BreadcrumbList");
    if (pending || unavailable) assert.equal(graph[0].offers, undefined);
    else assert.equal(graph[0].offers.price, 0, "a separately known zero fee is not deleted");
  }
  assert.equal(singleOffer(false, false, { refreshMode: "manual-primary" }, { qual: "year 2+" }, 100, cardFeeNeedsReview), false);
  assert.equal(singleOffer(false, false, { refreshMode: "manual-primary" }, { qual: null }, 100, cardFeeNeedsReview), true);
  assert.equal(singleOffer(false, false, confirmedClassic, annualFeeLabel(confirmedClassic), 0, cardFeeNeedsReview), false, "Classic is annual-fee-free, but joining terms are held");
  assert.equal(singleOffer(false, false, null, { qual: null }, 0, cardFeeNeedsReview), false, "no card record cannot establish a free offer");
  assert.equal(singleOffer(false, false, { ...knownZero, joiningFee: undefined }, { qual: null }, 0, cardFeeNeedsReview), false, "undisclosed joining fee is not zero");
  assert.equal(singleOffer(false, false, { ...knownZero, joiningFee: { amount: 200 } }, { qual: null }, 0, cardFeeNeedsReview), false, "paid joining fee is not a free offer");
  assert.equal(singleOffer(false, false, { ...knownZero, _provenance: { joiningFee: "needs-review" } }, { qual: null }, 0, cardFeeNeedsReview), false, "an unconfirmed stored joining zero is not a free offer");
  assert.match(text, /annualFeePending = cardData \? cardFeeNeedsReview\(cardData, "annualFee"\)/);
  assert.match(text, /applicationUnavailable = availabilityUnconfirmed \|\| cardData\?\.discontinuedForNewApplicants !== undefined/);
  assert.match(text, /vatQualifier = !annualFeePending/);
  assert.match(text, /cardFeeNeedsReview\(c, "annualFee"\) \? "Annual fee pending"/);
});

test("listings, SpecCard, homepage and review hero share the same provenance-aware annual label", () => {
  for (const file of ["src/components/cards/SpecCard.astro", "src/pages/cards/index.astro", "src/pages/cards/cashback.astro", "src/pages/cards/islamic.astro", "src/pages/cards/miles.astro", "src/pages/cards/perks/[perk].astro", "src/pages/cards/salary/[point].astro", "src/pages/banks/[slug].astro", "src/pages/index.astro", "src/layouts/CardReviewLayout.astro"])
    assert.match(read(file), /annualFeeLabel\(/, file);
  assert.match(read("src/components/cards/SpecCard.astro"), /feeLabel\.amount === "Pending" \? "annual fee pending"/);
  for (const card of getActiveCards().filter(card => cardFeeNeedsReview(card, "annualFee"))) {
    const qual = card.slug === "emirates-nbd-marriott-bonvoy-world" ? "waiver advertised" : null;
    assert.deepEqual(annualFeeLabel(card), { amount: "Pending", qual }, card.slug);
  }
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
  assert.equal(tag("annualFee", "right", base, base, true, false, cardFeeNeedsReview), "(+ VAT)");
  assert.equal(tag("joiningFee", "left", { ...base, joiningFee: { amount: 100, vatTreatment: "unspecified" } }, base, false, true, cardFeeNeedsReview), "(VAT not specified)");
});

test("annual-fee labels retain VAT and renewal scope; mixed tax bases do not get a winner or schema price", () => {
  const exclusive = { ...base, annualFee: { ...base.annualFee, amount: 150 }, vatPolicy: "exclusive" as const };
  const renewal = { ...exclusive, standardFeeConditions: "renewal-waiver" as const };
  const inclusive = { ...base, annualFee: { ...base.annualFee, amount: 200 }, vatPolicy: "inclusive" as const };
  assert.deepEqual(annualFeeLabel(renewal), { amount: `${formatAED(150)} + VAT`, qual: "year 2+" });
  assert.deepEqual(annualFeeLabel(renewal, { separateVatLabel: true }), { amount: formatAED(150), qual: "year 2+" });
  assert.equal(cardComparisonRows(exclusive, inclusive).find(row => row.key === "annualFee")?.winner, "none");
  const singleOffer = new Function("annualFeePending", "applicationUnavailable", "cardData", "recurringFee", "annualFee", "cardFeeNeedsReview", `return (${expression("src/layouts/CardReviewLayout.astro", "singleFeeOffer")});`);
  assert.equal(singleOffer(false, false, exclusive, { qual: null }, 150, cardFeeNeedsReview), false);
});
