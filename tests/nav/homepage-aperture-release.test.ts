// Production contracts and a mocked DOM controller run. These do not certify
// native scrollbar event delivery, video decoding, contrast or physical Safari.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialiseHomeJourney } from "../../src/scripts/homeJourney";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const component = read("src/components/HomeJourneyHero.astro");
const controller = read("src/scripts/homeJourney.ts");

test("selected production hero reuses existing media, real links and one controller", () => {
  const index = read("src/pages/index.astro");
  assert.equal((index.match(/<HomeJourneyHero\s*\/>/g) ?? []).length, 1);
  assert.doesNotMatch(index, /data-reel(?:\s|=|>)/);
  assert.match(component, /getStockEntry\("hero-card-desk"\)/);
  for (const file of ["hero-journey-scrub-720.mp4", "hero-journey-scrub.mp4", "hero-journey-scrub-2560.mp4"]) assert.ok(component.includes(file));
  for (const id of ["tools", "latest"]) {
    assert.ok(component.includes(`href="#${id}"`));
    assert.ok(index.includes(`id="${id}"`));
  }
  assert.match(component, /Fly further\./);
  assert.match(component, /Pay less\./);
  assert.match(component, /initialiseHomeJourney\(\)/);
});

test("video has no initial network source, autoplay or independent play path", () => {
  const video = component.match(/<video\b[\s\S]*?<\/video>/)?.[0];
  assert.ok(video);
  assert.doesNotMatch(video, /\ssrc\s*=|<source\b|\sautoplay(?:\s|=|>)/i);
  assert.match(video, /preload="none"/);
  assert.match(video, /muted/);
  assert.match(video, /playsinline/);
  assert.match(video, /aria-hidden="true"/);
  assert.match(video, /tabindex="-1"/);
  assert.equal((controller.match(/video\.src\s*=/g) ?? []).length, 1);
  assert.doesNotMatch(controller, /\.play\(|setInterval\(|window\.scrollTo\(|document\.body\.style|style\.overflow\s*=/);
  assert.doesNotMatch(controller, /gtag\(|localStorage|sessionStorage|fetch\(/);
});

test("static-first composition keeps copy and links outside the animated media frame", () => {
  assert.ok(component.indexOf('class="journey-copy"') > component.indexOf("</video>"));
  assert.match(component, /min-height: min\(840px, calc\(100svh - var\(--journey-header\)\)\)/);
  assert.match(component, /@media \(max-height: 479px\)/);
  assert.match(component, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(component, /\.journey-actions a:focus-visible/);
  assert.match(component, /min-height: 48px/);
  assert.doesNotMatch(component, /\.journey-copy[^{}]*\{[^}]*opacity:\s*0/);
  assert.match(controller, /contentHeight <= stage\.clientHeight/);
});

type Listener = (event: any) => void;
class FixtureElement {
  listeners = new Map<string, Listener[]>();
  classes = new Set<string>();
  properties = new Map<string, string>();
  interactive = false;
  offsetHeight = 0;
  clientHeight = 0;
  clientWidth = 1424;
  classList = {
    add: (...names: string[]) => names.forEach(name => this.classes.add(name)),
    remove: (...names: string[]) => names.forEach(name => this.classes.delete(name)),
    toggle: (name: string, enabled: boolean) => enabled ? this.classes.add(name) : this.classes.delete(name),
  };
  style = { setProperty: (name: string, value: string) => this.properties.set(name, value) };
  closest() { return this.interactive ? this : null; }
  addEventListener(name: string, listener: Listener) {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
  fire(name: string, event: any = {}) {
    for (const listener of this.listeners.get(name) ?? []) listener(event);
  }
}

function withFixture(run: (state: any) => void) {
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const install = (name: string, value: unknown) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  const win = new FixtureElement() as any;
  win.innerWidth = 1440;
  win.innerHeight = 900;
  win.scrollY = 0;
  let nextRaf = 0;
  const frames = new Map<number, () => void>();
  win.requestAnimationFrame = (callback: () => void) => { frames.set(++nextRaf, callback); return nextRaf; };
  win.cancelAnimationFrame = (id: number) => frames.delete(id);
  const reduced = new FixtureElement() as any;
  reduced.matches = false;
  win.matchMedia = () => reduced;
  const doc = new FixtureElement() as any;
  doc.hidden = false;
  doc.documentElement = new FixtureElement();
  const root = new FixtureElement() as any;
  root.getBoundingClientRect = () => ({ top: 100 - win.scrollY, bottom: 1700 - win.scrollY, height: 1600 });
  const stage = new FixtureElement();
  stage.offsetHeight = stage.clientHeight = 800;
  const copy = new FixtureElement();
  copy.offsetHeight = 500;
  const foot = new FixtureElement();
  foot.offsetHeight = 50;
  const frame = new FixtureElement();
  const video = new FixtureElement() as any;
  video.dataset = { srcSmall: "/videos/hero-journey-scrub-720.mp4", src: "/videos/hero-journey-scrub.mp4", srcLarge: "/videos/hero-journey-scrub-2560.mp4" };
  video.readyState = 2;
  video.duration = 10;
  video.seeking = false;
  video.currentTime = 0;
  video.paused = true;
  video.loads = 0;
  video.pause = () => { video.paused = true; };
  video.load = () => { video.loads++; };
  video.removeAttribute = (name: string) => { if (name === "src") delete video.src; };
  const targets = new Map([
    ["[data-journey-stage]", stage], ["[data-journey-copy]", copy], ["[data-journey-foot]", foot],
    ["[data-journey-video]", video], ["[data-journey-frame]", frame],
  ]);
  root.querySelector = (selector: string) => targets.get(selector) ?? null;
  const header = new FixtureElement();
  header.offsetHeight = 100;
  doc.querySelector = (selector: string) => selector === "[data-home-journey]" ? root : selector === ".dp-header" ? header : null;
  const fire = (host: FixtureElement, name: string, overrides = {}) => host.fire(name, {
    isTrusted: true, target: new FixtureElement(), button: 0, buttons: 0, defaultPrevented: false,
    metaKey: false, ctrlKey: false, altKey: false, ...overrides,
  });
  const flush = () => {
    let count = 0;
    while (frames.size) {
      assert.ok(++count <= 10, "controller must not form an idle RAF loop");
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback());
    }
  };
  install("Element", FixtureElement);
  install("window", win);
  install("document", doc);
  install("getComputedStyle", () => ({ paddingTop: "24px", paddingBottom: "24px", direction: "ltr" }));
  try { run({ win, doc, root, stage, copy, foot, frame, video, reduced, frames, fire, flush }); }
  finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
}

test("executed controller leaves src absent at init and attaches only after intent plus changed in-hero scroll", () => withFixture(s => {
  initialiseHomeJourney();
  s.flush();
  assert.equal(s.video.src, undefined);
  s.fire(s.win, "wheel", { isTrusted: false });
  s.win.scrollY = 50;
  s.fire(s.win, "scroll");
  s.flush();
  assert.equal(s.video.src, undefined);
  s.fire(s.win, "wheel");
  assert.equal(s.video.src, undefined, "intent alone is insufficient");
  s.win.scrollY = 100;
  s.fire(s.win, "scroll");
  s.flush();
  assert.equal(s.video.src, "/videos/hero-journey-scrub.mp4");
  assert.equal(s.video.loads, 1);
  assert.ok(s.video.currentTime > 0);
  assert.equal(s.video.paused, true);
  assert.equal(s.frames.size, 0);
}));

test("executed click, hash, history, resize, pageshow and blur paths revoke earlier input", () => {
  for (const [host, event] of [["doc", "click"], ["win", "hashchange"], ["win", "popstate"], ["win", "resize"], ["win", "pageshow"], ["win", "blur"]]) withFixture(s => {
    initialiseHomeJourney();
    s.fire(s.win, "wheel");
    s.fire(s[host], event);
    s.win.scrollY = 100;
    s.fire(s.win, "scroll");
    s.flush();
    assert.equal(s.video.src, undefined, `${event} cannot initiate video from stale intent`);
  });
});

test("executed focused-link keyboard and mocked scrollbar delivery support native input paths", () => {
  for (const mode of ["keyboard", "gutter"]) withFixture(s => {
    initialiseHomeJourney();
    if (mode === "keyboard") s.fire(s.win, "keydown", { key: "PageDown" });
    else s.fire(s.win, "pointerdown", { clientX: 1430, pointerType: "mouse", buttons: 1 });
    assert.equal(s.video.src, undefined);
    s.win.scrollY = 100;
    s.fire(s.win, "scroll");
    s.flush();
    assert.equal(s.video.src, "/videos/hero-journey-scrub.mp4");
  });
  // Real browser event delivery from a native scrollbar is deliberately not
  // represented by this mock and remains a separate runtime test.
});

test("executed reduction, short-height and hidden/offscreen guards stop enhancement work", () => withFixture(s => {
  initialiseHomeJourney();
  s.fire(s.win, "wheel");
  s.win.scrollY = 100;
  s.fire(s.win, "scroll");
  s.flush();
  assert.ok(s.video.src);
  s.reduced.matches = true;
  s.fire(s.reduced, "change");
  assert.equal(s.video.src, undefined);
  assert.equal(s.root.classes.has("is-enhanced"), false);
  assert.equal(s.frames.size, 0);
  s.reduced.matches = false;
  s.fire(s.reduced, "change");
  s.flush();
  assert.equal(s.video.src, undefined, "re-enable alone does not load video");
  s.fire(s.win, "wheel");
  s.win.scrollY = 200;
  s.fire(s.win, "scroll");
  assert.ok(s.frames.size);
  s.doc.hidden = true;
  s.fire(s.doc, "visibilitychange");
  assert.equal(s.frames.size, 0);
  assert.equal(s.video.paused, true);
  s.doc.hidden = false;
  s.fire(s.doc, "visibilitychange");
  s.flush();
  s.win.scrollY = 3000;
  s.fire(s.win, "scroll");
  s.fire(s.video, "seeked");
  assert.equal(s.frames.size, 0);
  assert.equal(s.video.paused, true);
  s.win.innerHeight = 390;
  s.fire(s.win, "resize");
  assert.equal(s.root.classes.has("is-enhanced"), false);
  assert.equal(s.video.src, undefined);
}));
