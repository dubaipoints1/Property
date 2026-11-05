import test from "node:test";
import assert from "node:assert/strict";
import { boundedInteger, cardJourneyHref, cardJourneyParams, hasSalaryJourney, salaryJourneyHref, salaryJourneyParams, salaryJourneyReturnHref, salaryJourneyState } from "../../src/lib/readerJourneyState";

test("journey amounts accept only a bounded whole-number string", () => {
  for (const value of [null, "", "-1", "1.5", "15,000", "1e3", "12abc", " 20", "01", "1000001", "Infinity"]) assert.equal(boundedInteger(value), undefined);
  assert.equal(boundedInteger("0"), 0);
  assert.equal(boundedInteger("12345"), 12345);
  assert.equal(boundedInteger("1000000"), 1000000);
});

test("card profile whitelist preserves filters, selected cards and explicit spend without unrelated query data", () => {
  const out = cardJourneyParams(new URLSearchParams("salary=20000&spend=dining&prefer=cashback&cv_spend=12345&via=finder&network=Visa&cards=citi-cashback,wio-credit&cards=citi-cashback&email=private@example.com&redirect=//evil.test"));
  assert.equal(out.get("salary"), "20000"); assert.equal(out.get("cv_spend"), "12345");
  assert.equal(out.get("spend"), "dining"); assert.equal(out.get("cards"), "citi-cashback,wio-credit");
  assert.equal(out.get("email"), null); assert.equal(out.get("redirect"), null);
  assert.equal(cardJourneyParams(new URLSearchParams("salary=20000&salary=50000&cv_spend=10&cv_spend=20&network=visa&prefer=made-up")).size, 0);
});

test("card handoff keeps each comparison's explicit selection, canonicalises context and refuses external or unrelated paths", () => {
  const state = new URLSearchParams("cards=wio-credit&cv_spend=12345&via=finder");
  const target = new URL(cardJourneyHref("/cards/compare/?cards=citi-cashback", state), "https://dubaipoints.ae");
  assert.equal(target.searchParams.get("cards"), "citi-cashback"); assert.equal(target.searchParams.get("cv_spend"), "12345");
  assert.match(cardJourneyHref("/cards/citi-cashback/#fees", state), /#fees$/);
  for (const href of ["//evil.test/cards/", "https://evil.test/cards/", "javascript:alert(1)", "/salary-transfer/", "/cards/../../outside/"]) assert.equal(cardJourneyHref(href, state), href);
});

test("card selections are unique, limited and cannot become markup or a path", () => {
  const out = cardJourneyParams(new URLSearchParams("cards=one,two,one,three,four,five&cards=../escape,<script>"));
  assert.equal(out.get("cards"), "one,two,three,four");
});

test("salary journey is explicit navigation context, not an inferred exact salary", () => {
  const state = salaryJourneyState(new URLSearchParams("st_band=aed-15000-to-30000&st_cash=true&st_no_card=true&st_sharia=true&st_sort=expiry&st_offer=dib-xtra-2026&st_return=aed-15000-to-30000"));
  assert.equal(state.salary, undefined); assert.equal(state.band, "aed-15000-to-30000"); assert.equal(state.cash, true); assert.equal(state.noCard, true);
  const url = new URL(salaryJourneyReturnHref(state), "https://dubaipoints.ae");
  assert.equal(url.pathname, "/salary-transfer/aed-15000-to-30000/"); assert.equal(url.searchParams.get("st_offer"), "dib-xtra-2026");
  assert.equal(url.searchParams.has("st_salary"), false);
});

test("salary context rejects unknown, repeated and external return values and preserves valid calculator choices", () => {
  const state = salaryJourneyState(new URLSearchParams("st_band=madeup&st_return=//evil.test&st_offer=../bad&st_salary=25000&st_products=credit_card,loan,loan,unknown&st_stay=false&st_cash=true&st_cash=false"));
  assert.equal(state.band, undefined); assert.equal(state.returnBand, undefined); assert.equal(state.offer, undefined); assert.equal(state.cash, false);
  assert.equal(state.salary, 25000); assert.deepEqual(state.products, ["credit_card", "loan"]); assert.equal(state.stay, false);
  const out = salaryJourneyParams(state);
  assert.equal(out.get("st_products"), "credit_card,loan"); assert.equal(out.get("st_stay"), "false");
  assert.ok(salaryJourneyReturnHref(state).startsWith("/salary-transfer/?"));
  const decimal = salaryJourneyState(new URLSearchParams("st_salary=17500.50"));
  assert.equal(decimal.salary, 17500.5);
  assert.equal(salaryJourneyParams(decimal).get("st_salary"), "17500.5");
  for (const value of ["-1", "1e3", "1000001", "123abc", "10.555"]) assert.equal(salaryJourneyState(new URLSearchParams({ st_salary: value })).salary, undefined);
});

test("salary handoff stays within the local salary routes and preserves a safe fragment", () => {
  const state = salaryJourneyState(new URLSearchParams("st_band=aed-5000-to-8000&st_sort=expiry"));
  assert.equal(salaryJourneyHref("/salary-transfer/#methodology", state), "/salary-transfer/?st_band=aed-5000-to-8000&st_sort=expiry#methodology");
  for (const href of ["//evil.test/", "https://evil.test/", "/cards/", "/salary-transfer/../../else/"]) assert.equal(salaryJourneyHref(href, state), href);
});

test("all-band filter and invalid salary attempts are journeys, unknown names alone are not", () => {
  assert.equal(hasSalaryJourney(new URLSearchParams("st_cash=true")), true);
  assert.equal(hasSalaryJourney(new URLSearchParams("st_salary=invalid")), true);
  assert.equal(hasSalaryJourney(new URLSearchParams("st_unknown=anything&st_band=madeup")), false);
  assert.equal(hasSalaryJourney(new URLSearchParams()), false);
});
