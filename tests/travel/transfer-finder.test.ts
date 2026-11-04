import assert from "node:assert/strict";
import test from "node:test";
import {
  parseTransferBlockBonus, parseTransferMinimum, parseTransferOfferDate, parseTransferOfferRate,
  parseTransferRatio, parseTransferTiming,
} from "../../scripts/scrape/_transfer-rates";
import { transferOffer, transferRoutes } from "../../src/lib/transferFinder";
import { isUaeOfferWindow } from "../../src/lib/uaeOfferWindow";

test("transfer parsing is directional and restricted to reviewed conversion formats", () => {
  assert.deepEqual(parseTransferRatio("12 FAB Al-Futtaim Rewards = 1 Skywards Mile"), { input: 12, output: 1 });
  assert.deepEqual(parseTransferRatio("10,000 EI SmartMiles | → | 1,750 Qatar Airways Privilege Club Avios"), { input: 10_000, output: 1_750 });
  assert.deepEqual(parseTransferRatio("Qatar Airways Privilege Club | 3:1"), { input: 3, output: 1 });
  assert.deepEqual(parseTransferRatio("22 TPs to 1 Mile"), { input: 22, output: 1 });
  for (const malformed of ["Save 12% on 1 flight", "10,00 points = 1 mile", "0 points = 3 miles", "Offer 1:1", "12 points = 1 mile until 2025"]) {
    assert.equal(parseTransferRatio(malformed), null);
  }
});

test("ratio input is not a minimum unless explicitly evidenced", () => {
  assert.equal(parseTransferMinimum("16 FAB Rewards = 1 Skywards Mile"), null);
  assert.equal(parseTransferMinimum("Minimum conversion: 4,000 Reward points = 2,000 Skywards Miles"), 4_000);
  assert.equal(parseTransferMinimum("minimum of 500 points"), 500);
  assert.equal(parseTransferTiming("account real-time"), "instant");
  assert.deepEqual(parseTransferTiming("within 7 working days"), { workingDays: 7 });
  assert.deepEqual(parseTransferTiming("within 48 hours"), { hours: 48 });
  assert.equal(parseTransferTiming("from 1 to 7 days"), null);
  assert.deepEqual(parseTransferBlockBonus("5,000 bonus Skywards Miles for every 60,000 points transferred"), { extraMiles: 5_000, inputPoints: 60_000 });
});

test("Finder retains programme-specific ratios, minimums and disputed routes", () => {
  const route = (id: string) => {
    const hit = transferRoutes.find((row) => row.id === id);
    assert.ok(hit, id);
    return hit;
  };
  assert.equal(transferRoutes.length, 16);
  assert.equal(new Set(transferRoutes.map(({ id }) => id)).size, transferRoutes.length);
  assert.equal(route("fab-rewards-skywards").ratio?.input, 16);
  assert.equal(route("fab-al-futtaim-skywards").ratio?.input, 12);
  assert.equal(route("adcb-touchpoints-skywards").minimum, 22_000);
  assert.equal(route("enbd-plus-skywards").minimum, 500);
  assert.equal(route("enbd-plus-qatar-privilege-club").minimum, null);
  assert.equal(route("enbd-plus-qatar-privilege-club").ratio, null);
  assert.equal(route("ei-flex-etihad-guest").ratio, null);
  assert.equal(route("ei-flex-etihad-guest").sources.length, 2);
  assert.equal(route("all-accor-skywards").ratio?.output, 2_000);
  assert.equal(route("marriott-bonvoy-skywards").minimum, 3_000);
  assert.deepEqual(route("marriott-bonvoy-skywards").timing, { hours: 48 });
  assert.ok(transferRoutes.every(({ sources, checked }) => sources.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(checked)));
});

test("the timed bonus remains separate and ends on the final UAE calendar day", () => {
  assert.equal(parseTransferOfferRate("25% bonus Miles"), 25);
  assert.equal(parseTransferOfferDate("until 30 November 2026"), "2026-11-30");
  assert.equal(parseTransferOfferDate("until 31 November 2026"), null);
  assert.equal(parseTransferOfferDate("29 February 2025"), null);
  const activeAt = (iso: string) => isUaeOfferWindow(transferOffer.announced, transferOffer.ends, Date.parse(iso));
  assert.equal(activeAt("2026-10-28T19:59:59Z"), false);
  assert.equal(activeAt("2026-10-28T20:00:00Z"), true);
  assert.equal(activeAt("2026-11-30T19:59:59Z"), true);
  assert.equal(activeAt("2026-11-30T20:00:00Z"), false);
});
