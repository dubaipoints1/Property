import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { cardJourneyHref, cardJourneyParams } from "../../src/lib/readerJourneyState";
import { cardSalaryLabel } from "../../src/lib/cardEligibility";
import { formatAED } from "../../src/lib/cardsDataFormat";

const finderCard = readFileSync("src/components/cards/FinderCard.astro", "utf8");
const finder = readFileSync("src/pages/cards/finder/index.astro", "utf8");
const compare = readFileSync("src/pages/cards/compare.astro", "utf8");
const journey = readFileSync("src/components/cards/CardJourney.astro", "utf8");

test("the actual Finder summary expression distinguishes null, zero and pending salary", () => {
  const label = finderCard.match(/<dt>Minimum monthly salary<\/dt><dd>\{([\s\S]*?)\}<\/dd>/)?.[1];
  assert.ok(label && /cardSalaryLabel\(card/.test(label), "Exercise the actual summary binding and shared formatter");
  const render = (minSalary: number | null, provenance: Record<string, string> = {}, invitationOnly = false) => runInNewContext(
    `${label};`,
    { card: { eligibility: { minSalary, invitationOnly }, _provenance: provenance }, cardSalaryLabel },
  );
  assert.equal(render(null, { eligibility: "editor-confirmed" }), "Confirmation pending");
  assert.equal(render(0, { eligibility: "editor-confirmed" }), "No minimum");
  assert.equal(render(5000, { eligibility: "editor-confirmed" }), formatAED(5000));
  assert.equal(render(5000, { "eligibility.minSalary": "needs-review" }), "Confirmation pending");
  assert.equal(render(null, {}, true), "Invitation only");
});

test("every Finder filter-reset action is wired to the selection-preserving canonical controller", () => {
  const resetActions = [...finder.matchAll(/<a\b([^>]+)>\s*(?:Clear filters|Reset filters)[^<]*<\/a>/g)];
  assert.equal(resetActions.length, 2, "Both the form action and the empty-results action are covered");
  for (const [, attributes] of resetActions) {
    assert.match(attributes, /\bdata-clear-card-filters\b/);
    assert.match(attributes, /\bdata-card-journey-reset\b/);
  }
});

class Link {
  dataset: Record<string, string> = {};
  constructor(public href: string, public reset = false, public quickCompare = false, public card?: string) {}
  matches(selector: string) { return selector === "[data-card-journey-reset]" && this.reset; }
  getAttribute(name: string) { return name === "href" ? this.href : null; }
  setAttribute(name: string, value: string) { if (name === "href") this.href = value; }
  hasAttribute(name: string) { return name === "data-finder-compare-card" && this.quickCompare; }
  closest() { return this.card ? { dataset: { slug: this.card } } : null; }
}

function runJourney(pathname: string, search: string, links: Link[], visible?: string[]) {
  const script = journey.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const source = ts.transpileModule(script.replace(/^\s*import[^\n]+\n/gm, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const handlers = new Map<string, () => void>();
  const location = { pathname, search };
  runInNewContext(source, {
    URL, URLSearchParams, location, cardJourneyHref, cardJourneyParams,
    addEventListener: (name: string, handler: () => void) => handlers.set(name, handler),
    document: {
      getElementById: () => ({ textContent: JSON.stringify(["a", "b", "c", "d"]) }),
      querySelector: (selector: string) => selector === "#finder-grid" && visible ? {
        querySelectorAll: () => visible.map(slug => ({ dataset: { slug } })),
      } : null,
      querySelectorAll: (selector: string) => selector === "main a[href^='/cards/']" ? links : [],
      addEventListener: (name: string, handler: () => void) => handlers.set(name, handler),
    },
  });
  return { location, handlers };
}

test("actual journey controller preserves compare reset, editorial routes and destination-owned selections", () => {
  const resetAttributes = [...compare.matchAll(/<a\b([^>]+)>\s*Reset to defaults[^<]*<\/a>/g)].map(match => match[1]);
  assert.equal(resetAttributes.length, 2);
  assert.ok(resetAttributes.every(attributes => /\bdata-card-journey-reset\b/.test(attributes)));
  const reset = new Link("/cards/compare/", true);
  const editorial = new Link("/cards/compare/a-vs-b/");
  const generic = new Link("/cards/compare/#fees");
  const owned = new Link("/cards/compare/?cards=d,c#fees");
  const { location, handlers } = runJourney("/cards/compare/", "?cards=b,a&salary=20000&cv_spend=0&via=finder", [reset, editorial, generic, owned]);
  assert.equal(reset.href, "/cards/compare/");
  assert.equal(editorial.href, "/cards/compare/a-vs-b/");
  let target = new URL(generic.href, "https://dubaipoints.ae");
  assert.equal(target.searchParams.get("cards"), "b,a");
  assert.equal(target.searchParams.get("cv_spend"), "0");
  assert.equal(target.hash, "#fees");
  target = new URL(owned.href, "https://dubaipoints.ae");
  assert.equal(target.searchParams.get("cards"), "d,c");
  assert.equal(target.hash, "#fees");
  location.search = "?cards=c,b&cv_spend=12000&via=finder";
  handlers.get("popstate")!();
  assert.equal(new URL(generic.href, "https://dubaipoints.ae").searchParams.get("cards"), "c,b");
  assert.equal(reset.href, "/cards/compare/");
  assert.equal(editorial.href, "/cards/compare/a-vs-b/");
});

test("a review's curated comparison and editorial matchup remain their own destinations", () => {
  const curated = new Link("/cards/compare/?cards=d,c");
  const editorial = new Link("/cards/compare/a-vs-b/");
  const generic = new Link("/cards/compare/");
  runJourney("/cards/a/", "?cards=b,a&via=finder", [curated, editorial, generic]);
  assert.equal(new URL(curated.href, "https://dubaipoints.ae").searchParams.get("cards"), "d,c");
  assert.equal(editorial.href, "/cards/compare/a-vs-b/");
  assert.equal(new URL(generic.href, "https://dubaipoints.ae").searchParams.get("cards"), "b,a");
});

test("the actual results event refreshes quick Compare suggestions after ranking and popstate", () => {
  const ranker = readFileSync("src/scripts/cardFinder.mjs", "utf8");
  assert.match(ranker, /document\.dispatchEvent\?\.\(new CustomEvent\("dp:card-results"/);
  const visible = ["a", "b", "c"];
  const quick = new Link("/cards/compare/?cards=d", false, true, "d");
  const generic = new Link("/cards/compare/");
  const { location, handlers } = runJourney("/cards/finder/", "?network=Visa", [quick, generic], visible);
  const selected = () => new URL(quick.href, "https://dubaipoints.ae").searchParams.get("cards");
  assert.equal(selected(), "d,a,b,c");
  visible.splice(0, visible.length, "c", "d");
  handlers.get("dp:card-results")?.();
  assert.equal(selected(), "d,c", "Filtered results must replace SSR-default suggestions");
  location.search = "?network=Mastercard";
  handlers.get("popstate")!();
  visible.splice(0, visible.length, "b", "a");
  handlers.get("dp:card-results")?.();
  assert.equal(selected(), "d,b,a", "The ranker's later popstate result wins over the earlier old grid");
  location.search = "?cards=c,b&network=Mastercard";
  handlers.get("dp:card-results")?.();
  assert.equal(selected(), "d", "A destination-owned explicit card is not replaced with suggestions");
  assert.equal(new URL(generic.href, "https://dubaipoints.ae").searchParams.get("cards"), "c,b", "Generic comparison keeps reader-owned order");
});
