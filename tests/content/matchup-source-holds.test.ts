import { test } from "node:test";
import assert from "node:assert/strict";
import { cardMatchups } from "../../src/data/cardMatchups";

test("curated comparison copy does not contradict the held account/tier/merchant conditions", () => {
  const find = (left: string, right: string) => {
    const row = cardMatchups.find(m => m.left === left && m.right === right);
    assert.ok(row);
    return [row.deck, ...row.verdict].join(" ");
  };
  const wio = find("liv-cashback", "wio-credit");
  assert.doesNotMatch(wio, /with no salary floor|pays a higher flat rate on everything|Wio, on the numbers/);
  assert.match(wio, /Standard plan earns none/);
  assert.match(wio, /does not estimate either card/);
  const adcb = find("liv-cashback", "adcb-365-cashback");
  assert.doesNotMatch(adcb, /asks nothing|gates nothing|covers its fee comfortably|free flat-rate/);
  assert.match(adcb, /named providers and payment channels/);
  assert.match(adcb, /pending terms/);
  const mashreq = find("emirates-nbd-noon-one", "mashreq-cashback");
  assert.match(mashreq, /assigned-credit-limit restriction/);
  assert.match(mashreq, /withhold a generic return estimate/);
  assert.doesNotMatch(mashreq, /pays it anywhere/);
});
