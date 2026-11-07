import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const bank = (slug: string) => readFileSync(`src/content/banks/${slug}.mdx`, "utf8");

test("bank hubs do not resurrect withdrawn held card fees, rates or qualification promises", () => {
  assert.doesNotMatch(bank("dib"), /3\.25%|the only headline gates/i);
  assert.match(bank("dib"), /payment-channel exclusions/);
  assert.match(bank("dib"), /finance-rate field remains pending/);
  assert.doesNotMatch(bank("wio"), /no annual card fee|free money on a payment|from 2\.49%|drops from 3\.25%/i);
  assert.match(bank("wio"), /not proof of a zero/);
  assert.doesNotMatch(bank("liv"), /FX fee is 1\.99%|the guaranteed floor is|Same 1\.99%/i);
  assert.match(bank("liv"), /general reward model is held/);
  assert.doesNotMatch(bank("emirates-nbd"), /salary, transfer required|salary\n\s+transfer required/i);
  assert.match(bank("emirates-nbd"), /earlier salary-transfer requirement is not treated as confirmed/i);
  assert.match(bank("emirates-islamic"), /Eligibility remains Pending/);
  assert.match(bank("fab"), /New invitations and\s+the applicable qualification route remain unconfirmed/);
  assert.match(bank("standard-chartered"), /earlier stored general\s+rate is held/);
});

test("archived account promotions do not become current card or campaign eligibility", () => {
  assert.doesNotMatch(bank("adcb"), /headline AED 12,000 figure|remaining product eligibility panels were not asserted read/);
  assert.match(bank("adcb"), /past combined salary-and-card\s+offer is not a standing benefit/);
  assert.match(bank("al-hilal"), /historical campaign is not\s+evidence that a current offer is available or absent/);
  assert.match(bank("rakbank"), /October example is not a standing offer/);
  for (const slug of ["dib", "cbd", "citi", "fab", "standard-chartered"]) {
    assert.doesNotMatch(bank(slug), /does\s+not\s+currently run a published,? year-round salary[-\s]+transfer cash/i, slug);
  }
});

test("bank hubs do not invent a universal missed-payment reporting deadline", () => {
  const files = readdirSync("src/content/banks").filter(name => name.endsWith(".mdx"));
  assert.equal(files.length, 15);
  for (const file of files) {
    const text = readFileSync(`src/content/banks/${file}`, "utf8");
    assert.doesNotMatch(text, /missed\s+payments?[^.!?]{0,90}within\s+30\s+days/i, file);
    assert.doesNotMatch(text, /reporting\s+within\s+30\s+days\s+of\s+any\s+missed\s+payment/i, file);
  }
});
