import test from "node:test";
import assert from "node:assert/strict";
import { parseEnbdProductNumber, parseEnbdKfsFees } from "../../scripts/scrape/_enbd-refresh.ts";

test("ENBD named product parser ignores navigation and related products", () => {
  const text = "Minimum salary: AED 99,000\n# Test Card\nMinimum salary: AED 12,000\n#### Other credit cards\nMinimum salary: AED 5,000";
  const result = parseEnbdProductNumber(text, "Test Card", /Minimum salary: AED ([\d,]+)/);
  assert.equal(result.status, "parsed");
  if (result.status === "parsed") {
    assert.equal(result.values[0].value, 12000);
    assert.equal(result.values[0].span.firstLine, 3);
    assert.equal(text.slice(result.values[0].span.start, result.values[0].span.end), result.values[0].span.rawText);
  }
});
test("ENBD product parser accepts identical duplicate evidence, not contradictory fees", () => {
  const prefix = "# Test Card\nAnnual fees: AED 525\n";
  assert.equal(parseEnbdProductNumber(prefix + "Annual fees: AED 525", "Test Card", /Annual fees: AED ([\d,]+)/).status, "parsed");
  assert.deepEqual(parseEnbdProductNumber(prefix + "Annual fees: AED 735", "Test Card", /Annual fees: AED ([\d,]+)/), {status: "hold", reason: "Conflicting duplicate numeric rows"});
});
test("ENBD product parser refuses missing or ambiguous product identity", () => {
  assert.equal(parseEnbdProductNumber("# Other Card\nMinimum salary: AED 5,000", "Test Card", /AED ([\d,]+)/).status, "hold");
  assert.equal(parseEnbdProductNumber("# Test Card\nAED 5,000\n# Test Card\nAED 5,000", "Test Card", /AED ([\d,]+)/).status, "hold");
});
test("ENBD numeric parse refuses malformed grouping rather than guessing", () => {
  assert.equal(parseEnbdProductNumber("# Test Card\nAnnual fees: AED 1,50", "Test Card", /Annual fees: AED ([\d,]+)/).status, "hold");
});
test("ENBD absent salary/number is a hold, never a zero or no-transfer inference", () => {
  assert.equal(parseEnbdProductNumber("# Test Card\nExisting Priority Banking customers only", "Test Card", /Minimum salary: AED ([\d,]+)/).status, "hold");
});
test("ENBD KFS parser refuses absent or unsupported documents", () => {
  assert.equal(parseEnbdKfsFees("Key Facts Statement\n09/2026").status, "hold");
  assert.equal(parseEnbdKfsFees("08/2026").status, "hold");
  assert.equal(parseEnbdKfsFees("Key Facts Statement\nJoining\n08/2026").status, "hold");
});

// Synthetic numbers, not issuer quotes or a financial fixture. Exact header
// order is the contract under test; full issuer source remains private.
const headers = [
  "Skywards Infinite SHARE Private SHARE Infinite UBE Infinite Darna Infinite Privilege Darna Infinite Marriott Bonvoy World Elite Marriott Bonvoy World Infinite",
  "Priority Banking Infinite Voyager World Elite Voyager World Etihad Guest Limitless/Elevate dnata World Skywards Signature SHARE Signature Etihad Guest Inspire Darna Signature",
  "UBE Signature Visa Flexi Lulu 247 Platinum Darna Select Lulu 247 Titanium noon One Duo dnata Platinum Platinum Go4it Platinum Go4it Gold SHARE Platinum",
  "UBE Family Titanium Man United Business Rewards Business Card Webshopper Chairman Card",
];
const syntheticKfs = () => "Key Facts Statement\n" + [0, 1].flatMap(section => headers.map((h, row) => {
  const tokens = Array.from({length: [9, 9, 12, 7][row]}, (_, col) => row === 1 && col === 6 ? "Free" : String((section + 1) * 100 + row * 10 + col));
  return (row === 1 ? (section === 0 ? "Joining " : "Renewal ") : "") + h + "\n" + (row === 1 ? "Fee (AED) " : "") + tokens.join("  ");
})).join("\n") + "\n08/2026";

test("ENBD KFS maps named columns and explicit Free without confusing generic tiers", () => {
  const text = syntheticKfs();
  const result = parseEnbdKfsFees(text);
  assert.equal(result.status, "parsed");
  if (result.status === "parsed") {
    assert.equal(result.fees.length, 56);
    assert.equal(result.fees.find(x => x.slug === "emirates-nbd-share-visa-signature" && x.field === "joiningFee")?.amount, 0);
    assert.equal(result.fees.find(x => x.slug === "emirates-nbd-share-visa-infinite" && x.field === "joiningFee")?.amount, 102);
    assert.equal(result.fees.some(x => x.slug === "emirates-nbd-diners-club" || x.slug === "emirates-nbd-mastercard-platinum"), false);
    for (const fee of result.fees) assert.equal(text.slice(fee.span.start, fee.span.end), fee.span.rawText);
  }
});
test("ENBD KFS refuses reordered names, changed token counts and malformed money", () => {
  const text = syntheticKfs();
  assert.equal(parseEnbdKfsFees(text.replace("SHARE Private SHARE Infinite", "SHARE Infinite SHARE Private")).status, "hold");
  assert.equal(parseEnbdKfsFees(text.replace("100  101  102", "100  102")).status, "hold");
  assert.equal(parseEnbdKfsFees(text.replace("100  101", "1,50  101")).status, "hold");
});
