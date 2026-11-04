import assert from "node:assert/strict";
import test from "node:test";
import snapshot from "../../src/data/travel-evidence/etihad-auh-mct-2026-11-25.json";
import { etihadMuscatFare, parseEtihadFareEvidence } from "../../src/lib/etihadFareEvidence";

test("Etihad quote parses the baggage-matched Value fare, not a headline price", () => {
  assert.deepEqual(etihadMuscatFare, {
    flight: "EY 696", cashAed: 615, miles: 10_000, awardFeesAed: 135, checkedBagKg: 25,
    checkedOn: "2026-11-04", travelDate: "2026-11-25", source: snapshot.publicSource,
  });
});

test("a changed cabin-fare label, mismatched allowance or malformed amount fails closed", () => {
  for (const replacement of [
    { cashFareText: snapshot.cashFareText.replace(/^Value/, "Basic") },
    { awardFareText: snapshot.awardFareText.replace("25kg", "30kg") },
    { awardFareText: snapshot.awardFareText.replace("10,000", "10,00") },
  ]) assert.throws(() => parseEtihadFareEvidence({ ...snapshot, ...replacement }), /no longer supports/);
});
