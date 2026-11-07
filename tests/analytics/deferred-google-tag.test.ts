import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { googleTagBootstrapSource } from "../../src/lib/deferredGoogleTag.mjs";

class Target {
  listeners = new Map<string, Array<{ fn: (event: any) => void; once: boolean }>>();
  addEventListener = (name: string, fn: (event: any) => void, options?: { once?: boolean }) => {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), { fn, once: !!options?.once }]);
  };
  removeEventListener = (name: string, fn: (event: any) => void) => {
    this.listeners.set(name, (this.listeners.get(name) ?? []).filter(item => item.fn !== fn));
  };
  fire(name: string, event: any = {}) {
    for (const item of [...(this.listeners.get(name) ?? [])]) {
      if (item.once) this.removeEventListener(name, item.fn);
      item.fn(event);
    }
  }
}
class Script extends Target {
  async = false;
  src = "";
  attributes = new Map<string, string>();
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
}
function harness({ initial = 0, ready = "loading", visibility = "visible", performance = true, raf = true } = {}) {
  let clock = initial;
  let serial = 0;
  const timers = new Map<number, { due: number; callback: () => void }>();
  const frames = new Map<number, () => void>();
  const scripts: Script[] = [];
  const window: any = new Target();
  const document: any = new Target();
  window.performance = performance ? { now: () => clock } : undefined;
  window.setTimeout = (callback: () => void, delay: number) => { const id = ++serial; timers.set(id, { due: clock + delay, callback }); return id; };
  window.clearTimeout = (id: number) => timers.delete(id);
  if (raf) {
    window.requestAnimationFrame = (callback: () => void) => { const id = ++serial; frames.set(id, callback); return id; };
    window.cancelAnimationFrame = (id: number) => frames.delete(id);
  }
  document.readyState = ready;
  document.visibilityState = visibility;
  document.querySelector = (selector: string) => scripts.find(script => selector.includes(`src="${script.src}"`)) ?? null;
  document.createElement = (tag: string) => { assert.equal(tag, "script"); return new Script(); };
  document.head = { appendChild: (script: Script) => scripts.push(script) };
  class ControlledDate extends Date { static now() { return 1_700_000_000_000 + clock; } }
  const initialise = () => { runInNewContext(googleTagBootstrapSource, { window, document, Date: ControlledDate }); return window.__dpGoogleTagLoader; };
  const tickTo = (target: number) => {
    assert.ok(target >= clock);
    for (let count = 0; count < 100; count++) {
      const next = [...timers].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      timers.delete(next[0]); clock = next[1].due; next[1].callback();
    }
    clock = target;
  };
  const frame = () => { clock += 16; const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback(); };
  const commands = () => (window.dataLayer ?? []).map((args: ArrayLike<unknown>) => Array.from(args));
  return { window, document, scripts, timers, frames, initialise, tickTo, frame, commands, jumpTo: (time: number) => { clock = time; } };
}

test("early load, two paint opportunities and scrolling never shorten the fixed three-second buffer", () => {
  const h = harness(); const state = h.initialise();
  assert.equal(state.phase, "scheduled");
  assert.equal(h.scripts.length, 0); assert.equal(h.commands().length, 0);
  assert.equal(h.window.listeners.has("scroll"), false);
  assert.equal(h.window.listeners.has("load"), false);
  h.tickTo(700); h.document.readyState = "complete"; h.window.fire("load");
  assert.equal(h.scripts.length, 0);
  h.frame(); assert.equal(h.scripts.length, 0);
  h.frame(); assert.equal(h.scripts.length, 0);
  h.window.fire("scroll"); h.document.fire("visibilitychange");
  assert.equal(h.commands().length, 0);
  h.tickTo(2999); assert.equal(h.scripts.length, 0); assert.equal(h.commands().length, 0);
  h.tickTo(3000); assert.equal(h.scripts.length, 1);
  assert.equal(state.reason, "deadline"); assert.equal(state.startedAt, 3000);
  assert.equal(h.scripts[0].async, true);
  assert.equal(h.scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-VS2RL6KX46");
  assert.equal(h.scripts[0].attributes.get("data-dp-google-tag"), "G-VS2RL6KX46");
  const queue = h.commands();
  assert.equal(queue.length, 2); assert.equal(queue[0][0], "js");
  assert.equal(Object.prototype.toString.call(queue[0][1]), "[object Date]");
  assert.deepEqual(queue[1], ["config", "G-VS2RL6KX46"]);
  h.tickTo(5000); assert.equal(h.scripts.length, 1); assert.equal(h.commands().length, 2);
});

test("three-second navigation deadline loads without scrolling or completed load event", () => {
  const h = harness({ initial: 400 }); const state = h.initialise();
  assert.equal(state.clock, "navigation"); assert.equal(state.deadline, 3000);
  assert.equal([...h.timers.values()][0].due, 3000);
  h.tickTo(2999); assert.equal(h.scripts.length, 0);
  h.tickTo(3000); assert.equal(h.scripts.length, 1);
  assert.equal(state.reason, "deadline"); assert.equal(state.startedAt, 3000);
  h.window.fire("load"); h.frame(); h.frame();
  assert.equal(h.scripts.length, 1); assert.equal(h.commands().length, 2);
});

test("late bootstrap starts next task; missing performance uses initialisation-relative fallback", () => {
  const late = harness({ initial: 4500 }); late.initialise();
  assert.equal(late.scripts.length, 0); assert.equal([...late.timers.values()][0].due, 4500);
  late.tickTo(4500); assert.equal(late.scripts.length, 1);
  const fallback = harness({ initial: 400, performance: false }); const state = fallback.initialise();
  assert.equal(state.clock, "initialisation-fallback");
  fallback.tickTo(3399); assert.equal(fallback.scripts.length, 0);
  fallback.tickTo(3400); assert.equal(fallback.scripts.length, 1);
});

test("duplicate bootstrap, existing tag and post-deadline load never duplicate configuration", () => {
  const h = harness({ ready: "complete" }); const first = h.initialise();
  assert.equal(h.initialise(), first); assert.equal(h.timers.size, 1); assert.equal(h.frames.size, 0);
  h.tickTo(3000); h.frame(); h.frame(); h.window.fire("load"); h.initialise();
  assert.equal(h.scripts.length, 1); assert.equal(h.commands().length, 2);
  const existing = harness(); const script = new Script();
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-VS2RL6KX46"; existing.scripts.push(script);
  assert.equal(existing.initialise().phase, "existing");
  assert.equal(existing.commands().length, 0); assert.equal(existing.timers.size, 0);
});

test("load/error outcomes are local lifecycle state, without retries", () => {
  const success = harness(); const good = success.initialise(); success.tickTo(3000);
  success.scripts[0].fire("load"); assert.equal(good.phase, "loaded");
  success.scripts[0].fire("error"); assert.equal(good.phase, "loaded");
  const failure = harness(); const bad = failure.initialise(); failure.tickTo(3000);
  failure.scripts[0].fire("error"); assert.equal(bad.phase, "error");
  failure.scripts[0].fire("load"); failure.tickTo(20_000); failure.window.fire("load"); failure.initialise();
  assert.equal(failure.scripts.length, 1); assert.equal(failure.commands().length, 2);
  const appendFailure = harness(); appendFailure.document.head.appendChild = () => { throw Error("blocked"); };
  const appendState = appendFailure.initialise(); appendFailure.tickTo(3000);
  assert.equal(appendState.phase, "error"); assert.equal(appendFailure.timers.size, 0);
});

test("background does not postpone deadline; throttled overdue tab starts on visibility return", () => {
  const hidden = harness({ ready: "complete", visibility: "hidden" }); hidden.initialise();
  assert.equal(hidden.frames.size, 0); hidden.tickTo(3000); assert.equal(hidden.scripts.length, 1);
  const throttled = harness({ visibility: "hidden" }); const state = throttled.initialise(); throttled.jumpTo(8000);
  throttled.document.visibilityState = "visible"; throttled.document.fire("visibilitychange");
  assert.equal(throttled.scripts.length, 1); assert.equal(state.reason, "visible-deadline"); assert.equal(throttled.timers.size, 0);
  const midFrame = harness({ ready: "complete" }); midFrame.initialise(); midFrame.frame();
  midFrame.document.visibilityState = "hidden"; midFrame.document.fire("visibilitychange");
  assert.equal(midFrame.frames.size, 0); midFrame.tickTo(3000); assert.equal(midFrame.scripts.length, 1);
});

test("BFCache pauses pending work and restores one overdue or still-pending deadline", () => {
  const h = harness({ ready: "complete" }); const state = h.initialise();
  h.tickTo(500); h.window.fire("pagehide", { persisted: true });
  assert.equal(h.timers.size, 0); assert.equal(h.frames.size, 0);
  h.jumpTo(7000); h.window.fire("pageshow", { persisted: true });
  assert.equal(state.reason, "restore-deadline"); assert.equal(h.scripts.length, 1);
  h.window.fire("pageshow", { persisted: true }); assert.equal(h.commands().length, 2);
  const early = harness(); early.initialise(); early.tickTo(500); early.window.fire("pagehide", { persisted: true });
  early.jumpTo(1000); early.window.fire("pageshow", { persisted: true });
  assert.equal([...early.timers.values()][0].due, 3000); early.tickTo(3000); assert.equal(early.scripts.length, 1);
});

test("ordinary page exit cancels pending work without resurrection or inert callbacks", () => {
  const h = harness({ ready: "complete" }); const state = h.initialise();
  h.window.fire("pagehide", { persisted: false });
  assert.equal(state.phase, "cancelled"); assert.equal(h.timers.size, 0); assert.equal(h.frames.size, 0);
  h.tickTo(5000); h.window.fire("pageshow", { persisted: true }); h.window.fire("load"); h.frame();
  assert.equal(h.scripts.length, 0); assert.equal(h.initialise(), state);
});

test("already-loaded document without RAF still waits for the fixed navigation deadline", () => {
  const h = harness({ ready: "complete", raf: false, initial: 1000 }); const state = h.initialise();
  assert.equal(h.scripts.length, 0); h.tickTo(1000);
  assert.equal(h.scripts.length, 0); assert.equal(h.commands().length, 0);
  h.window.fire("load"); h.tickTo(2999); assert.equal(h.scripts.length, 0);
  h.tickTo(3000); assert.equal(h.scripts.length, 1); assert.equal(state.reason, "deadline");
});

test("an artificially early timer callback re-arms rather than starting before the buffer", () => {
  const h = harness(); h.initialise();
  const [id, first] = [...h.timers][0];
  h.timers.delete(id); h.jumpTo(2999.5); first.callback();
  assert.equal(h.scripts.length, 0); assert.equal(h.commands().length, 0);
  assert.equal(h.timers.size, 1);
  assert.ok([...h.timers.values()][0].due >= 3000);
  h.tickTo(3001); assert.equal(h.scripts.length, 1);
});
