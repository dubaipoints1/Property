import { test } from "node:test";
import assert from "node:assert/strict";
import { hasCurrentApplicationProfile } from "../../src/lib/cardAvailability.ts";

test("unconfirmed availability is neither an active application route nor an invented closure", () => {
  const held = { applicationAvailability: "unconfirmed" as const };
  assert.equal(hasCurrentApplicationProfile(held), false);
  assert.equal('discontinuedForNewApplicants' in held, false);
  assert.equal(hasCurrentApplicationProfile({ discontinuedForNewApplicants: { date: "2025-01-01" } }), false);
  assert.equal(hasCurrentApplicationProfile({}), true);
});
