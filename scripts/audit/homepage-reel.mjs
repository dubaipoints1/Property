// Opt-in browser regression against a built homepage. No external requests
// unless a live homepage is explicitly passed instead of a dist directory.
// node scripts/audit/homepage-reel.mjs [dist-or-URL] [baseline-dist]
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { startStaticServer } from "./_lib.mjs";

const REEL = "[data-reel]";
const STAGE = "[data-reel-stage]";
const VIDEO = "[data-reel-video]";
const POSTER = "[data-reel-poster]";
const isVideo = (url) => /^\/videos\/hero-journey-scrub(?:-\d+)?\.mp4$/.test(url.pathname);
const reelPath = (width) => `/videos/hero-journey-scrub${width <= 899 ? "-720" : width >= 1600 ? "-2560" : ""}.mp4`;
const mobile = { width: 390, height: 844 };
const servers = [];

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

async function firstScreen(page) {
  const opening = await page.evaluate(({ STAGE, VIDEO, POSTER }) => {
    const stage = document.querySelector(STAGE);
    const video = stage.querySelector(VIDEO);
    const poster = stage.querySelector(POSTER);
    const title = stage.querySelector("h1");
    const lede = stage.querySelector(".hp-hero-lede");
    const buttons = Array.from(stage.querySelectorAll(".hp-hero-ctas a"));
    const style = (node) => {
      const rect = node.getBoundingClientRect();
      const css = getComputedStyle(node);
      return { rect: [rect.x, rect.y, rect.width, rect.height], font: css.fontFamily, size: css.fontSize, colour: css.color, opacity: css.opacity };
    };
    return {
      poster: poster?.getAttribute("src") ?? video.getAttribute("poster"),
      title: [title.textContent, style(title)],
      lede: [lede.textContent.trim(), style(lede)],
      buttons: buttons.map((button) => [button.textContent, button.getAttribute("href"), style(button)]),
      stage: style(stage),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      y: window.scrollY,
    };
  }, { STAGE, VIDEO, POSTER });
  assert.match(opening.poster, /^\/images\//, "The homepage retains its poster");
  assert.match(opening.title[0], /^Fly further\. Pay less\.$/);
  assert.deepEqual(opening.buttons.map((button) => button[1]), ["#tools", "#latest"]);
  assert.equal(opening.documentWidth, opening.viewportWidth, "No homepage overflow");
  assert.equal(opening.y, 0, "First screen starts at the top");
  for (const link of await page.locator(`${STAGE} .hp-hero-ctas a`).all()) {
    assert.equal(await link.isVisible(), true);
    assert.ok((await link.boundingBox()).height >= 44, "Hero tap target remains at least 44px high");
  }
  await page.waitForFunction(async (url) => {
    const image = new Image();
    image.src = url;
    try { await image.decode(); return image.naturalWidth > 0; } catch { return false; }
  }, opening.poster);
  return opening;
}

async function visualDifference(before, after) {
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
  await page.evaluate(({ REEL, STAGE, progress }) => {
    const reel = document.querySelector(REEL);
    const stage = document.querySelector(STAGE);
    window.scrollTo({ top: window.scrollY + reel.getBoundingClientRect().top + (reel.offsetHeight - stage.offsetHeight) * progress, behavior: "instant" });
  }, { REEL, STAGE, progress });
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
      return { y: window.scrollY, progress: reel.style.getPropertyValue("--p"), time: video.currentTime, duration: video.duration, paused: video.paused, seeking: video.seeking, ready: video.readyState, reelTop: reel.getBoundingClientRect().top, classes: reel.className };
    }, { REEL, VIDEO });
    throw new Error(`Scrub did not settle at ${progress}: ${JSON.stringify(state)}`, { cause: error });
  }
}

let browser;
try {
  const origin = await address(process.argv[2] ?? "dist");
  const baseline = process.argv[3] ? await address(process.argv[3]) : null;
  browser = await chromium.launch({ executablePath: process.env.DP_CHROME_PATH || undefined });

  for (const viewport of [{ ...mobile, width: 360 }, mobile, { width: 1440, height: 900 }, { width: 1920, height: 1000 }]) {
    const { context, page, requests, errors } = await open(browser, origin, viewport);
    try {
      const opening = await firstScreen(page);
      if (baseline) {
        // Both are compared as posters, not as differently decoded first
        // video frames. The released baseline requests video immediately.
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
      if (viewport.width < 768) {
        await swipeUp(context, page, () => assert.deepEqual(requests, [], "Touch-down alone does not fetch the video"));
      } else {
        await page.keyboard.press("PageDown");
      }
      await page.waitForFunction(() => window.scrollY > 30);
      await page.waitForFunction((VIDEO) => {
        const video = document.querySelector(VIDEO);
        return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.duration > 0;
      }, VIDEO, { timeout: 20000 });
      assert.deepEqual([...new Set(requests)], [reelPath(viewport.width)], "Only the correct responsive version is fetched");
      await waitForScrollToSettle(page);
      await scrub(page, 0.65, 0.55, 0.72);
      await scrub(page, 0.12, 0.07, 0.2);
      await scrub(page, 0.97, 0.9, 0.999);
      await page.keyboard.press("PageDown");
      await page.waitForFunction((REEL) => document.querySelector(REEL).getBoundingClientRect().bottom < window.innerHeight, REEL);
      assert.deepEqual(errors, [], "No homepage script errors");
      console.log(`${viewport.width}px: no pre-scroll video; ${reelPath(viewport.width)} loads on ${viewport.width < 768 ? "touch" : "keyboard"} scroll, seeks both ways, and scroll leaves the stage`);
    } finally {
      await context.close();
    }
  }

  let releaseVideo;
  const held = new Promise((resolve) => { releaseVideo = resolve; });
  const stalled = await open(browser, origin, mobile, { videoRoute: async (route) => { await held; await route.abort(); } });
  try {
    const initial = await firstScreen(stalled.page);
    await Promise.all([
      stalled.page.waitForRequest((request) => isVideo(new URL(request.url()))),
      jumpToReelProgress(stalled.page, 0.6),
    ]);
    assert.equal(await stalled.page.locator(POSTER).getAttribute("src"), initial.poster);
    assert.equal(await stalled.page.locator(POSTER).isVisible(), true);
    assert.equal(await stalled.page.locator(`${REEL}.has-reel-frame`).count(), 0);
    assert.equal(await stalled.page.locator(`${STAGE} h1`).isVisible(), true, "Waiting for a frame leaves the title visible");
    assert.equal(await stalled.page.locator(`${STAGE} .hp-reel-title`).evaluate((title) => getComputedStyle(title).opacity), "1", "Waiting for a frame does not dim the title");
    assert.equal(await stalled.page.locator(`${STAGE} a[href='#tools']`).isVisible(), true, "Waiting for a frame leaves the main action visible");
    releaseVideo();
    await stalled.page.waitForFunction((VIDEO) => Boolean(document.querySelector(VIDEO).error), VIDEO);
    await stalled.page.locator(`${STAGE} a[href='#tools']`).click();
    assert.equal(new URL(stalled.page.url()).hash, "#tools", "After media failure the first action still works");
    assert.deepEqual(stalled.errors, [], "Media failure does not raise a script error");
    console.log("390px: stalled and failed media keep the poster, headline and working tool link");
  } finally {
    releaseVideo();
    await stalled.context.close();
  }

  const direct = await open(browser, origin, mobile);
  try {
    await direct.page.locator(`${STAGE} a[href='#tools']`).click();
    await direct.page.waitForFunction((REEL) => document.querySelector(REEL).getBoundingClientRect().bottom <= 0, REEL);
    await waitForScrollToSettle(direct.page);
    assert.equal(new URL(direct.page.url()).hash, "#tools");
    assert.deepEqual(direct.requests, [], "A direct jump past the reel never requests video");
  } finally {
    await direct.context.close();
  }
  const smallScroll = await open(browser, origin, mobile);
  try {
    const [request] = await Promise.all([
      smallScroll.page.waitForRequest((request) => isVideo(new URL(request.url()))),
      smallScroll.page.evaluate(() => window.scrollTo({ top: 12, behavior: "instant" })),
    ]);
    assert.equal(new URL(request.url()).pathname, reelPath(mobile.width));
    assert.equal(await smallScroll.page.evaluate(() => window.scrollY), 12);
    console.log("390px: a 12px scroll triggers the reel; direct jump to tools does not");
  } finally {
    await smallScroll.context.close();
  }

  for (const mode of [{ reducedMotion: "reduce" }, { javaScriptEnabled: false }]) {
    const { context, page, requests, errors } = await open(browser, origin, mobile, mode);
    try {
      await firstScreen(page);
      assert.equal(await page.locator(`${REEL}.is-scrub`).count(), 0, "Static alternatives use one screen");
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
  for (const server of servers) server.close();
}
