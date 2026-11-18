import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdibSmilesDisclosure } from "../../scripts/scrape/_adib-smiles-disclosure.ts";
import { loadAdibMappingSources } from "../../scripts/scrape/propose-adib-primary.ts";
import { parseMinSalary } from "../../scripts/scrape/_lib.ts";
import { proposeAdibProfile } from "../../scripts/scrape/_adib-primary.ts";
import { getCardData } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";

const sha = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");
const sources = loadAdibMappingSources();
const tariff = sources.find(s => s.id === "adib-soc")!;
const terms = sources.find(s => s.id === "adib-terms-v31")!;
const mdx = readFileSync("src/content/cards/adib-smiles-visa-signature.mdx", "utf8");

test("Smiles issuer evidence maps the exact two tariff rows and two welcome award cohorts", () => {
  const out = parseAdibSmilesDisclosure(tariff, terms);
  assert.ok(out);
  assert.equal(out.scope, "detail-page-only");
  assert.equal(out.comparableFxRate, null);
  assert.deepEqual([out.nonAedFee.rate, out.intlAedFee.rate, out.vatDefault], [2.3, 2.75, 5]);
  assert.deepEqual([out.welcome.nonSelfFundedPoints, out.welcome.selfFundedPoints, out.welcome.daysFromReceipt], [70000, 42000, 30]);
  assert.deepEqual([out.nonAedFee.evidence, out.intlAedFee.evidence, ...out.tariffNotes].map(p => [p.firstLine, p.lastLine]), [[42, 42], [43, 43], [76, 76], [78, 80]]);
  assert.deepEqual(out.welcome.evidence.map(p => [p.firstLine, p.lastLine]), [[1984, 1985], [1989, 1990], [1991, 1992], [2005, 2021], [2029, 2043]]);
  for (const [s, pins] of [
    [tariff, [out.nonAedFee.evidence, out.intlAedFee.evidence, ...out.tariffNotes]],
    [terms, out.welcome.evidence],
  ] as const) {
    for (const p of pins) assert.equal(sha(Buffer.from(s.text).subarray(p.firstByte, p.pastLastByte)), p.rawTextSha256);
  }
});

test("Smiles extraction fails closed on source drift or accidental tier substitution", () => {
  const wrongTier = terms.text.replace("21.2.4.2 Self-funded ADIB Smiles Visa Signature cardholders", "21.2.4.2 Self-funded ADIB Smiles Visa Platinum cardholders");
  assert.equal(parseAdibSmilesDisclosure(tariff, { ...terms, text: wrongTier, fixtureTextSha256: sha(wrongTier), sourceTextSha256: sha(wrongTier) }), null);
  assert.equal(parseAdibSmilesDisclosure({ ...tariff, sourceBodySha256: "0".repeat(64) }, terms), null);
  assert.equal(parseAdibSmilesDisclosure(tariff, { ...terms, url: "https://example.com/terms.pdf" }), null);
});

test("Smiles detail discloses both scoped outcomes without changing the canonical holds", () => {
  const out = parseAdibSmilesDisclosure(tariff, terms)!;
  const afterFee = mdx.split('id="adib-smiles-fx-terms"')[1]!;
  const [fee, welcome] = afterFee.split('id="adib-smiles-welcome-terms"');
  for (const rate of [out.nonAedFee.rate, out.intlAedFee.rate]) assert.ok(fee.includes(`${rate}% before applicable VAT`));
  assert.match(fee, /wording does not clearly distinguish/);
  for (const points of [out.welcome.nonSelfFundedPoints, out.welcome.selfFundedPoints]) assert.ok(welcome.includes(`${points.toLocaleString("en-GB")} Smiles Points`));
  assert.ok(welcome.includes(`${out.welcome.daysFromReceipt} days of receiving the card`));
  const card = JSON.parse(readFileSync("src/data/cards.json", "utf8"))["adib-smiles-visa-signature"];
  assert.equal(card.fxFee, null);
  assert.equal(card._provenance.fxFee, "needs-review");
  assert.equal(card._provenance.welcomeBonus, "needs-review");
  assert.equal(card.welcomeBonusValue, undefined);
});

test("Classic rates map its named tariff column and its own funding awards without flattening them", () => {
  const out = parseAdibSmilesDisclosure(tariff, terms, "adib-smiles-visa-classic");
  assert.ok(out);
  assert.equal(out.comparableFxRate, null);
  assert.deepEqual([out.nonAedFee.rate, out.intlAedFee.rate, out.vatDefault], [2.3, 2.75, 5]);
  assert.deepEqual([out.welcome.nonSelfFundedPoints, out.welcome.selfFundedPoints, out.welcome.daysFromReceipt], [5000, 2500, 30]);
  assert.deepEqual(out.welcome.evidence.map(p => [p.firstLine, p.lastLine]), [[1984, 1985], [2001, 2002], [2003, 2004], [2005, 2021], [2029, 2043]]);
  for (const p of out.welcome.evidence)
    assert.equal(sha(Buffer.from(terms.text).subarray(p.firstByte, p.pastLastByte)), p.rawTextSha256);
  const text = readFileSync("src/content/cards/adib-smiles-visa-classic.mdx", "utf8");
  for (const points of [out.welcome.nonSelfFundedPoints, out.welcome.selfFundedPoints])
    assert.ok(text.includes(`${points.toLocaleString("en-GB")} Smiles Points`));
  const classic = getCardData("adib-smiles-visa-classic")!;
  assert.equal(classic.fxFee, null);
  assert.equal(classic._provenance.fxFee, "needs-review");
  assert.equal(classic._provenance.welcomeBonus, "needs-review");
  assert.equal(classic.welcomeBonusValue, undefined);
});

test("ADIB income floors replay exact issuer lines and do not enter salary-qualified matching", () => {
  for (const slug of ["adib-smiles-visa-classic", "adib-smiles-visa-signature"]) {
    const c = getCardData(slug)!;
    const evidence = c._fieldEvidence?.["eligibility.publishedMinMonthlyIncome"]?.[0];
    assert.ok(evidence);
    assert.equal(sha(evidence.rawText), evidence.rawTextSha256);
    assert.equal(parseMinSalary(evidence.rawText), c.eligibility.publishedMinMonthlyIncome);
    assert.equal(c.eligibility.minSalary, null);
    assert.equal(c._provenance.eligibility, "needs-review");
    assert.equal(hasUsableSalaryMinimum(c), false);
  }
  const listing = sources.find(s => s.id === "ADIB Smiles Visa Classic Card")!;
  const kfs = sources.find(s => s.id === "adib-kfs")!;
  const parsed = proposeAdibProfile(listing, tariff, kfs, "adib-smiles-visa-classic");
  assert.ok(parsed && "annualFee" in parsed);
  const classic = getCardData("adib-smiles-visa-classic")!;
  assert.equal(parsed.annualFee.amount, classic.annualFee.amount);
  assert.equal(classic._provenance.annualFee, "editor-confirmed");
  assert.equal(classic._provenance.joiningFee, "needs-review");
});
