import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { FAB_ETIHAD_ISLAMIC, FAB_ETIHAD_ISLAMIC_KFS, FAB_ETIHAD_ISLAMIC_TARIFF, parseFabEtihadIslamic } from "../../scripts/scrape/_fab-etihad-islamic.ts";
import { getActiveCards, getCardData, getEditorConfirmedCards } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { cardValueTerms } from "../../src/lib/cardValue";
import { firstYearAnnualFeeStatus } from "../../src/lib/feeIndex";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-fab-etihad-islamic.json";

const sources = fixture.sources as Parameters<typeof parseFabEtihadIslamic>[0];
const full = (key: string) => "fab-etihad-guest-" + key + "-islamic";
const infinite = full("infinite"), signature = full("signature"), platinum = full("platinum");
const feeByTier = { Infinite: 2625, Signature: 1575, Platinum: 525 } as const;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function alter(role: string, from: string, replacement: string) {
  let count = 0;
  const changed = sources.map(s => {
    if (s.id !== "fab-etihad-islamic-" + role) return s;
    count++;
    const text = s.text.replace(from, replacement);
    assert.notEqual(text, s.text, role);
    return { ...s, text, fixtureTextSha256: hash(text) };
  });
  assert.equal(count, 1, role);
  return changed;
}

test("replay selects the printed KFS gross for each exact named Islamic tier", () => {
  assert.equal(sources.length, 28);
  for (const [slug, s] of Object.entries(FAB_ETIHAD_ISLAMIC)) {
    const r = parseFabEtihadIslamic(sources, slug);
    assert.ok(r);
    assert.deepEqual([r.annualFee, r.vatPolicy, r.network, r.capturedDate], [feeByTier[s.tier], "inclusive", "Visa", "2026-11-20"]);
    assert.equal(r.name, "FAB Etihad Guest " + s.tier + " Islamic Credit Card");
    assert.equal(r.kfsUrl, FAB_ETIHAD_ISLAMIC_KFS);
    assert.ok(r.sources.includes(FAB_ETIHAD_ISLAMIC_TARIFF));
    assert.match(r.productUrl, new RegExp("etihad-guest-" + s.key + "-islamic$"));
    assert.ok(!r.sources.some(url => url.includes("onelink") || url.includes("apply.")));
    assert.equal(r.sourceFixtureIds.length, 14);
    assert.deepEqual(Object.keys(r.evidence), ["network", "annualFee"]);
    assert.ok(r.evidence.annualFee.some(p => p.vatTreatment === "exclusive"));
    assert.ok(r.evidence.annualFee.some(p => p.vatTreatment === "inclusive"));
    assert.ok(r.evidence.network.some(p => p.unit.includes("Visa " + s.tier)));
    for (const field of ["salary", "eligibility", "fxFee", "welcomeBonus", "annualFeeWaiver", "rewardRates", "loyaltyProgram"]) {
      assert.equal(Object.hasOwn(r, field), false, field);
    }
  }
  assert.equal(parseFabEtihadIslamic(sources, "fab-etihad-guest-infinite"), null);
});

test("the reversed tier orders, VAT columns, product net and explicit KFS gross fail closed on drift", () => {
  for (const [card, role, before, replacement] of [
    [signature, "tariff-tier-fees", "Platinum/ Signature/", "Signature/ Platinum/"],
    [signature, "tariff-tier-fees", "Excluding VAT", "Including VAT"],
    [signature, "tariff-tier-fees", "1,500", "1,550"],
    [platinum, "kfs-tier-fees", "Infinite / Signature", "Signature / Infinite"],
    [platinum, "kfs-tier-fees", "D 525", "D 550"],
    [infinite, "kfs-tier-fees", "D 2,625", "D 262.50"],
    [infinite, "kfs-columns", "Primary Card", "Supplementary Card"],
    [platinum, "kfs-vat", "inclusive of VAT", "exclusive of VAT"],
    [infinite, "infinite-product-fee-repeat", "2,500", "2,600"],
    [signature, "signature-tariff-link", "schedule-of-charge", "different-card"],
    [signature, "kfs-hub-link", "cards-islamic-", "cards-conventional-"],
  ] as const) assert.equal(parseFabEtihadIslamic(alter(role, before, replacement), card), null, role);
  const r = sources.find(x => x.id === "fab-etihad-islamic-kfs-tier-fees")!;
  assert.equal(parseFabEtihadIslamic([...sources, r], infinite), null);
  assert.equal(parseFabEtihadIslamic(sources.filter(s => s !== r), infinite), null);
  assert.equal(parseFabEtihadIslamic(sources.map(s => s === r ? { ...s, sourceScope: "PDF page 2" } : s), infinite), null);
});

test("a different product, CTA or unreviewed Visa hero cannot support this variant", () => {
  assert.equal(parseFabEtihadIslamic(alter("signature-heading", "Signature Islamic", "Infinite Islamic"), signature), null);
  assert.equal(parseFabEtihadIslamic(alter("platinum-acquisition", "761m60xt", "jq0gyybl"), platinum), null);
  const r = sources.find(x => x.id === "fab-etihad-islamic-infinite-artwork")!;
  const sibling = sources.find(x => x.id === "fab-etihad-islamic-signature-artwork")!;
  assert.equal(parseFabEtihadIslamic(sources.map(s => s === r ? { ...s, visualReceipt: sibling.visualReceipt } : s), infinite), null);
  assert.equal(parseFabEtihadIslamic(sources.map(s => s === r ? { ...s, sourceStartByte: 0 } : s), infinite), null);
  assert.equal(parseFabEtihadIslamic(sources.map(s => s === r ? { ...s, fixtureTextSha256: "0".repeat(64) } : s), infinite), null);
});

test("live catalogue fields replay exactly and keep the Islamic first year and rewards unverified", () => {
  const active = new Set(getActiveCards().map(card => card.slug));
  const confirmed = new Set(getEditorConfirmedCards().map(card => card.slug));
  for (const slug of Object.keys(FAB_ETIHAD_ISLAMIC) as (keyof typeof FAB_ETIHAD_ISLAMIC)[]) {
    const raw = l2[slug], card = getCardData(slug), proof = parseFabEtihadIslamic(sources, slug);
    assert.ok(proof && raw && card && active.has(slug) && !confirmed.has(slug));
    assert.deepEqual([card.name,card.network,card.annualFee.amount,card.vatPolicy,card.applyUrl,card.kfsUrl],
      [proof.name,proof.network,proof.annualFee,proof.vatPolicy,proof.productUrl,proof.kfsUrl]);
    assert.ok(card.sharia && card.categories.includes("Islamic") && card.categories.includes("travel"));
    assert.equal(card.loyaltyProgram, "Etihad Guest");
    assert.deepEqual(raw._fieldEvidence, proof.evidence);
    assert.deepEqual(registry.cards.find(entry => entry.slug === slug)?.sourceFixtureIds, proof.sourceFixtureIds);
    assert.equal(annualFeeLabel(card).qual, "first-year offer pending");
    assert.equal(firstYearAnnualFeeStatus(card), "pending");
    const value = cardValueTerms(card, slug);
    assert.deepEqual([value.firstFee,value.laterFee,value.rate,value.hasWelcomeOffer], [null,proof.annualFee,null,false]);
    assert.equal(card.eligibility.minSalary, null);
    assert.equal(card.eligibility.publishedMinMonthlyIncome, undefined);
    assert.equal(card.fxFee, null);
    assert.ok(Object.values(card.earnRates).every(v => v == null));
    for (const field of ["joiningFee","annualFeeWaiver","welcomeBonus","fxFeeUpperBound","interestRate","scopedEarnRates"])
      assert.ok(!Object.hasOwn(raw, field), field);
  }
});
