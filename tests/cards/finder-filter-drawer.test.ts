import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialiseFinderFilterDrawer } from "../../src/scripts/finderFilterDrawer";
import { initialiseFinderGuide } from "../../src/scripts/finderGuide";

// These deterministic DOM doubles exercise the shipped controllers, not a
// browser's native dialog/inert implementation or visual accessibility.
class Element {
  children: Element[] = [];
  parentNode: Element | null = null;
  selectors = new Map<string, Element>();
  attributes = new Map<string, string>();
  handlers = new Map<string, ((event: any) => void)[]>();
  hidden = false; open = false; disabled = false; value = ""; textContent = "";
  visible = true; focusCount = 0; submitted = 0;
  tag = ""; classes: string[] = [];
  get parentElement() { return this.parentNode; }
  get tagName() { return this.tag.toUpperCase(); }
  get nextSibling() { const siblings = this.parentNode?.children ?? []; return siblings[siblings.indexOf(this) + 1] ?? null; }
  querySelector(selector: string) { return this.selectors.get(selector) ?? null; }
  querySelectorAll(selector?: string): Element[] {
    const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll()]);
    return selector ? descendants.filter(node => ["button", "input", "select", "a", "summary"].includes(node.tag) && !node.disabled) : descendants;
  }
  contains(node: Element | null): boolean { return node === this || this.children.some(child => child.contains(node)); }
  closest(selector: string): Element | null {
    if (selector === "[hidden]" && this.hidden || selector === "details" && this.tag === "details" || selector === ".dp-finder-fs-row" && this.classes.includes("dp-finder-fs-row")) return this;
    return this.parentNode?.closest(selector) ?? null;
  }
  remove() { if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null; }
  append(...nodes: Element[]) { nodes.forEach(node => { node.remove(); node.parentNode = this; this.children.push(node); }); }
  insertBefore(node: Element, next: Element | null) { node.remove(); node.parentNode = this; const index = next ? this.children.indexOf(next) : -1; this.children.splice(index < 0 ? this.children.length : index, 0, node); }
  before(node: Element) { this.parentNode?.insertBefore(node, this); }
  after(node: Element) { this.parentNode?.insertBefore(node, this.nextSibling); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  getAttribute(key: string) { return this.attributes.get(key) ?? null; }
  removeAttribute(key: string) { this.attributes.delete(key); }
  getClientRects() { return this.visible ? [{}] : []; }
  addEventListener(name: string, handler: (event: any) => void) { this.handlers.set(name, [...this.handlers.get(name) ?? [], handler]); }
  fire(name = "click", extra = {}) { const event = { prevented: false, preventDefault() { this.prevented = true; }, ...extra }; this.handlers.get(name)?.forEach(handler => handler(event)); return event; }
  focus() { (globalThis.document as any).activeElement = this; this.focusCount++; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire("close"); }
  requestSubmit() { this.submitted++; this.fire("submit"); }
}
class Style {
  properties = new Map<string, { value: string; priority: string }>();
  setProperty(name: string, value: string, priority = "") { this.properties.set(name, { value, priority }); }
  getPropertyValue(name: string) { return this.properties.get(name)?.value ?? ""; }
  getPropertyPriority(name: string) { return this.properties.get(name)?.priority ?? ""; }
  removeProperty(name: string) { this.properties.delete(name); }
}
function globals(values: Record<string, unknown>, run: () => void) {
  const old = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.entries(values).forEach(([key, value]) => Object.defineProperty(globalThis, key, { configurable: true, value, writable: true }));
  try { run(); } finally { old.forEach((descriptor, key) => { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }); }
}
function fixture(mobileInitially = true) {
  const filters = new Element(), summary = new Element(), form = new Element(), context = new Element(), dialog = new Element(), content = new Element(), close = new Element(), input = new Element();
  filters.tag = "details"; filters.append(summary, form, context); dialog.append(close, content); form.append(input);
  input.value = "15000"; input.tag = "input"; close.tag = "button";
  filters.selectors.set("summary", summary); filters.selectors.set(".dp-finder-value-context", context);
  dialog.selectors.set("[data-finder-drawer-content]", content); dialog.selectors.set("[data-finder-drawer-close]", close);
  form.selectors.set("input:not([type=hidden]), select", input);
  const nodes = new Map([["#finder-filters", filters], ["#finder-form", form], ["#finder-filter-drawer", dialog]]);
  const style = new Style(); style.setProperty("overflow", "clip", "important"); style.setProperty("color", "navy");
  const doc = { querySelector(selector: string) { return nodes.get(selector); }, createComment() { return new Element(); }, body: { style }, activeElement: summary };
  const media = { matches: mobileInitially, handlers: [] as (() => void)[], addEventListener(_name: string, handler: () => void) { this.handlers.push(handler); }, change(matches: boolean) { this.matches = matches; this.handlers.forEach(handler => handler()); } };
  const scrolls: number[] = [], events = new Map<string, () => void>();
  const win = { matchMedia() { return media; }, scrollY: 376, scrollTo(_x: number, y: number) { scrolls.push(y); }, addEventListener(name: string, handler: () => void) { events.set(name, handler); } };
  return { filters, summary, form, context, dialog, content, close, input, style, doc, media, win, scrolls, events, run(fn: () => void) { globals({ document: doc, window: win, HTMLElement: Element }, fn); } };
}

test("mobile modal moves the same controls and restores scroll, styles, form state and trigger focus", () => {
  const f = fixture();
  f.run(() => {
    initialiseFinderFilterDrawer();
    assert.equal(f.filters.open, false); assert.equal(f.summary.getAttribute("aria-haspopup"), "dialog");
    assert.equal(f.summary.fire().prevented, true); assert.equal(f.dialog.open, true);
    assert.equal(f.form.parentNode, f.content); assert.equal(f.context.parentNode, f.content); assert.equal(f.input.value, "15000");
    assert.equal(f.style.getPropertyValue("position"), "fixed"); assert.equal(f.style.getPropertyValue("top"), "-376px");
    assert.equal(f.doc.activeElement, f.close);
    f.input.focus(); f.close.fire();
    assert.equal(f.dialog.open, false); assert.equal(f.form.parentNode, f.filters); assert.equal(f.context.parentNode, f.filters);
    assert.equal(f.filters.open, false); assert.equal(f.doc.activeElement, f.summary); assert.equal(f.input.value, "15000");
    assert.equal(f.style.getPropertyValue("overflow"), "clip"); assert.equal(f.style.getPropertyPriority("overflow"), "important");
    assert.equal(f.style.getPropertyValue("position"), ""); assert.equal(f.style.getPropertyValue("color"), "navy"); assert.deepEqual(f.scrolls, [376]);
    f.summary.fire(); f.dialog.close();
    assert.equal(f.form.parentNode, f.filters, "Native Escape's close event also restores the single form");
    assert.equal(f.doc.activeElement, f.summary);
  });
});

test("Tab wraps only inside an active mobile modal, and submission releases it", () => {
  const f = fixture();
  f.run(() => {
    initialiseFinderFilterDrawer();
    assert.equal(f.dialog.fire("keydown", { key: "Tab" }).prevented, false);
    f.summary.fire(); f.input.focus();
    assert.equal(f.dialog.fire("keydown", { key: "Tab" }).prevented, true); assert.equal(f.doc.activeElement, f.close);
    assert.equal(f.dialog.fire("keydown", { key: "Tab", shiftKey: true }).prevented, true); assert.equal(f.doc.activeElement, f.input);
    f.form.fire("submit"); assert.equal(f.dialog.open, false); assert.equal(f.form.parentNode, f.filters);
  });
});

test("a queued prior native close event cannot dismantle a rapidly reopened modal", () => {
  const f = fixture();
  f.dialog.close = () => { f.dialog.open = false; };
  f.run(() => {
    initialiseFinderFilterDrawer(); f.summary.fire(); f.close.fire();
    assert.equal(f.form.parentNode, f.filters);
    f.summary.fire(); f.dialog.fire("close");
    assert.equal(f.dialog.open, true); assert.equal(f.form.parentNode, f.content);
    assert.equal(f.style.getPropertyValue("position"), "fixed");
    f.dialog.close(); f.dialog.fire("close");
    assert.equal(f.form.parentNode, f.filters); assert.equal(f.style.getPropertyValue("position"), "");
  });
});

test("focus wrapping excludes controls and nested summaries hidden by any closed details ancestor", () => {
  const f = fixture();
  const more = new Element(), moreSummary = new Element(), hiddenRadio = new Element();
  more.tag = "details"; moreSummary.tag = "summary"; hiddenRadio.tag = "input";
  more.append(moreSummary, hiddenRadio); f.form.append(more);
  const adjust = new Element(), adjustSummary = new Element(), hiddenSpend = new Element(), hiddenLink = new Element(), secondSummary = new Element();
  adjust.tag = "details"; adjustSummary.tag = "summary"; hiddenSpend.tag = "input"; hiddenLink.tag = "a"; secondSummary.tag = "summary";
  const nested = new Element(), nestedSummary = new Element(), nestedLink = new Element();
  nested.tag = "details"; nested.open = true; nestedSummary.tag = "summary"; nestedLink.tag = "a";
  nested.append(nestedSummary, nestedLink); adjust.append(adjustSummary, hiddenSpend, hiddenLink, secondSummary, nested); f.context.append(adjust);
  f.run(() => {
    initialiseFinderFilterDrawer(); f.summary.fire();
    // All doubles deliberately report rectangles, matching the observed Chrome
    // case. Hidden inputs and even an open inner details must still be excluded.
    assert.equal(f.dialog.fire("keydown", { key: "Tab", shiftKey: true }).prevented, true);
    assert.equal(f.doc.activeElement, adjustSummary, "Shift+Tab from Close lands on the last exposed Adjust spend summary");
    assert.equal(f.dialog.fire("keydown", { key: "Tab" }).prevented, true); assert.equal(f.doc.activeElement, f.close);
    [hiddenRadio, hiddenSpend, hiddenLink, secondSummary, nestedSummary, nestedLink].forEach(node => assert.equal(node.focusCount, 0));
    adjust.open = true; nested.open = false; secondSummary.tag = "";
    f.close.focus(); f.dialog.fire("keydown", { key: "Tab", shiftKey: true });
    assert.equal(f.doc.activeElement, nestedSummary, "An inner first summary becomes available only when every outer details is open");
  });
});

test("crossing the breakpoint restores in-flow controls without losing focused input or body ownership", () => {
  const f = fixture();
  f.run(() => {
    initialiseFinderFilterDrawer(); f.summary.fire(); f.input.focus(); f.media.change(false);
    assert.equal(f.dialog.open, false); assert.equal(f.filters.open, true); assert.equal(f.form.parentNode, f.filters);
    assert.equal(f.doc.activeElement, f.input); assert.equal(f.summary.getAttribute("aria-haspopup"), null);
    assert.equal(f.style.getPropertyValue("position"), ""); assert.equal(f.summary.fire().prevented, false);
    f.media.change(true); assert.equal(f.filters.open, false); assert.equal(f.doc.activeElement, f.summary);
    f.summary.fire(); f.events.get("pagehide")!(); assert.equal(f.dialog.open, false); assert.equal(f.style.getPropertyValue("position"), "");
    assert.equal(f.form.parentNode, f.filters);
  });
});

test("desktop and unsupported-modal browsers keep native in-flow disclosure access", () => {
  const desktop = fixture(false);
  desktop.run(() => { initialiseFinderFilterDrawer(); assert.equal(desktop.filters.open, true); assert.equal(desktop.summary.fire().prevented, false); assert.equal(desktop.form.parentNode, desktop.filters); });
  const unsupported = fixture(); (unsupported.dialog as any).showModal = undefined;
  unsupported.run(() => { initialiseFinderFilterDrawer(); assert.equal(unsupported.summary.fire().prevented, false); assert.equal(unsupported.form.parentNode, unsupported.filters); assert.equal(unsupported.summary.getAttribute("aria-haspopup"), null); });
  const rejected = fixture(); rejected.dialog.showModal = () => { throw new Error("Modal unavailable"); };
  rejected.run(() => { initialiseFinderFilterDrawer(); rejected.summary.fire(); assert.equal(rejected.filters.open, true); assert.equal(rejected.form.parentNode, rejected.filters); assert.equal(rejected.style.getPropertyValue("position"), ""); assert.equal(rejected.summary.fire().prevented, false); });
});

test("guided steps put navigation after each active field and retain existing help descriptions", () => {
  const form = new Element(), filters = new Element(), guide = new Element(), more = new Element(), row = new Element();
  const nodes = Object.fromEntries(["controls", "label", "start", "back", "next", "skip", "all"].map(key => [key, new Element()]));
  Object.entries(nodes).forEach(([key, node]) => guide.selectors.set(`[data-guide-${key}]`, node));
  const salary = new Element(), goal = new Element(), refine = new Element();
  const salaryInput = new Element(), goalInput = new Element(), refineInput = new Element();
  salary.append(salaryInput); goal.append(goalInput); refine.append(refineInput); row.classes.push("dp-finder-fs-row"); row.append(refine); more.tag = "details"; more.append(row);
  filters.tag = "details"; filters.append(form); form.append(guide, salary, goal, more);
  const steps = [["eligibility", salary, salaryInput], ["goal", goal, goalInput], ["refine", refine, refineInput]] as const;
  steps.forEach(([key, fieldset, input]) => { form.selectors.set(`[data-guide-step="${key}"]`, fieldset); fieldset.selectors.set("input, select", input); });
  salaryInput.setAttribute("aria-describedby", "finder-salary-hint"); salaryInput.value = "20000";
  form.selectors.set('input[name="salary"]', salaryInput); form.selectors.set("#finder-more", more); form.selectors.set("input:not([type=hidden]), select", salaryInput);
  const doc = { activeElement: nodes.start, querySelector(selector: string) { return selector === "[data-finder-guide]" ? guide : selector === "#finder-form" ? form : filters; } };
  globals({ document: doc }, () => {
    initialiseFinderGuide(); nodes.start.fire();
    assert.equal(goal.nextSibling, guide); assert.equal(doc.activeElement, goalInput);
    assert.equal(goalInput.getAttribute("aria-describedby"), "finder-guide-step-status");
    nodes.next.fire(); assert.equal(salary.nextSibling, guide); assert.equal(doc.activeElement, salaryInput);
    assert.equal(salaryInput.getAttribute("aria-describedby"), "finder-salary-hint finder-guide-step-status"); assert.equal(goalInput.getAttribute("aria-describedby"), null);
    nodes.skip.fire(); assert.equal(salaryInput.value, ""); assert.equal(row.nextSibling, guide); assert.equal(more.open, true);
    assert.equal(salaryInput.getAttribute("aria-describedby"), "finder-salary-hint");
    nodes.all.fire(); assert.equal(form.children[0], guide); assert.equal(doc.activeElement, salaryInput); assert.equal(refineInput.getAttribute("aria-describedby"), null);
  });
});

test("markup retains one native GET form, a named closeable modal and live guided context without framework or telemetry", () => {
  const markup = readFileSync("src/pages/cards/finder/index.astro", "utf8");
  assert.equal((markup.match(/id="finder-form"/g) ?? []).length, 1);
  assert.match(markup, /<details class="dp-finder-formwrap" id="finder-filters">/);
  assert.match(markup, /<form method="get" action="\/cards\/finder\/"/);
  assert.match(markup, /<dialog[^>]+aria-labelledby="finder-filter-drawer-title"/);
  assert.match(markup, /data-finder-drawer-close>Close filters/);
  assert.match(markup, /id="finder-guide-step-status"[^>]+role="status" aria-live="polite"/);
  const source = readFileSync("src/scripts/finderFilterDrawer.ts", "utf8");
  assert.doesNotMatch(source, /\b(?:fetch|sendBeacon|gtag)\s*\(|\b(?:XMLHttpRequest|localStorage|sessionStorage|dataLayer)\b|from ["'](?:react|framer-motion|@radix-ui)/);
});
