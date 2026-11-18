import { test } from "node:test";
import assert from "node:assert/strict";
import { daysToSalaryOfferEnd, salaryOfferWindow } from "../../src/lib/salaryTransferWindow.ts";

const offer = { validFrom: new Date("2026-12-10"), validUntil: new Date("2026-12-24") };

test("the first campaign day starts at 00:00 in Dubai, not UTC", () => {
  assert.equal(salaryOfferWindow(offer, new Date("2026-12-09T19:59:59.999Z")), "upcoming");
  assert.equal(salaryOfferWindow(offer, new Date("2026-12-09T20:00:00.000Z")), "live");
});

test("the end day is inclusive across the entire Dubai day", () => {
  assert.equal(salaryOfferWindow(offer, new Date("2026-12-24T19:59:59.999Z")), "live");
  assert.equal(salaryOfferWindow(offer, new Date("2026-12-24T20:00:00.000Z")), "lapsed");
});

test("archived and inverted/date-invalid campaigns are never live", () => {
  const now = new Date("2026-12-15");
  assert.equal(salaryOfferWindow({ ...offer, archived: true }, now), "archived");
  assert.equal(salaryOfferWindow({ ...offer, validFrom: new Date("2027-01-01") }, now), "invalid");
  assert.equal(salaryOfferWindow({ ...offer, validUntil: new Date("invalid") }, now), "invalid");
});

test("the countdown distinguishes tomorrow, today and ended using Dubai dates", () => {
  const end = offer.validUntil.toISOString();
  assert.equal(daysToSalaryOfferEnd(end, new Date("2026-12-23T19:59:00Z")), 1);
  assert.equal(daysToSalaryOfferEnd(end, new Date("2026-12-23T20:00:00Z")), 0);
  assert.equal(daysToSalaryOfferEnd(end, new Date("2026-12-24T20:00:00Z")), -1);
});
