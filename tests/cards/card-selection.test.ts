import { test } from "node:test";
import assert from "node:assert/strict";
import { eligibleForSalaryFilter, MAX_CARD_SELECTION, normaliseCardSelection, readCardSelection, setCardSelection, updateCardSelection } from "../../src/lib/cardSelection";
import { cardFinderState, cardJourneyHref, clearCardFilters, withoutCardFilter } from "../../src/lib/readerJourneyState";

const known = new Set(["one", "two", "three", "four", "five"]);
test("selection is deliberate, known, ordered, unique and capped at four", () => {
  assert.equal(MAX_CARD_SELECTION, 4);
  assert.deepEqual(readCardSelection(new URLSearchParams(), known), []);
  assert.deepEqual(readCardSelection(new URLSearchParams("cards=unknown,two,one&cards=two,three,four,five"), known), ["two", "one", "three", "four"]);
  assert.deepEqual(normaliseCardSelection(["unknown", "two", "two", "one"], known), ["two", "one"]);
  let selection = updateCardSelection([], "two", true, known);
  selection = updateCardSelection(selection, "one", true, known);
  selection = updateCardSelection(selection, "three", true, known);
  selection = updateCardSelection(selection, "four", true, known);
  assert.deepEqual(updateCardSelection(selection, "five", true, known), selection);
  assert.deepEqual(updateCardSelection(selection, "one", false, known), ["two", "three", "four"]);
  assert.deepEqual(updateCardSelection(selection, "unknown", true, known), selection);
});

test("selection removal and round trips preserve filters and explicit zero example", () => {
  const source = new URLSearchParams("salary=20000&spend=dining&cv_spend=0&via=finder&cards=one,two&email=private@example.test");
  const state = setCardSelection(source, ["two", "three"], known);
  assert.deepEqual(readCardSelection(state, known), ["two", "three"]);
  assert.equal(state.get("salary"), "20000"); assert.equal(state.get("cv_spend"), "0");
  assert.equal(state.get("email"), null);
  const removed = setCardSelection(state, [], known);
  assert.equal(removed.has("cards"), false); assert.equal(removed.get("spend"), "dining");
  const target = new URL(cardJourneyHref("/cards/compare/?cards=four,unknown#fees", state, known), "https://dubaipoints.ae");
  assert.equal(target.searchParams.get("cards"), "four"); assert.equal(target.hash, "#fees");
});

test("applied filter parsing rejects ambiguous scalars and removes only the intended key", () => {
  const invalid = cardFinderState(new URLSearchParams("salary=12abc&salary=50000&network=visa&prefer=other"));
  assert.equal(invalid.salary, undefined); assert.equal(invalid.network, "any"); assert.equal(invalid.prefer, "none");
  const source = new URLSearchParams("salary=20000&spend=travel&fee=under-500&cards=two,one&cv_spend=10000&via=finder");
  const removed = withoutCardFilter(source, "salary", known);
  assert.equal(removed.has("salary"), false); assert.equal(removed.get("fee"), "under-500");
  assert.equal(removed.get("cards"), "two,one"); assert.equal(removed.get("cv_spend"), "10000");
  const clear = clearCardFilters(source, known);
  assert.equal(clear.has("fee"), false); assert.equal(clear.has("spend"), false);
  assert.equal(clear.get("cards"), "two,one"); assert.equal(clear.get("cv_spend"), "10000");
});

test("only explicit eligibility pending/conflict flags block salary-qualified results", () => {
  assert.equal(eligibleForSalaryFilter({ eligibility: "needs-review" }, 5000), false);
  assert.equal(eligibleForSalaryFilter({ eligibility: "editor-confirmed", "eligibility.minSalary": "needs-review" }, 5000), false);
  assert.equal(eligibleForSalaryFilter({ eligibility: "scraped" }, 5000), true);
  assert.equal(eligibleForSalaryFilter({ eligibility: "editor-corrected" }, 5000), true);
  for (const key of ["eligibility.salaryTransferRequired", "eligibility.residencyRequired", "eligibility.employmentTypes"])
    assert.equal(eligibleForSalaryFilter({ eligibility: "editor-confirmed", [key]: "needs-review" }, 5000), false, key);
  assert.equal(eligibleForSalaryFilter(undefined, 5000), true);
  for (const unknown of [null, undefined, NaN, Infinity, -1]) assert.equal(eligibleForSalaryFilter({ eligibility: "editor-confirmed" }, unknown), false);
  assert.equal(eligibleForSalaryFilter({ eligibility: "editor-confirmed" }, 0), true, "A source-confirmed zero differs from an unknown minimum");
});
