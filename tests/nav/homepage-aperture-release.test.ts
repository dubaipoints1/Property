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
  assert.doesNotMatch(controller, /gtag\(|localStorage|sessionStorage/);
  assert.match(controller, /window\.fetch\(source, \{ signal: request\.signal, credentials: "same-origin", redirect: "error" \}\)/);
  assert.match(controller, /video\.src = mediaURL/);
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

function withFixture(run: (state: any) => void | Promise<void>) {
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const install = (name: string, value: unknown) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  const win = new FixtureElement() as any;
  const connection = new FixtureElement() as any;
  connection.saveData = false;
  win.navigator = { connection };
  win.innerWidth = 1440;
  win.innerHeight = 900;
  win.scrollY = 0;
  const requests: { source: string; options: RequestInit }[] = [];
  const createdURLs: string[] = [], revokedURLs: string[] = [];
  let fetchMedia = async () => ({ ok: true, blob: async () => new Blob(["owned MP4 fixture"], { type: "video/mp4" }) });
  win.fetch = (source: string, options: RequestInit) => { requests.push({ source, options }); return fetchMedia(); };
  win.URL = {
    createObjectURL: () => { const url = `blob:owned-fixture-${createdURLs.length + 1}`; createdURLs.push(url); return url; },
    revokeObjectURL: (url: string) => revokedURLs.push(url),
  };
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
  const restore = () => {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  };
  const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); flush(); };
  try {
    const result = run({ win, doc, root, stage, copy, foot, frame, video, reduced, connection, frames, fire, flush,
      requests, createdURLs, revokedURLs, settle, setFetch: (implementation: typeof fetchMedia) => { fetchMedia = implementation; } });
    if (result) return result.finally(restore);
    restore();
  } catch (error) {
    restore();
    throw error;
  }
}

test("executed controller leaves src absent at init and attaches only after intent plus changed in-hero scroll", () => withFixture(async s => {
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
  assert.equal(s.video.src, undefined, "the original URL is never assigned to the media element");
  await s.settle();
  assert.equal(s.requests.length, 1);
  assert.equal(s.requests[0].source, "/videos/hero-journey-scrub.mp4");
  assert.equal(s.video.src, "blob:owned-fixture-1");
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

test("executed focused-link keyboard and mocked scrollbar delivery support native input paths", async () => {
  for (const mode of ["keyboard", "gutter"]) await withFixture(async s => {
    initialiseHomeJourney();
    if (mode === "keyboard") s.fire(s.win, "keydown", { key: "PageDown" });
    else s.fire(s.win, "pointerdown", { clientX: 1430, pointerType: "mouse", buttons: 1 });
    assert.equal(s.video.src, undefined);
    s.win.scrollY = 100;
    s.fire(s.win, "scroll");
    await s.settle();
    assert.equal(s.requests[0].source, "/videos/hero-journey-scrub.mp4");
    assert.equal(s.video.src, "blob:owned-fixture-1");
  });
  // Real browser event delivery from a native scrollbar is deliberately not
  // represented by this mock and remains a separate runtime test.
});

test("executed reduction, short-height and hidden/offscreen guards stop enhancement work", () => withFixture(async s => {
  initialiseHomeJourney();
  s.fire(s.win, "wheel");
  s.win.scrollY = 100;
  s.fire(s.win, "scroll");
  await s.settle();
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

test("data-saving preference uses the complete static hero and releases an attached reel", () => withFixture(async s => {
  s.connection.saveData = true;
  initialiseHomeJourney();
  assert.equal(s.root.classes.has("is-enhanced"), false);
  s.fire(s.win, "wheel");
  s.win.scrollY = 100;
  s.fire(s.win, "scroll");
  s.flush();
  assert.equal(s.video.src, undefined);
  assert.equal(s.video.loads, 0);
  s.connection.saveData = false;
  s.fire(s.connection, "change");
  s.flush();
  assert.equal(s.root.classes.has("is-enhanced"), true);
  assert.equal(s.video.src, undefined, "preference change alone cannot initiate video");
  s.fire(s.win, "wheel");
  s.win.scrollY = 200;
  s.fire(s.win, "scroll");
  await s.settle();
  assert.ok(s.video.src);
  s.connection.saveData = true;
  s.fire(s.connection, "change");
  assert.equal(s.root.classes.has("is-enhanced"), false);
  assert.equal(s.video.src, undefined);
  assert.equal(s.frames.size, 0);
}));

test("browsers without Network Information keep the ordinary scroll gate", () => withFixture(async s => {
  s.win.navigator = {};
  initialiseHomeJourney();
  assert.equal(s.video.src, undefined);
  s.fire(s.win, "wheel");
  s.win.scrollY = 100;
  s.fire(s.win, "scroll");
  await s.settle();
  assert.ok(s.video.src);
}));

test("a pending owned fetch is single-flight and does not attach before the complete blob", () => withFixture(async s => {
  let finishBody!: (blob: Blob) => void;
  s.setFetch(async () => ({ ok: true, blob: () => new Promise<Blob>(resolve => { finishBody = resolve; }) }));
  initialiseHomeJourney(); s.flush();
  assert.equal(s.requests.length, 0);
  s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll");
  await s.settle();
  for (const y of [150, 200, 250]) { s.fire(s.win, "wheel"); s.win.scrollY = y; s.fire(s.win, "scroll"); }
  assert.equal(s.requests.length, 1);
  assert.equal(s.video.src, undefined); assert.equal(s.video.loads, 0);
  assert.equal(s.frame.classes.has("is-ready"), false);
  finishBody(new Blob(["complete MP4"], { type: "video/mp4" })); await s.settle();
  assert.equal(s.video.src, "blob:owned-fixture-1"); assert.equal(s.video.loads, 1);
  assert.equal(s.requests[0].options.redirect, "error");
  assert.equal(s.requests[0].options.credentials, "same-origin");
  s.fire(s.win, "wheel"); s.win.scrollY = 300; s.fire(s.win, "scroll"); await s.settle();
  assert.equal(s.requests.length, 1, "the video does not redownload the original URL");
}));

test("pagehide aborts pending data and BFCache restoration requires fresh input; stale responses cannot win", () => withFixture(async s => {
  let finishOld!: (response: unknown) => void;
  const old = new Promise(resolve => { finishOld = resolve; });
  s.setFetch(() => old);
  initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll");
  assert.equal(s.requests.length, 1);
  s.fire(s.win, "pagehide", { persisted: true });
  assert.equal(s.requests[0].options.signal.aborted, true);
  s.fire(s.win, "pageshow", { persisted: true }); s.flush();
  assert.equal(s.requests.length, 1, "restoration alone does not fetch");
  s.setFetch(async () => ({ ok: true, blob: async () => new Blob(["new generation"], { type: "video/mp4" }) }));
  s.fire(s.win, "wheel"); s.win.scrollY = 200; s.fire(s.win, "scroll"); await s.settle();
  const fresh = s.video.src;
  let staleBodyRead = false;
  finishOld({ ok: true, blob: async () => { staleBodyRead = true; return new Blob(["stale"], { type: "video/mp4" }); } });
  await s.settle();
  assert.equal(staleBodyRead, false); assert.equal(s.video.src, fresh);
  assert.deepEqual(s.createdURLs, ["blob:owned-fixture-1"]);
  s.fire(s.win, "pagehide"); assert.equal(s.video.src, undefined);
  assert.deepEqual(s.revokedURLs, [fresh]);
  s.fire(s.win, "pagehide"); assert.deepEqual(s.revokedURLs, [fresh], "repeated cleanup does not revoke another owner");
}));

test("a body completing after reset is discarded before URL creation", () => withFixture(async s => {
  let finishBody!: (blob: Blob) => void;
  s.setFetch(async () => ({ ok: true, blob: () => new Promise<Blob>(resolve => { finishBody = resolve; }) }));
  initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll"); await s.settle();
  s.fire(s.win, "pageshow");
  finishBody(new Blob(["late body"], { type: "video/mp4" })); await s.settle();
  assert.equal(s.requests[0].options.signal.aborted, true);
  assert.equal(s.video.src, undefined); assert.deepEqual(s.createdURLs, []);
}));

test("reduction, data saving, hiding and leaving the hero abort a pending fetch", async () => {
  for (const mode of ["reduced", "save-data", "hidden", "offscreen"]) await withFixture(async s => {
    let finish!: (response: unknown) => void;
    s.setFetch(() => new Promise(resolve => { finish = resolve; }));
    initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll");
    if (mode === "reduced") { s.reduced.matches = true; s.fire(s.reduced, "change"); }
    if (mode === "save-data") { s.connection.saveData = true; s.fire(s.connection, "change"); }
    if (mode === "hidden") { s.doc.hidden = true; s.fire(s.doc, "visibilitychange"); }
    if (mode === "offscreen") { s.win.scrollY = 3000; s.fire(s.win, "scroll"); }
    assert.equal(s.requests[0].options.signal.aborted, true, mode);
    finish({ ok: true, blob: async () => new Blob(["late"], { type: "video/mp4" }) }); await s.settle();
    assert.equal(s.video.src, undefined); assert.deepEqual(s.createdURLs, []);
  });
});

test("fetch, HTTP, body and MIME failures keep the poster without automatic retries", async () => {
  for (const mode of ["network", "http", "body", "empty", "html"]) await withFixture(async s => {
    s.setFetch(async () => {
      if (mode === "network") throw new Error("fixture network failure");
      return { ok: mode !== "http", blob: async () => {
        if (mode === "body") throw new Error("fixture body failure");
        return new Blob(mode === "empty" ? [] : ["fixture"], { type: mode === "html" ? "text/html" : "video/mp4" });
      } };
    });
    initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll"); await s.settle();
    assert.equal(s.video.src, undefined, mode); assert.equal(s.frame.classes.has("is-ready"), false);
    assert.deepEqual(s.createdURLs, []);
    s.fire(s.win, "wheel"); s.win.scrollY = 200; s.fire(s.win, "scroll"); await s.settle();
    assert.equal(s.requests.length, 1, mode);
  });
});

test("only the three owned responsive files can be fetched and only blob URLs reach video src", async () => {
  for (const [width, source] of [[390, "/videos/hero-journey-scrub-720.mp4"], [1440, "/videos/hero-journey-scrub.mp4"], [1920, "/videos/hero-journey-scrub-2560.mp4"]]) await withFixture(async s => {
    s.win.innerWidth = width;
    initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll"); await s.settle();
    assert.equal(s.requests.length, 1); assert.equal(s.requests[0].source, source);
    assert.match(s.video.src, /^blob:/);
    s.fire(s.video, "error"); assert.equal(s.video.src, undefined);
    assert.deepEqual(s.revokedURLs, ["blob:owned-fixture-1"]);
  });
  await withFixture(async s => {
    s.video.dataset.src = "https://unapproved.example/movie.mp4";
    initialiseHomeJourney(); s.fire(s.win, "wheel"); s.win.scrollY = 100; s.fire(s.win, "scroll"); await s.settle();
    assert.equal(s.requests.length, 0); assert.equal(s.video.src, undefined);
  });
});
