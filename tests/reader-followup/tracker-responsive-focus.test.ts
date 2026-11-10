import assert from "node:assert/strict";
import { test } from "node:test";
import { installTrackerResponsiveFocus } from "../../src/scripts/trackerResponsiveFocus.mjs";

class Node {
  tagName: string; id = ""; parent: Node | null = null; children: Node[] = [];
  attributes = new Map<string, string>(); visible = true;
  focusCalls: unknown[] = []; document: Events;
  constructor(tag: string, document: Events) { this.tagName = tag; this.document = document; }
  append(...nodes: Node[]) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  contains(node: Node): boolean { return node === this || this.children.some(child => child.contains(node)); }
  getAttribute(key: string) { return key === "id" ? this.id : this.attributes.get(key) ?? null; }
  getClientRects(): unknown[] { return this.visible && (!this.parent || this.parent.getClientRects().length) ? [{}] : []; }
  closest(selector: string): Node | null {
    if (selector === "[hidden]" ? this.attributes.has("hidden") : /^dpst-(?:mobile|desktop)-/.test(this.id)) return this;
    return this.parent?.closest(selector) ?? null;
  }
  all(): Node[] { return this.children.flatMap(child => [child, ...child.all()]); }
  querySelector(selector: string) {
    const match = selector.match(/^\[(id|aria-controls)="([^"]+)"\]$/);
    return match ? this.all().find(node => node.getAttribute(match[1]) === match[2]) ?? null : null;
  }
  querySelectorAll() { return this.all().filter(node => ["BUTTON", "A", "SUMMARY", "INPUT"].includes(node.tagName)); }
  focus(options?: unknown) {
    const previous = this.document.activeElement;
    this.document.activeElement = this;
    if (previous) this.document.emit("focusout", { target: previous, relatedTarget: this });
    this.document.emit("focusin", { target: this });
    this.focusCalls.push(options);
  }
}
class Events {
  handlers = new Map<string, Set<(event: any) => void>>();
  activeElement: Node | null = null; body: Node; hidden = false;
  constructor() { this.body = new Node("BODY", this); this.activeElement = this.body; }
  addEventListener(name: string, fn: (event: any) => void) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name)!.add(fn); }
  removeEventListener(name: string, fn: (event: any) => void) { this.handlers.get(name)?.delete(fn); }
  emit(name: string, event: any = {}) { this.handlers.get(name)?.forEach(fn => fn(event)); }
}
function fixture(run: (f: any) => void) {
  const document = new Events(), window = new Events(), root = new Node("SECTION", document);
  const view = (name: string) => {
    const shell = new Node("DIV", document), control = new Node("BUTTON", document), detail = new Node("DIV", document), link = new Node("A", document);
    detail.id = `dpst-${name}-test-offer`; control.attributes.set("aria-controls", detail.id); control.attributes.set("aria-expanded", "true");
    link.attributes.set("href", "/salary-transfer/test-bank/"); detail.append(link); shell.append(control, detail); root.append(shell);
    return { shell, control, detail, link };
  };
  const mobile = view("mobile"), desktop = view("desktop"); desktop.shell.visible = false;
  const outside = new Node("BUTTON", document);
  const frames = new Map<number, () => void>(); let next = 0;
  let observer: any;
  class Observer {
    disconnected = false; constructor(public callback: () => void) { observer = this; }
    observe(node: Node) { assert.equal(node, root); }
    disconnect() { this.disconnected = true; }
  }
  const values = { document, window, ResizeObserver: Observer, requestAnimationFrame(fn: () => void) { frames.set(++next, fn); return next; }, cancelAnimationFrame(id: number) { frames.delete(id); } };
  const before = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.entries(values).forEach(([key, value]) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }));
  const cleanup = installTrackerResponsiveFocus(root);
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  const resize = (from: typeof mobile, to: typeof mobile) => {
    from.shell.visible = false; to.shell.visible = true;
    const previous = document.activeElement;
    if (previous && from.shell.contains(previous)) { document.activeElement = document.body; document.emit("focusout", { target: previous, relatedTarget: null }); }
    observer.callback(); flush();
  };
  const keyFocus = (node: Node) => { document.emit("keydown", { key: "Tab" }); node.focus(); flush(); };
  try { run({ document, window, root, mobile, desktop, outside, observer: () => observer, frames, flush, resize, cleanup, keyFocus }); }
  finally { cleanup(); before.forEach((descriptor, key) => { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }); }
}

test("open keyboard disclosure follows the exact offer in both responsive directions without scrolling", () => fixture(f => {
  f.keyFocus(f.mobile.control); f.resize(f.mobile, f.desktop);
  assert.equal(f.document.activeElement, f.desktop.control);
  assert.deepEqual(f.desktop.control.focusCalls, [{ preventScroll: true }]);
  f.resize(f.desktop, f.mobile); assert.equal(f.document.activeElement, f.mobile.control);
  assert.deepEqual(f.mobile.control.focusCalls.at(-1), { preventScroll: true });
}));

test("an open detail's focused link follows only its matching counterpart", () => fixture(f => {
  f.keyFocus(f.mobile.link); f.resize(f.mobile, f.desktop);
  assert.equal(f.document.activeElement, f.desktop.link);
  f.resize(f.desktop, f.mobile); assert.equal(f.document.activeElement, f.mobile.link);
}));

test("a queued keyboard frame cannot erase ownership after CSS hides the old copy before focusout", () => fixture(f => {
  f.keyFocus(f.mobile.control); f.document.emit("keyup", { key: "Enter" });
  f.mobile.shell.visible = false; f.desktop.shell.visible = true;
  // Real Chromium can retain activeElement on the now-hidden node until
  // after ResizeObserver, unlike the normal fixture's immediate blur.
  f.observer().callback(); f.flush();
  assert.equal(f.document.activeElement, f.desktop.control);
}));

test("there is no initial focus, closed/inactive-offer focus recovery or removed-node recovery", () => {
  fixture(f => { f.observer().callback(); f.flush(); assert.equal(f.document.activeElement, f.document.body); });
  fixture(f => { f.mobile.control.focus(); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0, "initial programmatic focus is not keyboard ownership"); });
  fixture(f => { f.mobile.control.attributes.set("aria-expanded", "false"); f.keyFocus(f.mobile.control); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  fixture(f => { f.keyFocus(f.mobile.control); f.desktop.control.attributes.set("aria-expanded", "false"); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  fixture(f => { f.keyFocus(f.mobile.control); f.root.children.splice(0, 1); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
});

test("outside/body focus, pointer focus and deliberate visible blur are never taken back", () => {
  fixture(f => { f.keyFocus(f.mobile.control); f.outside.focus(); f.resize(f.mobile, f.desktop); assert.equal(f.document.activeElement, f.outside); });
  fixture(f => { f.keyFocus(f.mobile.control); f.document.body.focus(); f.resize(f.mobile, f.desktop); assert.equal(f.document.activeElement, f.document.body); });
  fixture(f => { f.document.emit("pointerdown"); f.mobile.control.focus(); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  fixture(f => { f.keyFocus(f.mobile.control); f.document.emit("pointerdown"); f.document.activeElement = f.document.body; f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  fixture(f => { f.keyFocus(f.mobile.control); f.document.activeElement = f.document.body; f.document.emit("focusout", { target: f.mobile.control, relatedTarget: null }); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
});

test("collapse inside the visible responsive view is not a reason to migrate focus", () => fixture(f => {
  f.keyFocus(f.mobile.link); f.mobile.detail.attributes.set("hidden", "");
  f.document.activeElement = f.document.body; f.document.emit("focusout", { target: f.mobile.link, relatedTarget: null });
  f.observer().callback(); f.flush(); assert.equal(f.desktop.control.focusCalls.length, 0);
}));

test("keyboard resumes after pointer use; window blur/hidden document cancel ownership", () => {
  fixture(f => { f.document.emit("pointerdown"); f.mobile.control.focus(); f.document.emit("keyup"); f.flush(); f.resize(f.mobile, f.desktop); assert.equal(f.document.activeElement, f.desktop.control); });
  fixture(f => { f.keyFocus(f.mobile.control); f.window.emit("blur", { target: f.window }); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  fixture(f => { f.keyFocus(f.mobile.control); f.document.hidden = true; f.document.emit("visibilitychange"); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
});

test("unmount disconnects observer/listeners, cancels frames and makes stale callbacks inert", () => fixture(f => {
  f.keyFocus(f.mobile.control); f.observer().callback(); f.document.emit("keyup"); assert.equal(f.frames.size, 2);
  f.cleanup(); assert.equal(f.observer().disconnected, true); assert.equal(f.frames.size, 0);
  for (const set of f.document.handlers.values()) assert.equal(set.size, 0);
  for (const set of f.window.handlers.values()) assert.equal(set.size, 0);
  f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0);
}));

test("an absent counterpart or unsupported observer leaves focus alone", () => {
  fixture(f => { f.keyFocus(f.mobile.control); f.desktop.control.attributes.set("aria-controls", "dpst-desktop-other-offer"); f.resize(f.mobile, f.desktop); assert.equal(f.desktop.control.focusCalls.length, 0); });
  const previous = Object.getOwnPropertyDescriptor(globalThis, "ResizeObserver");
  Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: undefined });
  try { const cleanup = installTrackerResponsiveFocus({}); assert.doesNotThrow(cleanup); }
  finally { if (previous) Object.defineProperty(globalThis, "ResizeObserver", previous); else Reflect.deleteProperty(globalThis, "ResizeObserver"); }
});
