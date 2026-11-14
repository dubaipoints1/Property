import test from "node:test";
import assert from "node:assert/strict";
import { resolveReaderJourney, type ReaderCatalogue, type ReaderGuide } from "../../src/lib/readerJourneys.ts";

const guide = (id: string, cards: string[] = [], programmes: string[] = [], date = "2026-01-01"): ReaderGuide => ({
  id, title: `Guide ${id}`, cards, programmes, updatedAt: new Date(date),
});
const catalogue: ReaderCatalogue = {
  cards: [
    { id: "card-a", name: "Card A", bank: "bank-a" },
    { id: "card-b", name: "Card B", bank: "bank-b" },
    { id: "card-c", name: "Card C", bank: "bank-a" },
    { id: "card-d", name: "Card D", bank: "bank-a" },
    { id: "card-e", name: "Card E", bank: "bank-b" },
  ],
  programmes: [
    { id: "skywards", name: "Emirates Skywards", href: "/airlines/skywards/" },
    { id: "marriott-bonvoy", name: "Marriott Bonvoy", href: "/hotels/marriott-bonvoy/" },
  ],
  banks: [{ id: "bank-a", name: "Bank A" }, { id: "bank-b", name: "Bank B" }],
  guides: [
    guide("card-guide", ["card-a"]),
    guide("programme-guide", [], ["skywards"]),
    guide("same-bank-guide", ["card-c"]),
    guide("unrelated-newest", [], [], "2026-11-01"),
  ],
};

test("a story without references gets no invented relationship or action", () => {
  const result = resolveReaderJourney({ section: "news", id: "publication-note" }, catalogue);
  assert.deepEqual(result, { actions: [], relatedGuides: [] });
});

test("a programme story points to the canonical hotel or airline route", () => {
  const result = resolveReaderJourney({ section: "news", id: "story", programmes: ["marriott-bonvoy", "skywards"] }, catalogue);
  assert.deepEqual(result.actions.map((a) => a.href), ["/hotels/marriott-bonvoy/", "/airlines/skywards/"]);
  assert.equal(result.relatedGuides[0].id, "programme-guide");
  assert.ok(!result.relatedGuides.some((g) => g.id === "unrelated-newest"));
});

test("programme overlap outranks unrelated freshness and bank-only overlap", () => {
  const result = resolveReaderJourney({ section: "news", id: "story", programmes: ["skywards"], banks: ["bank-a"] }, catalogue);
  assert.deepEqual(result.relatedGuides.map((g) => g.id), ["programme-guide", "card-guide"]);
});

test("one mentioned active card links to its own review, not a guessed rival", () => {
  const result = resolveReaderJourney({ section: "news", id: "change", cards: ["card-a"] }, catalogue);
  assert.deepEqual(result.actions[0], { href: "/cards/card-a/", label: "Read the Card A review", kind: "card" });
  assert.equal(result.actions[1].href, "/banks/bank-a/");
});

test("comparison carries at most four unique explicit card references in author order", () => {
  const result = resolveReaderJourney({ section: "guides", id: "roundup", cards: ["card-b", "card-b", "missing", "card-a", "card-c", "card-d", "card-e"] }, catalogue);
  assert.equal(result.actions[0].href, "/cards/compare/?cards=card-b,card-a,card-c,card-d");
  assert.equal(result.actions.length, 1);
});

test("unknown catalogue references are omitted and do not create broken links", () => {
  const result = resolveReaderJourney({ section: "news", id: "record", cards: ["missing"], banks: ["missing"], programmes: ["missing"] }, catalogue);
  assert.deepEqual(result, { actions: [], relatedGuides: [] });
});

test("salary news puts the salary task first, before named bank coverage", () => {
  const result = resolveReaderJourney({ section: "news", id: "salary-news", category: "salary-transfer", banks: ["bank-a", "bank-a"] }, catalogue);
  assert.deepEqual(result.actions.map((a) => a.href), ["/salary-transfer/", "/salary-transfer/calculator/", "/banks/bank-a/"]);
});

test("archival and current deal navigation says current deals, not active status of the record", () => {
  const result = resolveReaderJourney({ section: "deals", id: "old-offer", banks: ["bank-a"] }, catalogue);
  assert.deepEqual(result.actions.map((a) => a.href), ["/banks/bank-a/", "/deals/"]);
  assert.equal(result.actions[1].label, "Browse current deals");
});

test("curated guide continuations validate guide targets and exclude self and action duplication", () => {
  const extra = { ...catalogue, guides: [
    ...catalogue.guides,
    guide("uae-credit-card-eligibility-2026"),
    guide("aecb-credit-report-walkthrough"),
    guide("expat-starter-first-credit-card"),
  ] };
  const result = resolveReaderJourney({ section: "guides", id: "uae-credit-card-eligibility-2026", programmes: ["skywards"] }, extra);
  assert.equal(result.actions[0].href, "/cards/finder/");
  assert.equal(result.actions.length, 1, "the exact editorial task wins over an incidental programme reference");
  assert.deepEqual(result.relatedGuides.map((g) => g.id), ["aecb-credit-report-walkthrough", "expat-starter-first-credit-card"]);
  const missingTarget = resolveReaderJourney({ section: "guides", id: "aecb-credit-report-walkthrough" }, catalogue);
  assert.deepEqual(missingTarget, { actions: [], relatedGuides: [] });
});

test("the first-card guide links to eligibility, costs and comparison before incidental references", () => {
  const result = resolveReaderJourney({
    section: "guides", id: "expat-starter-first-credit-card", cards: ["card-a", "card-b"], programmes: ["skywards"],
  }, {
    ...catalogue,
    guides: [...catalogue.guides, guide("uae-credit-card-eligibility-2026"), guide("aecb-credit-report-walkthrough")],
  });
  assert.deepEqual(result.actions.map((action) => action.href), ["/cards/finder/", "/cards/fees/", "/cards/compare/"]);
  assert.deepEqual(result.relatedGuides.map((related) => related.id), ["uae-credit-card-eligibility-2026", "aecb-credit-report-walkthrough"]);
});

test("the current guide cannot recommend itself and input arrays are not mutated", () => {
  const before = JSON.stringify(catalogue);
  const context = { section: "guides" as const, id: "programme-guide", programmes: ["skywards"] };
  const result = resolveReaderJourney(context, catalogue);
  assert.ok(!result.relatedGuides.some((g) => g.id === "programme-guide"));
  assert.equal(JSON.stringify(catalogue), before);
  assert.deepEqual(context.programmes, ["skywards"]);
});
