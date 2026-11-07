import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialiseCardSelection } from "../../src/scripts/cardSelection";
import { initialiseCardDifferences } from "../../src/scripts/cardDifferences";
import { initialiseFinderGuide } from "../../src/scripts/finderGuide";
import { DIFFERENCE_SECTIONS, type CardDifference } from "../../src/lib/cardDifference";

// Small deterministic DOM doubles exercise the actual controllers. These
// are not browser/accessibility/layout certification; root runs real QA.
class Element {
  hidden = false; disabled = false; checked = false; open = false;
  textContent = ""; href = ""; type = ""; value = "";
  dataset: Record<string, string> = {};
  children: Element[] = [];
  attributes: Record<string, string> = {};
  handlers = new Map<string, () => void>();
  selectors = new Map<string, Element>();
  lists = new Map<string, Element[]>();
  focusCount = 0;
  closestNode?: Element;
  querySelector(selector: string) { return this.selectors.get(selector) ?? null; }
  querySelectorAll(selector: string) { return selector === "button" ? this.children.flatMap(child => child.children).filter(child => child.type === "button") : this.lists.get(selector) ?? []; }
  append(...children: Element[]) { this.children.push(...children); }
  replaceChildren(...children: Element[]) { this.children = children; }
  addEventListener(event: string, handler: () => void) { this.handlers.set(event, handler); }
  setAttribute(key: string, value: string) { this.attributes[key] = value; }
  focus() { this.focusCount++; }
  contains(node: unknown) { return node === this || this.children.includes(node as Element); }
  closest() { return this.closestNode ?? null; }
  fire(event = "click") { this.handlers.get(event)?.(); }
}

function globals(values: Record<string, unknown>, run: () => void) {
  const descriptors = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  try { run(); } finally { for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } }
}

test("actual Finder selection handles 0/1/2/4/5, hidden picks and keyboard recovery with zero results", () => {
  const tray = new Element(), items = new Element(), caption = new Element(), compare = new Element(), status = new Element(), clear = new Element(), tokens = new Element(), tokenItems = new Element(), auto = new Element(), applied = new Element();
  const empty = new Element(), reset = new Element(), filterSummary = new Element();
  empty.hidden = true; empty.selectors.set("[data-clear-card-filters]", reset);
  tray.selectors = new Map([["[data-selection-items]", items], ["[data-selection-caption]", caption], ["[data-selection-compare]", compare], ["[data-selection-clear]", clear]]);
  tokens.selectors.set("[data-filter-token-items]", tokenItems);
  const cards = ["a", "b", "c", "d", "e"].map(slug => ({ slug, name: "Card " + slug }));
  const tiles = cards.map(() => new Element());
  const boxes = cards.map((card, index) => { const box = new Element(); box.dataset.cardSelect = card.slug; box.closestNode = tiles[index]; return box; });
  const controls = boxes.map(() => new Element()), quick = [new Element()], clearLinks = [new Element()];
  const location = { search: "?salary=20000&prefer=miles&cv_spend=0&via=finder&email=private", hash: "#finder-results" };
  const documentHandlers = new Map<string, () => void>(), windowHandlers = new Map<string, () => void>();
  const selectors = new Map([["[data-card-selection-tray]", tray], ["[data-selection-status]", status], ["[data-card-filter-tokens]", tokens], ["[data-finder-applied-count]", applied], ["#finder-filters > summary", filterSummary]]);
  const doc = {
    getElementById(id: string) { return id === "finder-card-index" ? { textContent: JSON.stringify(cards) } : id === "finder-options" ? { textContent: JSON.stringify({ preferLabels: { miles: "Airline miles" } }) } : id === "finder-compare" ? auto : id === "finder-empty" ? empty : null; },
    querySelector(selector: string) { const slug = selector.match(/data-slug="([a-e])"/)?.[1]; return slug ? tiles[cards.findIndex(card => card.slug === slug)] : selectors.get(selector) ?? null; },
    querySelectorAll(selector: string) { return selector === "[data-card-select]" ? boxes : selector === "[data-finder-select-control]" ? controls : selector === "[data-finder-compare-card]" ? quick : selector === "[data-clear-card-filters]" ? clearLinks : selector === ".dp-finder-tile:not([hidden])" ? tiles.filter(tile => !tile.hidden) : []; },
    createElement() { return new Element(); },
    addEventListener(event: string, handler: () => void) { documentHandlers.set(event, handler); },
    dispatchEvent() {},
  };
  globals({ document: doc, location, history: { pushState(_state: unknown, _title: string, href: string) { const target = new URL(href, "https://dubaipoints.ae"); location.search = target.search; location.hash = target.hash; } }, addEventListener(event: string, handler: () => void) { windowHandlers.set(event, handler); } }, () => {
    initialiseCardSelection();
    assert.equal(tray.hidden, true); assert.equal(auto.hidden, false);
    boxes[0].checked = true; boxes[0].fire("change");
    assert.equal(tray.hidden, false); assert.equal(compare.hidden, true); assert.equal(auto.hidden, true);
    assert.match(caption.textContent, /one more/);
    for (const index of [1, 2, 3]) { boxes[index].checked = true; boxes[index].fire("change"); }
    assert.equal(compare.hidden, false); assert.equal(boxes[4].disabled, true);
    boxes[4].checked = true; boxes[4].fire("change");
    assert.equal(boxes[4].checked, false);
    let params = new URLSearchParams(location.search);
    assert.equal(params.get("cards"), "a,b,c,d"); assert.equal(params.get("cv_spend"), "0"); assert.equal(params.has("email"), false);
    tiles[0].hidden = true; documentHandlers.get("dp:card-results")!();
    assert.match(items.children[0].children[0].textContent, /Outside current results/);
    assert.equal(boxes[0].checked, true);
    items.children[0].children[0].fire();
    assert.equal(new URLSearchParams(location.search).get("cards"), "b,c,d");
    assert.equal(boxes[4].disabled, false);
    assert.equal(items.children[0].children[0].focusCount, 1);
    const tokenHref = tokenItems.children[0].children[0].href;
    params = new URL(tokenHref, "https://dubaipoints.ae").searchParams;
    assert.equal(params.has("salary"), false); assert.equal(params.get("prefer"), "miles"); assert.equal(params.get("cards"), "b,c,d"); assert.equal(params.get("cv_spend"), "0");
    clear.fire();
    assert.equal(tray.hidden, true); assert.equal(auto.hidden, false);
    assert.equal(new URLSearchParams(location.search).get("salary"), "20000");
    location.search = "?cards=d,b&cv_spend=0"; windowHandlers.get("popstate")!();
    assert.equal(compare.hidden, false); assert.equal(new URL(compare.href, "https://dubaipoints.ae").searchParams.get("cards"), "d,b");
    tiles.forEach(tile => { tile.hidden = true; }); empty.hidden = false;
    location.search = "?cards=a&network=Amex"; windowHandlers.get("popstate")!();
    clear.fire();
    assert.equal(reset.focusCount, 1, "Clear selection recovers to Reset when no cards remain visible");
    assert.equal(new URLSearchParams(location.search).get("network"), "Amex");
    location.search = "?cards=a&network=Amex"; windowHandlers.get("popstate")!();
    items.children[0].children[0].fire();
    assert.equal(reset.focusCount, 2, "Removing the last item also recovers to Reset");
    empty.hidden = true;
    location.search = "?cards=a"; windowHandlers.get("popstate")!(); clear.fire();
    assert.equal(filterSummary.focusCount, 1, "The native filters summary remains a final recovery target");
    assert.equal(status.attributes["aria-live"], undefined, "The existing Astro status node owns live semantics; no duplicate status nodes");
  });
});

test("actual differences controller retains unknowns, aligns remaining tracks, restores all facts and handles one card", () => {
  const toolbar = new Element(), button = new Element(), status = new Element(), source = new Element();
  toolbar.selectors = new Map([["[data-differences-toggle]", button], ["[data-differences-status]", status]]);
  const known = Object.fromEntries(DIFFERENCE_SECTIONS.map(key => [key, { known: key === "eligibility", ...(key === "eligibility" ? { signature: "same" } : {}) }])) as CardDifference;
  source.textContent = JSON.stringify({ a: known, b: known });
  const columns = ["a", "b"].map(slug => { const node = new Element(); node.dataset.slug = slug; return node; });
  const sections = columns.flatMap(() => DIFFERENCE_SECTIONS.map(key => { const node = new Element(); node.dataset.differenceSection = key; return node; }));
  const css = new Map<string, string>(), events = new Map<string, () => void>();
  const grid = new Element() as Element & { style: { setProperty(key: string, value: string): void } };
  grid.style = { setProperty(key, value) { css.set(key, value); } };
  grid.lists.set("[data-slug]", columns); grid.lists.set("[data-difference-section]", sections);
  const doc = { activeElement: sections[1], querySelector() { return toolbar; }, getElementById(id: string) { return id === "dp-compare-grid" ? grid : source; }, addEventListener(event: string, handler: () => void) { events.set(event, handler); } };
  globals({ document: doc, addEventListener() {} }, () => {
    initialiseCardDifferences();
    assert.equal(toolbar.hidden, false); assert.equal(button.attributes["aria-pressed"], "false");
    button.fire();
    assert.equal(sections.filter(section => section.hidden).length, 2);
    assert.ok(sections.filter(section => section.hidden).every(section => section.dataset.differenceSection === "eligibility"));
    assert.equal(css.get("--compare-rows"), "8"); assert.equal(css.get("--compare-row-value"), "5"); assert.equal(css.get("--compare-row-foot"), "8");
    assert.equal(button.focusCount, 1); assert.match(status.textContent, /1 known-identical section hidden/);
    button.fire(); assert.ok(sections.every(section => !section.hidden)); assert.equal(css.get("--compare-rows"), "9");
    button.fire(); columns[1].hidden = true; events.get("dp:card-selection")!();
    assert.equal(button.disabled, true); assert.equal(button.attributes["aria-pressed"], "false"); assert.ok(sections.every(section => !section.hidden));
  });
});

test("optional guide uses the existing fields, skips salary honestly and exits to direct controls", () => {
  const guide = new Element(), form = new Element() as Element & { requestSubmit(): void }, filters = new Element(), more = new Element();
  const nodes = Object.fromEntries(["controls", "label", "start", "back", "next", "skip", "all"].map(key => [key, new Element()]));
  for (const [key, node] of Object.entries(nodes)) guide.selectors.set(`[data-guide-${key}]`, node);
  const fields = ["goal", "eligibility", "refine"].map(key => { const fieldset = new Element(), input = new Element(); fieldset.selectors.set("input, select", input); fieldset.closestNode = more; form.selectors.set(`[data-guide-step="${key}"]`, fieldset); return input; });
  const salary = new Element(); salary.value = "20000";
  form.selectors.set('input[name="salary"]', salary); form.selectors.set("#finder-more", more);
  let submitted = 0; form.requestSubmit = () => { submitted++; };
  globals({ document: { querySelector(selector: string) { return selector === "[data-finder-guide]" ? guide : selector === "#finder-form" ? form : filters; } } }, () => {
    initialiseFinderGuide(); nodes.start.fire();
    assert.equal(filters.open, true); assert.equal(fields[0].focusCount, 1); assert.equal(nodes.back.disabled, true);
    nodes.next.fire(); assert.equal(nodes.skip.hidden, false); assert.equal(fields[1].focusCount, 1);
    nodes.skip.fire(); assert.equal(salary.value, ""); assert.equal(fields[2].focusCount, 1); assert.equal(nodes.next.textContent, "Apply choices");
    nodes.next.fire(); assert.equal(submitted, 1);
    nodes.all.fire(); assert.equal(nodes.controls.hidden, true); assert.equal(nodes.start.hidden, false); assert.equal(more.open, true);
  });
});

test("utilities retain progressive defaults and introduce no storage, network, telemetry or runtime framework", () => {
  const finder = readFileSync("src/pages/cards/finder/index.astro", "utf8"), compare = readFileSync("src/pages/cards/compare.astro", "utf8");
  assert.match(finder, /<details class="dp-finder-formwrap" id="finder-filters">/);
  assert.match(finder, /<noscript>[\s\S]*default cards, not personalised results/);
  assert.match(compare, /<noscript>[\s\S]*static comparison shows the default cards/);
  assert.match(compare, /data-card-differences hidden/);
  assert.equal((finder.match(/id="finder-form"/g) ?? []).length, 1);
  for (const path of ["cardSelection.ts", "cardDifferences.ts", "finderGuide.ts", "cardComparison.mjs", "cardFinder.mjs"]) {
    const source = readFileSync("src/scripts/" + path, "utf8");
    assert.doesNotMatch(source, /\b(?:fetch|sendBeacon|gtag)\s*\(|\b(?:XMLHttpRequest|localStorage|sessionStorage|dataLayer)\b/);
    assert.doesNotMatch(source, /from ["'](?:react|framer-motion|@radix-ui)/);
  }
  assert.match(compare, /<FeeBlock card=\{card.slug\}/);
  assert.match(compare, /<CardValueLines card=\{card\}/);
  assert.match(compare, /<VerifiedStamp lastVerified=\{card.lastVerified\}/);
  const ranker = readFileSync("src/scripts/cardFinder.mjs", "utf8");
  assert.doesNotMatch(ranker, /\bfxFee(?:UpperBound)?\b/, "Finder does not introduce a null-to-zero FX filter or ranking input");
});
