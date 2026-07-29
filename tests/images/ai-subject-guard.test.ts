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

// A guard that catches "logo" but waves "logos" through is not a
// guard. Every pluralisable banned noun is pinned in both forms.
test("plurals are caught, not just singulars", () => {
  const plurals = [
    "sheet of logos, flat vector",
    "collection of wordmarks",
    "grid of app screenshots",
    "stack of bank statements",
    "row of credit card faces",
    "portraits of savers",
    "receipts scattered on a table",
  ];
  for (const prompt of plurals) {
    assert.ok(bannedSubjects(prompt).length > 0, `should refuse: ${prompt}`);
  }
});

// "no logos, no text" is how an editor asks for clean art — it must
// not read as a request for a logo.
test("negative prompting does not trip the guard", () => {
  const negated = [
    "abstract editorial illustration, no logos, no text",
    "geometric composition without brand marks or wordmarks",
    "flat illustration of a rising line, avoid people and faces",
    "muted conceptual art, free of branding",
  ];
  for (const prompt of negated) {
    assert.deepEqual(bannedSubjects(prompt), [], `should allow: ${prompt}`);
  }
});

// Negation strips the clause it governs and nothing more — a banned
// subject elsewhere in the prompt still fires.
test("negation does not launder a banned subject stated positively", () => {
  assert.ok(bannedSubjects("Emirates business class cabin, no logos").length > 0);
  assert.ok(bannedSubjects("no text, photorealistic bank statement on a desk").length > 0);
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
