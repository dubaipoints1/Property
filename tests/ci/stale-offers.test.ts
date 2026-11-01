// Stale-offer sweep — scripts/ci/check-stale-offers.mjs.
//
// The positive cases are the real sentences that sat live after their
// offers ended (found 1 November 2026). The negative cases are the real
// sentences that must NOT fire: the same facts written in the past tense,
// a provenance date, and a worked example.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findStaleOffers,
  applyAllowList,
  sentenceAround,
} from "../../scripts/ci/check-stale-offers.mjs";

const TODAY = new Date("2026-11-01T00:00:00Z");

test("flags the Etihad Guest programme-page sentence the day after the bonus ended", () => {
  const raw = [
    "Set per partner; check yours in the bank's rewards portal.",
    "",
    "Until 31 October 2026 those transfers carry a bonus: **10%** on a",
    "transfer worth up to 9,999 Miles, **20%** on 10,000–49,999 and **40%** on",
    "50,000 or more.",
  ].join("\n");
  const f = findStaleOffers(raw, TODAY);
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 3);
  assert.equal(f[0].date, "2026-10-31");
});

test("flags a bold date wrapped onto the next line (Qatar page)", () => {
  const raw = [
    "check them in your bank's rewards portal before converting. Until",
    "**31 October 2026** those conversions earn **15%** bonus Avios.",
  ].join("\n");
  const f = findStaleOffers(raw, TODAY);
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 1);
});

test("flags the FAB hub's parenthetical offer four months on", () => {
  const raw = "  up to another 55,000 on AED 100,000 spend in the first three months\n  (limited-time offer to 30 June 2026).";
  assert.equal(findStaleOffers(raw, TODAY).length, 1);
});

test("does not fire on the same facts written in the past tense", () => {
  for (const raw of [
    "Etihad's October 2026 points-exchange bonus **ended on 31 October\n2026**. It paid **10%**.",
    "The Amazon Gift Card promo captured here ran through **31 May 2026**.",
    "a 15% to 35% Avios bonus on conversions until it ended on 31 October 2026",
    "The offer page (read on 9 October 2026) lists the partners.",
  ]) {
    assert.deepEqual(findStaleOffers(raw, TODAY), [], raw);
  }
});

test("does not fire on a date that has not passed, and treats the named day as still running", () => {
  assert.deepEqual(findStaleOffers("Book by 13 December 2026 to qualify.", TODAY), []);
  assert.deepEqual(findStaleOffers("Valid until 1 November 2026.", TODAY), []);
  assert.equal(findStaleOffers("Valid until 31 October 2026.", TODAY).length, 1);
});

test("a blank line ends the sentence: a past marker in the next paragraph does not clear it", () => {
  const raw = "Transfers earn a bonus until 31 October 2026\n\nThe previous offer ended in June.";
  assert.equal(findStaleOffers(raw, TODAY).length, 1);
});

test("sentenceAround stays inside one sentence", () => {
  const t = "The bonus ended in June. Apply by 30 September 2026 for the voucher. It was popular.";
  const start = t.indexOf("by 30");
  assert.equal(sentenceAround(t, start, start + 17), "Apply by 30 September 2026 for the voucher.");
});

test("an allow entry drops only the matching file and sentence", () => {
  const findings = [
    { file: "a.mdx", sentence: "a validity period ending 15 January 2026, for a member" },
    { file: "b.mdx", sentence: "a validity period ending 15 January 2026, for a member" },
  ];
  const kept = applyAllowList(findings, [
    { file: "a.mdx", contains: "validity period ending 15 January 2026", reason: "worked example" },
  ]);
  assert.deepEqual(kept.map((f) => f.file), ["b.mdx"]);
});
