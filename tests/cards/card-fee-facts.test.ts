import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getCardData } from "../../src/lib/cardsData.ts";
import { formatAED } from "../../src/lib/cardsDataFormat.ts";
import { cardFeeAmountLabel, cardFeeNeedsReview, cardIllustrativeNetLabel, cardFxFeeLabel } from "../../src/lib/cardFeeFacts.ts";

const base = getCardData("liv-cashback-plus")!;
const flagged = (key: string) => ({ ...base, _provenance: { ...base._provenance, [key]: "needs-review" } });

test("fee labels and illustrative fee deductions retain the verified inclusive basis", () => {
  assert.equal(cardFeeAmountLabel(base), `${formatAED(base.annualFee.amount)} including VAT`);
  assert.equal(cardFeeAmountLabel(base, "joiningFee"), `${formatAED(base.joiningFee!.amount)} including VAT`);
  assert.equal(cardIllustrativeNetLabel(base, 720), formatAED(720 - base.annualFee.amount));
  assert.equal(cardFeeAmountLabel({...base, vatPolicy: "exclusive"}), `${formatAED(base.annualFee.amount)} + 5% VAT`);
  assert.throws(() => cardIllustrativeNetLabel({...base, vatPolicy: "exclusive"}, 720), /verified VAT-inclusive/);
});

test("parent and dotted fee provenance fail closed without mutating real card data", () => {
  for (const field of ["annualFee", "joiningFee"] as const) {
    for (const key of [field, `${field}.amount`]) {
      const card = flagged(key);
      assert.equal(cardFeeNeedsReview(card, field), true, key);
      assert.equal(cardFeeAmountLabel(card, field), "Pending", key);
      if (field === "annualFee") assert.throws(() => cardIllustrativeNetLabel(card, 720), /verified VAT-inclusive/, key);
    }
  }
  assert.equal(cardFeeNeedsReview(base, "annualFee"), false);
  assert.equal(cardFeeNeedsReview(base, "joiningFee"), false);
  assert.equal(cardFeeAmountLabel(flagged("joiningFee.amount")), cardFeeAmountLabel(base), "joining uncertainty does not change a renewal-only fee label");
});

test("a flagged VAT basis blocks both fee fields and the net example", () => {
  const card = flagged("vatPolicy");
  assert.equal(cardFeeAmountLabel(card, "annualFee"), "Pending");
  assert.equal(cardFeeAmountLabel(card, "joiningFee"), "Pending");
  assert.throws(() => cardIllustrativeNetLabel(card, 720), /verified VAT-inclusive/);
});

test("zero scraped annual fees remain unknown, while confirmed free or absent fees stay distinct", () => {
  const free = getCardData("liv-cashback")!;
  assert.equal(cardFeeAmountLabel(free), "Free");
  assert.equal(cardFeeAmountLabel(free, "joiningFee"), "Not listed");
  const unverifiedZero = {...free, _provenance: {...free._provenance, annualFee: "scraped"}};
  assert.equal(cardFeeAmountLabel(unverifiedZero), "Pending");
  assert.throws(() => cardIllustrativeNetLabel(unverifiedZero, 720), /verified VAT-inclusive/);
  for (const gross of [NaN, Infinity, -1]) assert.throws(() => cardIllustrativeNetLabel(base, gross), /non-negative/);
});

test("both Astro consumers use the tested guard-backed formatters", () => {
  const fee = readFileSync("src/components/cards/CardFeeAmount.astro", "utf8");
  const net = readFileSync("src/components/cards/CardIllustrativeNet.astro", "utf8");
  assert.match(fee, /const label = cardFeeAmountLabel\(card, field\)/);
  assert.match(net, /const net = cardIllustrativeNetLabel\(card, annualGross\)/);
});

test("issuer-only FX fee retains tax and additional-scheme qualifiers on every value surface", () => {
  const card = getCardData("hsbc-live-plus")!;
  const label = cardFxFeeLabel(card);
  assert.equal(card.fxFeeScope, "issuer-processing-only");
  assert.match(label, /issuer processing fee including VAT; scheme charges may also apply/);
  assert.equal(cardFxFeeLabel({ ...card, _provenance: { fxFee: "needs-review" } }), "Pending");
  for (const file of ["src/pages/cards/cashback.astro", "src/pages/cards/islamic.astro", "src/pages/cards/miles.astro", "src/pages/cards/salary/[point].astro", "src/pages/cards/fees.astro", "src/pages/index.astro", "src/components/cards/FeeBlock.astro", "src/layouts/CardReviewLayout.astro"])
    assert.match(readFileSync(file, "utf8"), /cardFxFeeLabel\(/, file);
  const scenario = readFileSync("src/components/cards/CardValueScenario.astro", "utf8");
  assert.match(scenario, /foreign-currency charges aren’t included/);
});
