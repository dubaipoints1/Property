// The 2026-07-29 amendment permits AI imagery for illustration and
// bans it for documentation. `bannedSubjects()` is the tripwire on the
// generation side; these cases pin the line so a later prompt-guard
// edit can't quietly widen what the script will produce.
//
// Run: node --import tsx --test tests/images/ai-subject-guard.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { bannedSubjects } from "../../scripts/images/generate-ai";

test("refuses card art and product plastic", () => {
  assert.ok(bannedSubjects("photorealistic credit card art on a marble desk").length > 0);
  assert.ok(bannedSubjects("close-up of card plastic, metallic finish").length > 0);
});

test("refuses named carriers, hotels and banks", () => {
  assert.ok(bannedSubjects("Emirates first class suite interior").length > 0);
  assert.ok(bannedSubjects("Marriott lobby in Dubai Marina").length > 0);
  assert.ok(bannedSubjects("Emirates NBD branch counter").length > 0);
});

test("refuses documents, people and landmark records", () => {
  assert.ok(bannedSubjects("a bank statement on a table").length > 0);
  assert.ok(bannedSubjects("photorealistic woman using a banking app").length > 0);
  assert.ok(bannedSubjects("Burj Khalifa at dusk").length > 0);
});

test("refuses brand marks outright", () => {
  assert.ok(bannedSubjects("minimal wordmark for a rewards programme").length > 0);
});

test("allows generic conceptual illustration", () => {
  const clean = [
    "flat editorial illustration, abstract currency exchange, warm paper background, navy and gold",
    "unbranded airport gate seating at dawn, muted illustration",
    "geometric illustration of a rising line chart, editorial style",
    "generic city skyline silhouette at sunset, flat vector treatment",
  ];
  for (const prompt of clean) {
    assert.deepEqual(bannedSubjects(prompt), [], `should allow: ${prompt}`);
  }
});

test("reports every reason, not just the first", () => {
  const reasons = bannedSubjects("Emirates credit card art beside a Marriott lobby");
  assert.ok(reasons.length >= 3, `expected multiple reasons, got ${reasons.length}`);
});
