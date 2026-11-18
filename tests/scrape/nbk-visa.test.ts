import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NBK_VARIANTS, NBK_KFS, parseNbkVisa } from "../../scripts/scrape/_nbk-visa.ts";
import { getActiveCards } from "../../src/lib/cardsData.ts";
import { annualFeeLabel } from "../../src/lib/cardsDataFormat.ts";
import { buildFeeIndex, feeIndexAnnualFeeLabel, firstYearAnnualFeeLabel } from "../../src/lib/feeIndex.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import { cardSearchMetadata } from "../../src/lib/cardSearchMetadata.ts";

const read = () => JSON.parse(readFileSync(new URL("./fixtures/2026-11-nbk-visa.json", import.meta.url), "utf8")).sources;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

test("three distinct NBK UAE Visa tiers replay named issuer fee rows, a first-year annual waiver and renewal VAT basis", () => {
  const cards = getActiveCards(), idx = buildFeeIndex(cards);
  for (const [slug, amount] of [["nbk-visa-classic",150],["nbk-visa-gold",300],["nbk-visa-platinum",450]] as const) {
    assert.ok(Object.hasOwn(NBK_VARIANTS,slug));
    const source = parseNbkVisa(read(),slug);
    assert.ok(source,slug); assert.equal(source.annualFee,amount); assert.equal(source.ids.length,8);
    assert.equal(source.kfsUrl,NBK_KFS); assert.equal(source.vatPolicy,"exclusive");
    assert.equal(source.annualFeeWaiver.year_one_waived,true);
    const card = cards.find(c=>c.slug===slug)!; assert.ok(card,slug);
    assert.deepEqual(card._fieldEvidence,source.evidence);
    assert.equal(card.annualFee.amount,source.annualFee);
    assert.equal(annualFeeLabel(card).qual,"year 2+");
    assert.match(annualFeeLabel(card).amount,/\+ VAT$/);
    assert.equal(card.eligibility.minSalary,null);
    assert.equal(card.joiningFee,undefined);
    assert.equal(card.welcomeBonus,"Welcome offer pending source review.");
    assert.equal(card.loyaltyProgram,undefined);
    assert.equal(finderEvidence(card).rewardPreference,null);
    assert.equal(finderEvidence(card).comparableAnnualFee,null);
    assert.equal(cardValueTerms(card,slug).laterFee,null);
    assert.equal(cardValueTerms(card,slug).firstFee,null);
    const row=idx.rows.find(r=>r.slug===slug)!;
    assert.equal(row.annualFee,null);
    assert.equal(firstYearAnnualFeeLabel(row),"Waived");
    assert.match(feeIndexAnnualFeeLabel(row),/\+ VAT from year two$/);
    assert.match(cardSearchMetadata(card).description,/\+ VAT from year two/);
  }
});

test("NBK parser fails closed on conflicting fees, tax labels, scope, invalid links and corrupted fixtures", () => {
  const slug="nbk-visa-classic";
  const edit=(suffix:string,fn:(s:string)=>string,repin=true) => {
    const rows=read(), v=rows.find((s:{id:string})=>s.id===(suffix==="nbk-kfs-vat"?suffix:slug+"-"+suffix));
    const before=v.text;v.text=fn(v.text);assert.notEqual(v.text,before);
    if(repin) v.fixtureTextSha256=hash(v.text);
    assert.equal(parseNbkVisa(rows,slug),null,suffix);
  };
  edit("product-fee",s=>s.replace("150","151"));
  edit("renewal",s=>s.replace("Classic","Gold"));
  edit("nbk-kfs-vat",s=>s.replace("Excluding","Including"));
  edit("application",s=>s.replace('"uae"','"kuwait"'));
  edit("kfs-link",s=>s.replace("%20","%XX"));
  edit("waiver",s=>s.replace("Free","Paid"),false);
  assert.equal(parseNbkVisa([...read(),read()[0]],slug),null);
  assert.equal(parseNbkVisa(read(),"nbk-family"),null);
});
