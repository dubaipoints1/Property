// Opt-in browser regression against a built homepage. No external requests
// unless a live homepage is explicitly passed instead of a dist directory.
// node scripts/audit/homepage-reel.mjs [dist-or-URL] [baseline-dist]
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { startStaticServer } from "./_lib.mjs";

export const JOURNEY_SELECTORS = Object.freeze({
  root: "[data-home-journey]", stage: "[data-journey-stage]", video: "[data-journey-video]",
  poster: ".journey-poster", frame: "[data-journey-frame]", copy: "[data-journey-copy]",
});
const { root: REEL, stage: STAGE, video: VIDEO, poster: POSTER, frame: FRAME } = JOURNEY_SELECTORS;
const isVideo = (url) => /^\/videos\/hero-journey-scrub(?:-\d+)?\.mp4$/.test(url.pathname);
export const reelPath = (width) => `/videos/hero-journey-scrub${width <= 899 ? "-720" : width >= 1600 ? "-2560" : ""}.mp4`;
const mobile = { width: 390, height: 844 };
const tallMobile = { width: 390, height: 920 };
const servers = [];

// Mirror the actual controller's geometry, not the obsolete pre-Aperture
// track: the sticky header is part of the progress origin.
export function journeyScrollTarget({ scrollY, rootTop, rootHeight, stageHeight, headerHeight }, progress) {
  assert.ok([scrollY, rootTop, rootHeight, stageHeight, headerHeight, progress].every(Number.isFinite));
  assert.ok(progress >= 0 && progress <= 1);
  return scrollY + rootTop - headerHeight + Math.max(1, rootHeight - stageHeight) * progress;
}

export function eligibleStageHeight(width, height, headerHeight) {
  // Current enhanced CSS is 100svh minus the header, with a 640px phone
  // floor. A rejected natural-height stage must not certify its own fit.
  assert.ok([width, height, headerHeight].every(Number.isFinite));
  return Math.floor(width <= 700 ? Math.max(640, height - headerHeight) : height - headerHeight);
}

async function address(input) {
  if (/^https?:\/\//.test(input)) return new URL(input).origin;
  const server = await startStaticServer({ distDir: path.resolve(input) });
  servers.push(server);
  return server.baseUrl;
}

async function open(browser, origin, viewport, { reducedMotion = "no-preference", javaScriptEnabled = true, videoRoute } = {}) {
  const phone = viewport.width < 768;
  const context = await browser.newContext({ viewport, isMobile: phone, hasTouch: phone, deviceScaleFactor: phone ? 2 : 1, reducedMotion, javaScriptEnabled, colorScheme: "light" });
  const requests = [];
  const errors = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (isVideo(url)) {
      requests.push(url.pathname);
      if (videoRoute) return videoRoute(route);
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${origin}/`, { waitUntil: "load" });
  assert.equal(response?.status(), 200);
  await page.evaluate(() => document.fonts.ready.then(() => null));
  return { context, page, requests, errors };
}

async function firstScreen(page, { javaScriptEnabled = true } = {}) {
  const opening = await page.evaluate(({ REEL, STAGE, VIDEO, POSTER }) => {
    const root = document.querySelector(REEL);
    const stage = document.querySelector(STAGE);
    if (!root || !stage) throw new Error("Current Journey Aperture root/stage is missing");
    const video = stage.querySelector(VIDEO);
    const poster = stage.querySelector(POSTER);
    const title = stage.querySelector("h1");
    const lede = stage.querySelector(".journey-deck");
    const copy = stage.querySelector("[data-journey-copy]");
    const foot = stage.querySelector("[data-journey-foot]");
    const buttons = Array.from(stage.querySelectorAll(".journey-actions a"));
    if (!video || !poster || !title || !lede || !copy || !foot) throw new Error("Current journey composition is incomplete");
    const style = (node) => {
      const rect = node.getBoundingClientRect();
      const css = getComputedStyle(node);
      return { rect: [rect.x, rect.y, rect.width, rect.height], font: css.fontFamily, size: css.fontSize, colour: css.color, opacity: css.opacity };
    };
    const headerHeight = document.querySelector(".dp-header")?.offsetHeight ?? 0;
    const css = getComputedStyle(stage);
    const contentHeight = copy.offsetHeight + foot.offsetHeight + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom) + 8;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saving = navigator.connection?.saveData === true;
    return {
      poster: poster.getAttribute("src"),
      posterCurrent: new URL(poster.currentSrc).pathname,
      source: video.getAttribute("src"), preload: video.getAttribute("preload"), autoplay: video.hasAttribute("autoplay"),
      sourceElements: video.querySelectorAll("source").length,
      videoOpacity: getComputedStyle(video).opacity,
      enhanced: root.classList.contains("is-enhanced"),
      allowed: !reduced && !saving && innerHeight >= 480 && (innerWidth > 700 || innerHeight - headerHeight >= 640),
      width: innerWidth, height: innerHeight, headerHeight, contentHeight,
      title: [title.textContent.replace(/\s+/g, " ").trim(), style(title)],
      lede: [lede.textContent.trim(), style(lede)],
      buttons: buttons.map((button) => [button.textContent, button.getAttribute("href"), style(button)]),
      stage: style(stage),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      y: window.scrollY,
    };
  }, { REEL, STAGE, VIDEO, POSTER });
  opening.canEnhance = opening.allowed && opening.contentHeight <= eligibleStageHeight(opening.width, opening.height, opening.headerHeight);
  assert.match(opening.poster, /^\/images\//, "The homepage retains its poster");
  assert.match(opening.title[0], /^Fly further\. Pay less\.$/);
  assert.match(opening.posterCurrent, /^\/images\//);
  assert.equal(opening.source, null, "No initial video source");
  assert.equal(opening.preload, "none");
  assert.equal(opening.autoplay, false);
  assert.equal(opening.sourceElements, 0);
  assert.equal(opening.videoOpacity, "0", "The opening poster is not covered by an undecoded video");
  assert.equal(opening.enhanced, javaScriptEnabled && opening.canEnhance, "Enhancement follows real content-fit and static guards");
  assert.deepEqual(opening.buttons.map((button) => button[1]), ["#tools", "#latest"]);
  assert.equal(opening.documentWidth, opening.viewportWidth, "No homepage overflow");
  assert.equal(opening.y, 0, "First screen starts at the top");
  assert.equal(opening.buttons.length, 2, "Both real hero actions remain present");
  for (const link of await page.locator(`${STAGE} .journey-actions a`).all()) {
    assert.equal(await link.isVisible(), true);
    assert.ok((await link.boundingBox()).height >= 44, "Hero tap target remains at least 44px high");
  }
  await page.waitForFunction((POSTER) => {
    const image = document.querySelector(POSTER);
    return image?.complete && image.naturalWidth > 0;
  }, POSTER);
  return opening;
}

export async function visualDifference(before, after) {
  const [a, b] = await Promise.all([before, after].map((image) => sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  assert.deepEqual(a.info, b.info, "Opening stage screenshot dimensions are unchanged");
  let changed = 0;
  for (let i = 0; i < a.data.length; i += a.info.channels) {
    if (a.data.subarray(i, i + a.info.channels).some((value, channel) => Math.abs(value - b.data[i + channel]) > 8)) changed++;
  }
  return changed / (a.info.width * a.info.height) * 100;
}

async function swipeUp(context, page, checkBeforeMove) {
  const cdp = await context.newCDPSession(page);
  const touch = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: y === undefined ? [] : [{ x: 24, y }] });
  try {
    await touch("touchStart", 695);
    await checkBeforeMove?.();
    for (const y of [660, 620, 580, 540, 510, 480, 450, 425]) await touch("touchMove", y);
    await touch("touchEnd");
  } finally {
    await cdp.detach();
  }
}

async function jumpToReelProgress(page, progress) {
  const geometry = await page.evaluate(({ REEL, STAGE }) => {
    const reel = document.querySelector(REEL);
    const stage = document.querySelector(STAGE);
    return { scrollY, rootTop: reel.getBoundingClientRect().top, rootHeight: reel.getBoundingClientRect().height,
      stageHeight: stage.offsetHeight, headerHeight: document.querySelector(".dp-header")?.offsetHeight ?? 0 };
  }, { REEL, STAGE });
  await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), journeyScrollTarget(geometry, progress));
}

async function waitForScrollToSettle(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const start = performance.now();
    let lastY = window.scrollY;
    let stillSince = start;
    const sample = (now) => {
      if (window.scrollY !== lastY) {
        lastY = window.scrollY;
        stillSince = now;
      }
      if (now - stillSince > 180) resolve();
      else if (now - start > 3000) reject(new Error("Native scroll did not settle"));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

async function scrub(page, progress, minimum, maximum) {
  await jumpToReelProgress(page, progress);
  try {
    await page.waitForFunction(({ VIDEO, minimum, maximum }) => {
      const video = document.querySelector(VIDEO);
      const position = video.currentTime / video.duration;
      return video.paused && !video.seeking && position > minimum && position < maximum;
    }, { VIDEO, minimum, maximum }, { timeout: 10000 });
  } catch (error) {
    const state = await page.evaluate(({ REEL, VIDEO }) => {
      const reel = document.querySelector(REEL);
      const video = document.querySelector(VIDEO);
      return { y: window.scrollY, progress: reel.style.getPropertyValue("--journey-progress"), time: video.currentTime, duration: video.duration, paused: video.paused, seeking: video.seeking, ready: video.readyState, reelTop: reel.getBoundingClientRect().top, classes: reel.className };
    }, { REEL, VIDEO });
    throw new Error(`Scrub did not settle at ${progress}: ${JSON.stringify(state)}`, { cause: error });
  }
}

export async function runHomepageReelAudit(input = "dist", baselineInput) {
let browser;
try {
  const origin = await address(input);
  const baseline = baselineInput ? await address(baselineInput) : null;
  browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });

  let enhancedPhones = 0, enhancedDesktops = 0;
  for (const viewport of [{ ...mobile, width: 360 }, mobile, tallMobile, { width: 1440, height: 900 }, { width: 1920, height: 1000 }]) {
    const { context, page, requests, errors } = await open(browser, origin, viewport);
    try {
      const opening = await firstScreen(page);
      if (baseline) {
        // Both are compared as actual picture posters, before any media
        // request. The supplied baseline also uses Journey Aperture.
        const before = await open(browser, baseline, viewport, { videoRoute: (route) => route.abort() });
        try {
          assert.deepEqual(opening, await firstScreen(before.page), "Initial layout, typography, artwork and links are unchanged");
          const screenshots = await Promise.all([before.page, page].map((p) => p.locator(STAGE).screenshot({ animations: "disabled" })));
          const difference = await visualDifference(...screenshots);
          // An image and a video poster can rasterise fractionally differently.
          assert.ok(difference < 0.5, `Initial-stage visual difference: ${difference.toFixed(3)}%`);
          console.log(`${viewport.width}px: initial poster/hero layout matches the baseline (${difference.toFixed(3)}% pixels differ by >8 RGB levels)`);
        } finally {
          await before.context.close();
        }
      }
      // A load event alone is not enough to catch a timer-triggered fetch.
      await page.waitForTimeout(500);
      assert.deepEqual(requests, [], `${viewport.width}px: no video before scrolling`);
      if (!opening.enhanced) {
        // A content-fit/static guard is part of the current contract, not
        // an excuse to pass a broken enhanced viewport silently.
        assert.equal(opening.canEnhance, false);
        await swipeUp(context, page);
        await page.waitForTimeout(300);
        assert.deepEqual(requests, [], "A content-fit static hero never downloads video");
        assert.deepEqual(errors, []);
        console.log(`${viewport.width}×${viewport.height}: real content-fit guard retains the complete static poster hero`);
        continue;
      }
      if (viewport.width < 768) enhancedPhones++; else enhancedDesktops++;
      if (viewport.width < 768) {
        await swipeUp(context, page, () => assert.deepEqual(requests, [], "Touch-down alone does not fetch the video"));
      } else {
        await page.locator(`${STAGE} .journey-actions a`).first().focus();
        await page.keyboard.press("PageDown");
      }
      await page.waitForFunction(() => window.scrollY > 30);
      await page.waitForFunction((VIDEO) => {
        const video = document.querySelector(VIDEO);
        return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.duration > 0;
      }, VIDEO, { timeout: 20000 });
      assert.deepEqual(requests, [reelPath(viewport.width)], "Exactly one correct responsive video fetch");
      assert.equal(await page.locator(VIDEO).getAttribute("src").then(src => src?.startsWith("blob:")), true, "Only the completed local blob is assigned to video");
      await waitForScrollToSettle(page);
      await scrub(page, 0.65, 0.55, 0.72);
      await page.waitForFunction(({ FRAME, VIDEO }) => document.querySelector(FRAME).classList.contains("is-ready") && getComputedStyle(document.querySelector(VIDEO)).opacity === "1", { FRAME, VIDEO });
      await scrub(page, 0.12, 0.07, 0.2);
      await scrub(page, 0.97, 0.9, 0.999);
      assert.deepEqual(requests, [reelPath(viewport.width)], "Scrubbing does not refetch the full video");
      for (let attempts = 0; attempts < 3; attempts++) {
        const outside = await page.evaluate(REEL => document.querySelector(REEL).getBoundingClientRect().bottom <= (document.querySelector(".dp-header")?.offsetHeight ?? 0) + 40, REEL);
        if (outside) break;
        await page.keyboard.press("PageDown");
        await waitForScrollToSettle(page);
      }
      await page.waitForFunction((REEL) => document.querySelector(REEL).getBoundingClientRect().bottom <= (document.querySelector(".dp-header")?.offsetHeight ?? 0) + 40, REEL);
      assert.deepEqual(errors, [], "No homepage script errors");
      console.log(`${viewport.width}px: no pre-scroll video; ${reelPath(viewport.width)} loads on ${viewport.width < 768 ? "touch" : "keyboard"} scroll, seeks both ways, and scroll leaves the stage`);
    } finally {
      await context.close();
    }
  }
  assert.ok(enhancedPhones > 0 && enhancedDesktops > 0, "Real decoding/scrubbing must pass on phone and desktop; static guards cannot skip every motion case");

  let releaseVideo;
  const held = new Promise((resolve) => { releaseVideo = resolve; });
  const stalled = await open(browser, origin, tallMobile, { videoRoute: async (route) => { await held; await route.abort(); } });
  try {
    const initial = await firstScreen(stalled.page);
    assert.equal(initial.enhanced, true, "Stall/failure case exercises an eligible enhanced phone");
    await Promise.all([
      stalled.page.waitForRequest((request) => isVideo(new URL(request.url()))),
      swipeUp(stalled.context, stalled.page),
    ]);
    assert.equal(await stalled.page.locator(POSTER).getAttribute("src"), initial.poster);
    assert.equal(await stalled.page.locator(POSTER).isVisible(), true);
    assert.equal(await stalled.page.locator(`${FRAME}.is-ready`).count(), 0);
    assert.deepEqual(stalled.requests, [reelPath(tallMobile.width)], "The stalled/failed media is not automatically retried");
    assert.equal(await stalled.page.locator(`${STAGE} h1`).isVisible(), true, "Waiting for a frame leaves the title visible");
    assert.equal(await stalled.page.locator(`${STAGE} h1`).evaluate((title) => getComputedStyle(title).opacity), "1", "Waiting for a frame does not dim the title");
    assert.equal(await stalled.page.locator(`${STAGE} a[href='#tools']`).isVisible(), true, "Waiting for a frame leaves the main action visible");
    const failedRequest = stalled.page.waitForEvent("requestfailed", { predicate: request => isVideo(new URL(request.url())) });
    releaseVideo();
    await failedRequest;
    await stalled.page.waitForTimeout(300);
    assert.equal(await stalled.page.locator(VIDEO).getAttribute("src"), null, "A failed fetch never attaches an incomplete video");
    assert.equal(await stalled.page.locator(`${FRAME}.is-ready`).count(), 0);
    await stalled.page.locator(`${STAGE} a[href='#tools']`).click();
    assert.equal(new URL(stalled.page.url()).hash, "#tools", "After media failure the first action still works");
    assert.deepEqual(stalled.errors, [], "Media failure does not raise a script error");
    console.log("390px: stalled and failed media keep the poster, headline and working tool link");
  } finally {
    releaseVideo();
    await stalled.context.close();
  }

  const direct = await open(browser, origin, tallMobile);
  try {
    await direct.page.locator(`${STAGE} a[href='#tools']`).click();
    await direct.page.waitForFunction((REEL) => document.querySelector(REEL).getBoundingClientRect().bottom <= (document.querySelector(".dp-header")?.offsetHeight ?? 0) + 40, REEL);
    await waitForScrollToSettle(direct.page);
    assert.equal(new URL(direct.page.url()).hash, "#tools");
    assert.deepEqual(direct.requests, [], "A direct jump past the reel never requests video");
  } finally {
    await direct.context.close();
  }
  const smallScroll = await open(browser, origin, tallMobile);
  try {
    await firstScreen(smallScroll.page);
    await smallScroll.page.evaluate(() => window.scrollTo({ top: 12, behavior: "instant" }));
    await smallScroll.page.waitForTimeout(350);
    assert.deepEqual(smallScroll.requests, [], "Programmatic scrolling alone must not fetch media");
    const [request] = await Promise.all([
      smallScroll.page.waitForRequest((request) => isVideo(new URL(request.url()))),
      smallScroll.page.mouse.wheel(0, 12),
    ]);
    assert.equal(new URL(request.url()).pathname, reelPath(mobile.width));
    assert.ok(await smallScroll.page.evaluate(() => window.scrollY > 12));
    console.log("390px: scripted 12px scroll does not fetch; subsequent trusted scrolling loads the reel; direct tools jump does not");
  } finally {
    await smallScroll.context.close();
  }

  for (const mode of [{ reducedMotion: "reduce" }, { javaScriptEnabled: false }]) {
    const { context, page, requests, errors } = await open(browser, origin, mobile, mode);
    try {
      await firstScreen(page, mode);
      assert.equal(await page.locator(`${REEL}.is-enhanced`).count(), 0, "Static alternatives do not use the sticky animation track");
      await page.locator(`${STAGE} a[href='#tools']`).click();
      assert.equal(new URL(page.url()).hash, "#tools");
      await page.waitForTimeout(300);
      assert.deepEqual(requests, [], "Static alternative never downloads video, including on navigation");
      assert.deepEqual(errors, []);
      console.log(`390px: ${mode.reducedMotion ? "reduced motion" : "JavaScript off"} uses the poster, working CTA, and no video request`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  for (const server of servers.splice(0)) await server.close();
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await runHomepageReelAudit(process.argv[2] ?? "dist", process.argv[3]);
}
