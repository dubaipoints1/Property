import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { CBD_CONVENTIONAL, CBD_SOC, parseCbdConventional } from "../../scripts/scrape/_cbd-conventional";
import { getActiveCards, getCardData } from "../../src/lib/cardsData";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat";
import { cardValueTerms } from "../../src/lib/cardValue";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import fixture from "./fixtures/2026-11-cbd-conventional.json";

const sources = fixture.sources;
const gross = { "cbd-visa-infinite": 787.5, "cbd-super-saver": 420, "cbd-smiles-signature": 525 } as const;
type Slug = keyof typeof gross;
const slugs = Object.keys(gross) as Slug[];
function change(id: string, old: string, replacement: string) {
  return sources.map(s => {
    if (s.id !== id) return s;
    const text = s.text.replace(old, replacement);
    assert.notEqual(text, s.text, id);
    return { ...s, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
  });
}
test("CBD exact named disclosures agree on gross renewal and first-year annual-only waiver", () => {
  assert.equal(sources.length, 17);
  for (const slug of slugs) {
    const r = parseCbdConventional(sources, slug);
    assert.ok(r);
    assert.deepEqual([r.annualFee,r.vatPolicy,r.network,r.capturedDate], [gross[slug],"inclusive","Visa","2026-11-20"]);
    assert.deepEqual(r.annualFeeWaiver, {year_one_waived:true, ongoing_threshold_aed:null,threshold_period:"annual"});
    assert.deepEqual(r.sources, [r.productUrl,r.kfsUrl,CBD_SOC]);
    assert.ok(r.productUrl.endsWith("/"+CBD_CONVENTIONAL[slug].suffix));
    assert.equal(r.sourceFixtureIds.length, 7);
    assert.equal(r.evidence.name[0].sourceBodySha256, null);
    assert.equal(r.evidence.name[0].captureMethod, "normal-public-browser-ui");
    assert.match(r.evidence.annualFeeWaiver[1].rawText, /FIRST YEAR only/);
    for (const k of ["joiningFee", "fxFee", "eligibility", "welcomeBonus", "earnRates"]) assert.equal(Object.hasOwn(r,k),false);
  }
  for (const key of ["cbd-one", "cbd-al-islami-super-saver", "cbd-private-infinite"]) assert.equal(parseCbdConventional(sources,key),null);
});
test("refuses stale tier, shifted headings, inconsistent fee, unproved waiver or changed VAT", () => {
  const slug = "cbd-super-saver";
  for (const [id, before, after] of [
    [slug+"-kfs-fee","420.001","420.009"],
    [slug+"-kfs-fee","420.001","420.00"],
    [slug+"-kfs-fee","420.001","425.001"],
    [slug+"-kfs-fee","Super Saver Visa Signature","Al Islami Super Saver"],
    [slug+"-kfs-head","PRIMARY CARD","SUPPLEMENTARY CARD"],
    [slug+"-kfs-period","FIRST YEAR only","for life"],
    [slug+"-kfs-vat","inclusive","exclusive"],
    [slug+"-product","/digi/cards/supersaver","/digi/cards/visainfinite"],
    [slug+"-product","sfvrsn=dfaa066b_4","sfvrsn=eeab066b_7"],
    ["cbd-soc-primary","Annual Fee (Primary Card)","Annual Fee (Supplementary Card)"],
    ["cbd-soc-primary","Super Saver Visa","Smiles Visa"],
    ["cbd-soc-primary","AED 420.00","AED 425.00"],
    ["cbd-soc-vat","inclusive","exclusive"],
  ]) assert.equal(parseCbdConventional(change(id,before,after),slug),null,id);
  const fee = sources.find(s=>s.id===slug+"-kfs-fee")!;
  const product = sources.find(s=>s.id===slug+"-product")!;
  assert.equal(parseCbdConventional(sources.map(s=>s===product? {...s,sourceBodySha256:"1".repeat(64)}:s),slug),null);
  assert.equal(parseCbdConventional(sources.map(s=>s===product? {...s,sourceSnapshotSha256:undefined}:s),slug),null);
  assert.equal(parseCbdConventional([...sources, fee],slug),null);
  assert.equal(parseCbdConventional(sources.filter(s=>s!==fee),slug),null);
  assert.equal(parseCbdConventional(sources.map(s=>s===fee? {...s,sourceBodySha256:"0".repeat(64)}:s),slug),null);
});
test("CBD catalogue preserves scope, primary-fee period and uncertainty in the tools", () => {
  const active = new Set(getActiveCards().map(c=>c.slug));
  for (const slug of slugs) {
    const r = parseCbdConventional(sources, slug), card = getCardData(slug);
    assert.ok(r && card && active.has(slug) && !card.sharia);
    assert.deepEqual([card.name,card.annualFee.amount,card.vatPolicy,card.kfsUrl,card.applyUrl], [r.name,r.annualFee,r.vatPolicy,r.kfsUrl,r.productUrl]);
    assert.deepEqual(l2[slug]._fieldEvidence,r.evidence);
    assert.deepEqual(l2[slug].annualFeeWaiver,r.annualFeeWaiver);
    assert.deepEqual(registry.cards.find(r=>r.slug===slug)?.sourceFixtureIds,r.sourceFixtureIds);
    assert.equal(annualFeeLabel(card).qual,"year 2+");
    assert.equal(hasUsableSalaryMinimum(card),false);
    const value=cardValueTerms(card,slug);
    assert.deepEqual([value.firstFee,value.laterFee,value.rate,value.hasWelcomeOffer],[null,gross[slug],null,false]);
    assert.equal(card.fxFee,null);
    assert.equal(card.annualFeeWaiver?.ongoing_threshold_aed,null);
  }
  assert.ok(active.has("cbd-one"));
  assert.ok(!active.has("cbd-al-islami-super-saver"));
});
