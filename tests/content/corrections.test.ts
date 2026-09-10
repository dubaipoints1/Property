import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  cardsCorrected,
  corrections,
  correctionsByDate,
  lastCorrectionDate,
} from "../../src/data/corrections.ts";
import { getAllCards } from "../../src/lib/cardsData.ts";

/**
 * The corrections log is one of the four things the 2026-06-12 ruling names
 * as this publication's trust posture — "claims about process the site can
 * actually demonstrate". It was hardcoded HTML with two hand-written entries
 * and no machine-readable dates, so nothing could count it or date it. These
 * tests keep it demonstrable.
 */

test("every entry states both what we published and what is true", () => {
  assert.ok(corrections.length > 0, "the log must not be empty");
  for (const c of corrections) {
    assert.ok(c.title.trim().length > 8, `${c.title}: needs a real title`);
    assert.ok(c.original.trim().length > 80, `${c.title}: original is too thin`);
    assert.ok(c.corrected.trim().length > 80, `${c.title}: correction is too thin`);
    assert.ok(c.cardsAffected.length > 0, `${c.title}: names no affected page`);
  }
});

test("dates are real, machine-readable and not in the future", () => {
  const now = new Date("2026-09-10");
  for (const c of corrections) {
    assert.ok(c.date instanceof Date, `${c.title}: date is not a Date`);
    assert.ok(!Number.isNaN(c.date.getTime()), `${c.title}: unparseable date`);
    assert.ok(c.date <= now, `${c.title}: dated in the future`);
  }
});

test("every card a correction names still exists", () => {
  // A correction pointing at a slug we no longer carry would render a dead
  // link inside the log that exists to prove we fix things.
  const known = new Set(getAllCards().map((c) => c.slug));
  for (const c of corrections) {
    for (const slug of c.cardsAffected) {
      assert.ok(known.has(slug), `${c.title}: ${slug} is not in cards.json`);
    }
  }
});

test("the log reads newest first and its derived counts are right", () => {
  const ordered = correctionsByDate();
  for (let i = 1; i < ordered.length; i += 1) {
    assert.ok(
      ordered[i - 1].date >= ordered[i].date,
      "correctionsByDate must return newest first",
    );
  }
  assert.equal(lastCorrectionDate()?.getTime(), ordered[0].date.getTime());
  const distinct = new Set(corrections.flatMap((c) => c.cardsAffected));
  assert.equal(cardsCorrected(), distinct.size);
});

test("the page renders the log from data rather than hardcoded prose", () => {
  // The failure this guards: someone adds an entry back into the markup, and
  // the count in the facts strip stops matching what the page shows.
  const page = readFileSync("src/pages/corrections.astro", "utf8");
  assert.match(page, /correctionsByDate\(\)/);
  assert.match(page, /corrections\.length/);
  assert.ok(
    !/<h3>\d{1,2} \w+ 20\d\d/.test(page),
    "a correction entry is hardcoded in the page markup again",
  );
});
