import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../src/components/Header.astro", import.meta.url), "utf8");
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)![1];

function harness() {
  let focused: unknown;
  class Element {
    editing = false;
    handlers = new Map<string, ((event: any) => void)[]>();
    addEventListener(type: string, fn: (event: any) => void) { this.handlers.set(type, [...(this.handlers.get(type) ?? []), fn]); }
    emit(type: string, event: any) { this.handlers.get(type)?.forEach((fn) => fn(event)); }
    focus() { focused = this; }
    select() {}
    closest() { return this.editing ? this : null; }
  }
  class Menu extends Element {
    open = false;
    summary = new Element();
    link = new Element();
    contains(node: unknown) { return node === this || node === this.summary || node === this.link; }
    querySelector(selector: string) { return selector === "summary" ? this.summary : this.link; }
    getClientRects() { return [{}]; }
  }
  const menus = [new Menu(), new Menu()];
  const documentEvents = new Element();
  const breakpoint = new Element();
  const input = new Element();
  let onSearch = false;
  let assigned = "";
  const document = {
    querySelectorAll: () => menus,
    querySelector: () => onSearch ? input : null,
    getElementById: () => null,
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
  };
  runInNewContext(script, { document, Element, Node: Element, window: { matchMedia: () => breakpoint, location: { assign: (path: string) => { assigned = path; } } } });
  const key = (key: string, target: unknown = new Element(), extra = {}) => {
    const event = { key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    documentEvents.emit("keydown", event);
    return event;
  };
  return { menus, documentEvents, breakpoint, input, Element, key, focused: () => focused, assigned: () => assigned, onSearch: () => { onSearch = true; } };
}

test("native desktop disclosure opens with ArrowDown and focuses its first link", () => {
  const h = harness();
  h.menus[1].open = true;
  let prevented = false;
  h.menus[0].summary.emit("keydown", { key: "ArrowDown", preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.menus[0].open, true);
  assert.equal(h.menus[1].open, false);
  assert.equal(h.focused(), h.menus[0].link);
});

test("Escape closes the open desktop panel and returns focus to its disclosure", () => {
  const h = harness();
  h.menus[0].open = true;
  h.key("Escape", h.menus[0].link);
  assert.equal(h.menus[0].open, false);
  assert.equal(h.focused(), h.menus[0].summary);
});

test("pointer persistence: clicking inside the panel keeps it open; outside closes it", () => {
  const h = harness();
  h.menus[0].open = true;
  h.documentEvents.emit("click", { target: h.menus[0].link });
  assert.equal(h.menus[0].open, true);
  h.documentEvents.emit("click", { target: new h.Element() });
  assert.equal(h.menus[0].open, false);
  assert.equal(h.menus[0].handlers.has("mouseleave"), false);
});

test("leaving the panel by keyboard and crossing a layout breakpoint close it", () => {
  const h = harness();
  h.menus[0].open = true;
  h.menus[0].emit("focusout", { relatedTarget: h.menus[0].link });
  assert.equal(h.menus[0].open, true);
  h.menus[0].emit("focusout", { relatedTarget: new h.Element() });
  assert.equal(h.menus[0].open, false);
  h.menus[1].open = true;
  h.breakpoint.emit("change", {});
  assert.equal(h.menus[1].open, false);
});

test("Cmd/Ctrl-K opens the existing route or focuses the existing search field", () => {
  const h = harness();
  assert.equal(h.key("k", undefined, { ctrlKey: true }).defaultPrevented, true);
  assert.equal(h.assigned(), "/search/");
  const search = harness();
  search.onSearch();
  search.key("K", undefined, { metaKey: true });
  assert.equal(search.focused(), search.input);
  assert.equal(search.assigned(), "");
});

test("search shortcut does not steal editing, composition or already handled shortcuts", () => {
  const h = harness();
  const input = new h.Element(); input.editing = true;
  assert.equal(h.key("k", input, { ctrlKey: true }).defaultPrevented, false);
  for (const extra of [{ altKey: true }, { shiftKey: true }, { isComposing: true }, { defaultPrevented: true }]) {
    const event = h.key("k", new h.Element(), { ctrlKey: true, ...extra });
    assert.equal(h.assigned(), "");
    if (!extra.defaultPrevented) assert.equal(event.defaultPrevented, false);
  }
});

test("homepage initial styling stays unmodified and sublink current state is exact, not directory-wide", () => {
  assert.match(source, /data-interior=\{currentPath !== "\/" \? "true" : undefined\}/);
  assert.match(source, /const isCurrent = \(href: string\) => currentPath === href/);
  assert.match(source, /aria-current=\{isCurrent\(r.href\) \? "page" : undefined\}/);
  assert.doesNotMatch(source, /dp-nav-sub\$\{isActive\(r.href\)/);
});
