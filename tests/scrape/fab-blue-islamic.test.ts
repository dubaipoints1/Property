import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { FAB_BLUE_ISLAMIC_KFS, FAB_BLUE_ISLAMIC_PRODUCT, FAB_BLUE_ISLAMIC_TARIFF, parseFabBlueIslamic } from "../../scripts/scrape/_fab-blue-islamic.ts";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { cardValueTerms } from "../../src/lib/cardValue";
import { firstYearAnnualFeeStatus } from "../../src/lib/feeIndex";
import l2 from "../../src/data/cards.json";
import maintenance from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-fab-blue-islamic.json";

const slug = "fab-blue-islamic";
const sources = fixture.sources as Parameters<typeof parseFabBlueIslamic>[0];
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const pin = (role: string) => sources.find(x => x.id === slug + "-" + role)!;
function alter(role: string, before: string, after: string) {
  const target = pin(role);
  assert.ok(target, role);
  const text = target.text.replace(before, after);
  assert.notEqual(text, target.text, role);
  return sources.map(s => s === target ? { ...s, text, fixtureTextSha256: sha(text) } : s);
}

test("Blue Islamic replays the explicitly published gross primary fee and verified Visa, not a conventional tier", () => {
  assert.equal(sources.length, 14);
  const r = parseFabBlueIslamic(sources, slug);
  assert.ok(r);
  assert.deepEqual([r.name, r.network, r.annualFee, r.vatPolicy, r.capturedDate],
    ["Blue FAB Islamic Credit Card", "Visa", 315, "inclusive", "2026-11-20"]);
  assert.equal(r.productUrl, FAB_BLUE_ISLAMIC_PRODUCT);
  assert.equal(r.kfsUrl, FAB_BLUE_ISLAMIC_KFS);
  assert.ok(r.sources.includes(FAB_BLUE_ISLAMIC_TARIFF));
  assert.ok(r.sources.every(x => !x.includes("#form") && !x.includes("apply.")));
  assert.deepEqual(Object.keys(r.evidence), ["network", "annualFee"]);
  assert.ok(r.evidence.network[0].unit.includes("Visa Signature"));
  assert.equal(r.evidence.annualFee.at(-1)?.vatTreatment, "not-applicable");
  assert.equal(r.evidence.annualFee.filter(x => x.vatTreatment === "exclusive").length, 1);
  for (const key of ["salary", "publishedIncome", "eligibility", "fxFee", "welcomeBonus", "annualFeeWaiver", "firstYearFee", "earnRates", "loyaltyProgram"]) {
    assert.equal(Object.hasOwn(r, key), false, key);
  }
  for (const sibling of ["fab-blue-al-futtaim-signature", "fab-cashback-islamic"])
    assert.equal(parseFabBlueIslamic(sources, sibling), null);
});

test("wrong tier, fees, columns, VAT scope, product headline or source identity fail closed", () => {
  for (const [role, before, after] of [
    ["heading", "Blue FAB Islamic", "Blue FAB Signature"],
    ["cta", "credit-card#form", "credit-card#other"],
    ["product-fee-repeat", "300*", "400*"],
    ["product-fee", "Annual Fee", "Minimum Salary"],
    ["tariff-link", "credit-cards-fees-and-charges", "fab-islamic-etihad-guest-credit-cards-schedule-of-charge"],
    ["tariff-row", "Blue Islamic Credit", "FAB Cashback"],
    ["tariff-row", "D 300", "D 400"],
    ["tariff-row", "Excluding VAT", "Including VAT"],
    ["kfs-row", "Blue Islamic Credit Card", "Etihad Guest Platinum"],
    ["kfs-row", "D 315", "D 299"],
    ["kfs-vat", "inclusive of VAT", "exclusive of VAT"],
    ["kfs-columns", "Primary Card", "Supplementary Card"],
    ["kfs-hub-link", "cards-islamic-", "cards-conventional-"],
  ] as const) assert.equal(parseFabBlueIslamic(alter(role, before, after), slug), null, role);
  const gross = pin("kfs-row");
  assert.equal(parseFabBlueIslamic([...sources, gross], slug), null);
  assert.equal(parseFabBlueIslamic(sources.filter(x => x !== gross), slug), null);
  assert.equal(parseFabBlueIslamic(sources.map(x => x === gross ? { ...x, sourceScope: "PDF page 2" } : x), slug), null);
  assert.equal(parseFabBlueIslamic(sources.map(x => x === gross ? { ...x, firstLine: 3 } : x), slug), null);
});

test("verify exact linked Visa proof; do not infer from the Visa Signature tier name", () => {
  const art = pin("artwork");
  assert.ok(art.visualReceipt);
  for (const change of [{ sha256: "0".repeat(64) }, { bytes: 300 }, { contentType: "image/png" }, { assetUrl: FAB_BLUE_ISLAMIC_PRODUCT }]) {
    const corrupted = sources.map(s => s === art ? { ...s, visualReceipt: { ...art.visualReceipt!, ...change } } : s);
    assert.equal(parseFabBlueIslamic(corrupted, slug), null);
  }
  assert.equal(parseFabBlueIslamic(alter("artwork", "fab-blue-islamic-cc.png", "visa-signature.png"), slug), null);
  assert.equal(parseFabBlueIslamic(sources.map(s => s === art ? { ...s, sourceStartByte: 0 } : s), slug), null);
});

test("blue Islamic stays separate and leaves year-one cost and any waived amount unverified", () => {
  const r = parseFabBlueIslamic(sources, slug), card = getCardData(slug), raw = l2[slug];
  assert.ok(r && card && raw && getActiveCards().some(c => c.slug === slug));
  assert.deepEqual([card.name, card.network, card.annualFee.amount, card.vatPolicy, card.applyUrl, card.kfsUrl],
    [r.name, r.network, r.annualFee, r.vatPolicy, r.productUrl, r.kfsUrl]);
  assert.deepEqual(raw._fieldEvidence, r.evidence);
  assert.deepEqual(maintenance.cards.find(c => c.slug === slug)?.sourceFixtureIds, r.sourceFixtureIds);
  assert.ok(card.sharia && card.categories.includes("Islamic") && !card.categories.includes("travel"));
  assert.equal(annualFeeLabel(card).qual, "waiver terms apply");
  assert.equal(firstYearAnnualFeeStatus(card), "pending");
  const value = cardValueTerms(card, slug);
  assert.deepEqual([value.firstFee, value.laterFee, value.rate, value.hasWelcomeOffer], [null, r.annualFee, null, false]);
  assert.ok(!getEditorConfirmedCards().some(c => c.slug === slug));
  assert.equal(card.eligibility.minSalary, null); assert.equal(card.fxFee, null);
  assert.ok(Object.values(card.earnRates).every(v => v == null));
  for (const field of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "loyaltyProgram", "scopedEarnRates", "fxFeeUpperBound"])
    assert.ok(!Object.hasOwn(raw, field), field);
});
