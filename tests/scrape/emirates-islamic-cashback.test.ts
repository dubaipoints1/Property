import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import fixture from "./fixtures/2026-11-emirates-islamic-cashback.json";
import manual from "../../scripts/scrape/manual-primary.registry.json";
import l2 from "../../src/data/cards.json";
import { EI_BASE_CASHBACK as slug, parseEiBaseCashback } from "../../scripts/scrape/_emirates-islamic-cashback.ts";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";

const sources = fixture.sources;
type Witness = (typeof sources)[number];
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
function modify(role: string, fn: (s: Witness) => void, rehash = true) {
  const copy = structuredClone(sources), s = copy.find(x => x.id === "ei-base-cashback-" + role);
  assert.ok(s);
  fn(s);
  if (rehash) {
    s.fixtureTextSha256 = sha(s.text);
    if (s.dom) s.sourceSnapshotSha256 = sha(JSON.stringify([s.id, s.url, s.capturedAt, s.sourceScope, s.dom, s.text]));
  }
  return copy;
}

test("exact base Cashback replays one standard VAT-inclusive AED annual fee, not first-year pricing or rewards", () => {
  const value = parseEiBaseCashback(sources, slug);
  assert.ok(value);
  assert.equal(value.annualFee, 367.5);
  assert.equal(value.vatPolicy, "inclusive");
  assert.equal(value.network, "Visa");
  assert.deepEqual(value.sourceFixtureIds, sources.map(x => x.id));
  assert.equal(value.sources.length, 4);
  assert.ok(value.sources.every(s => !s.includes("apply-now")));
  assert.deepEqual(Object.keys(value.evidence), ["name", "annualFee"]);
  assert.equal(value.evidence.annualFee.length, 2);
  assert.ok(value.evidence.annualFee.every(x => x.sourceBodySha256 === null && x.sourceSnapshotSha256
    && x.captureMethod === "normal-public-browser-ui"));
  assert.equal(sources[3].representation, "first-party-public-reader-excerpt");
  for (const wrong of ["emirates-islamic-cashback-plus", "emirates-islamic-switch-cashback", "emirates-islamic-barca-cashback"]) {
    assert.equal(parseEiBaseCashback(sources, wrong), null, wrong);
  }
  for (const wrong of ["salary", "eligibility", "fxFee", "welcomeBonus", "annualFeeWaiver", "firstYearFee", "loyaltyProgram"]) {
    assert.equal(Object.hasOwn(value, wrong), false, wrong);
  }
});

test("replay fails closed on acquisition, source provenance, VAT, wrong tier, currency or conflicting fee", () => {
  const cases: readonly [string, (s: Witness) => void][] = [
    ["product", x => { x.dom!.links![0].href = "/en/apply-now?product=cashback%20plus%20card"; }],
    ["kfs", x => { x.dom!.vat = "All charges exclusive."; }],
    ["kfs", x => {
      x.dom!.names![4] = "Cashback Plus";
      x.text = x.text.replace("Signature Cashback Barça", "Signature Cashback Plus Barça");
    }],
    ["kfs", x => {
      x.dom!.fees![4] = "313.95"; x.text = x.text.replace("367.5", "313.95");
    }],
    ["tariff", x => { x.dom!.from = "Fee based Cards"; }],
    ["tariff", x => { x.dom!.headers![0][2] = "Supplementary fee"; }],
    ["tariff", x => { x.text = x.text.replace("AED 367.50", "USD 367.50"); }],
    ["tariff", x => { x.text = x.text.replace("AED 367.50", "AED 367.50 waived"); }],
    ["tariff", x => { x.dom!.productRows![0][2] = "\uEADF\u00A0313.95"; }],
    ["tariff", x => { x.dom!.productRows![0][0] = "Cashback Plus"; }],
    ["network", x => { x.text = x.text.replace("RTA & Cashback Credit Cards.", "RTA & Switch Cashback Credit Cards."); }],
    ["network", x => { x.text = x.text.replace(/Visa/gi, "Mastercard"); }],
    ["network", x => { x.representation = "visible-main-dom-and-accessibility-snapshot"; }],
  ];
  for (const [role, alter] of cases) assert.equal(parseEiBaseCashback(modify(role, alter), slug), null, role);
  assert.equal(parseEiBaseCashback(modify("product", x => { x.sourceSnapshotSha256 = "0".repeat(64); }, false), slug), null);
  assert.equal(parseEiBaseCashback(modify("network", x => { x.fixtureTextSha256 = "0".repeat(64); }, false), slug), null);
  assert.equal(parseEiBaseCashback(modify("kfs", x => { x.url += "?alternate=1"; }), slug), null);
  assert.equal(parseEiBaseCashback([...sources, sources[0]], slug), null);
  assert.equal(parseEiBaseCashback(sources.slice(0, -1), slug), null);
});

test("canonical listing does not turn the annual fee into an eligibility, value or comparison promise", () => {
  const card = getCardData(slug), raw = l2[slug], replay = parseEiBaseCashback(sources, slug);
  assert.ok(card && raw && replay);
  assert.ok(getActiveCards().some(c => c.slug === slug));
  assert.deepEqual([card.name, card.network, card.annualFee.amount, card.vatPolicy], [replay.name, replay.network, replay.annualFee, replay.vatPolicy]);
  assert.deepEqual([card.sources, card.applyUrl, card.kfsUrl], [replay.sources, replay.productUrl, replay.kfsUrl]);
  assert.deepEqual(raw._fieldEvidence, replay.evidence);
  assert.deepEqual(manual.cards.find(x => x.slug === slug)?.sourceFixtureIds, replay.sourceFixtureIds);
  assert.equal(card.lastVerified.toISOString().slice(0, 10), replay.capturedDate);
  assert.equal(hasUsableSalaryMinimum(card), false);
  assert.match(annualFeeLabel(card).qual ?? "", /first-year offer pending/);
  const value = cardValueTerms(card, slug), finder = finderEvidence(card);
  assert.deepEqual([value.firstFee, value.laterFee, value.rate, value.hasWelcomeOffer], [null, replay.annualFee, null, false]);
  assert.deepEqual([finder.salaryPending, finder.comparableAnnualFee, finder.rankRates], [true, null, {}]);
  assert.equal(card.fxFee, null);
  assert.ok(Object.values(card.earnRates).every(v => v == null));
  for (const field of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "loyaltyProgram", "interestRate"]) {
    assert.equal(Object.hasOwn(raw, field), false, field);
  }
});
