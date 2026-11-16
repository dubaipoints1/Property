import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdibSmilesDisclosure } from "../../scripts/scrape/_adib-smiles-disclosure.ts";
import { loadAdibMappingSources } from "../../scripts/scrape/propose-adib-primary.ts";

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
