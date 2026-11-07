/**
 * Owner-selected Journey Aperture. Normal document scrolling only.
 * Production probes: [data-home-journey], [data-journey-stage],
 * [data-journey-copy], [data-journey-foot], [data-journey-frame],
 * [data-journey-video]. Enhancement is .is-enhanced; decoded frame .is-ready;
 * visual progress is --journey-progress. No source exists at initial render.
 */
export function initialiseHomeJourney() {
  const root = document.querySelector<HTMLElement>("[data-home-journey]");
  if (!root) return;
  const stage = root.querySelector<HTMLElement>("[data-journey-stage]");
  const copy = root.querySelector<HTMLElement>("[data-journey-copy]");
  const foot = root.querySelector<HTMLElement>("[data-journey-foot]");
  const video = root.querySelector<HTMLVideoElement>("[data-journey-video]");
  const frame = root.querySelector<HTMLElement>("[data-journey-frame]");
  if (!stage || !copy || !foot || !video || !frame) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Respect an existing browser data-saving preference; never change it.
  // Unsupported browsers retain the ordinary poster-first scroll journey.
  const connection = (window.navigator as Navigator & {
    connection?: { saveData?: boolean; addEventListener?: (type: string, listener: () => void) => void };
  } | undefined)?.connection;
  let headerHeight = 0;
  let raf = 0;
  let intentAt = -Infinity;
  let desiredProgress = 0;
  let attached = false;
  let pending = false;
  let generation = 0;
  let mediaRequest: AbortController | null = null;
  let mediaURL: string | null = null;
  let enhancement = false;
  let failed = false;
  let scrollbarDragging = false;
  let previousY = window.scrollY;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const withinHero = () => {
    const rect = root.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > headerHeight + 40;
  };
  const progress = () => {
    const rect = root.getBoundingClientRect();
    return clamp((headerHeight - rect.top) / Math.max(1, rect.height - stage.offsetHeight));
  };
  const clearIntent = () => { intentAt = -Infinity; scrollbarDragging = false; };
  const cancelFrame = () => { if (raf) window.cancelAnimationFrame(raf); raf = 0; };
  const detach = () => {
    generation++;
    mediaRequest?.abort();
    mediaRequest = null;
    pending = false;
    video.pause();
    frame.classList.remove("is-ready");
    if (attached) { video.removeAttribute("src"); video.load(); }
    attached = false;
    if (mediaURL) { window.URL.revokeObjectURL(mediaURL); mediaURL = null; }
    failed = false;
  };
  const ownedMedia = new Set([
    "/videos/hero-journey-scrub-720.mp4",
    "/videos/hero-journey-scrub.mp4",
    "/videos/hero-journey-scrub-2560.mp4",
  ]);
  // The static host returns the complete MP4 even for a Range request. A
  // single complete same-origin fetch becomes a locally seekable media blob;
  // the video element must never also download the original URL.
  const loadMedia = async (source: string) => {
    if (pending || attached || failed) return;
    if (!ownedMedia.has(source) || typeof window.fetch !== "function"
      || typeof window.URL?.createObjectURL !== "function" || typeof window.URL?.revokeObjectURL !== "function"
      || typeof AbortController !== "function") {
      failed = true;
      return;
    }
    const requestGeneration = ++generation;
    const request = new AbortController();
    mediaRequest = request;
    pending = true;
    try {
      const response = await window.fetch(source, { signal: request.signal, credentials: "same-origin", redirect: "error" });
      if (requestGeneration !== generation || request.signal.aborted) return;
      if (!response.ok) throw new Error("Journey media unavailable");
      const blob = await response.blob();
      if (requestGeneration !== generation || request.signal.aborted) return;
      if (!enhancement || document.hidden || !withinHero() || reduced.matches || connection?.saveData === true) return;
      if (!blob.size || blob.type.split(";", 1)[0].trim() !== "video/mp4") throw new Error("Journey media is not an MP4");
      mediaURL = window.URL.createObjectURL(blob);
      attached = true;
      video.preload = "auto";
      video.src = mediaURL;
      video.load();
      queue();
    } catch {
      if (requestGeneration !== generation || request.signal.aborted) return;
      detach();
      failed = true;
      cancelFrame();
    } finally {
      if (requestGeneration === generation) { pending = false; mediaRequest = null; }
    }
  };
  // Called after finite scroll/data/seek events, never an idle animation loop.
  const seek = () => {
    if (!attached || failed || !enhancement || document.hidden || !withinHero() || video.readyState < 2 || video.seeking || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const target = desiredProgress * Math.max(0, video.duration - .08);
    if (Math.abs(video.currentTime - target) > .055) {
      try { video.currentTime = target; } catch { /* Complete poster remains. */ }
    } else frame.classList.add("is-ready");
  };
  const paint = () => {
    raf = 0;
    if (!enhancement || document.hidden) return;
    desiredProgress = progress();
    root.style.setProperty("--journey-progress", desiredProgress.toFixed(4));
    seek();
  };
  const queue = () => { if (!raf && enhancement && !document.hidden) raf = window.requestAnimationFrame(paint); };
  const reset = () => {
    cancelFrame();
    clearIntent();
    desiredProgress = 0;
    root.style.setProperty("--journey-progress", "0");
    detach();
  };
  const measure = () => {
    headerHeight = document.querySelector<HTMLElement>(".dp-header")?.offsetHeight ?? 0;
    root.style.setProperty("--journey-header", `${headerHeight}px`);
    const allowed = !reduced.matches && connection?.saveData !== true && window.innerHeight >= 480
      && (window.innerWidth > 700 || window.innerHeight - headerHeight >= 640);
    root.classList.toggle("is-enhanced", allowed);
    const style = getComputedStyle(stage);
    const contentHeight = copy.offsetHeight + foot.offsetHeight
      + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + 8;
    const next = allowed && contentHeight <= stage.clientHeight;
    if (next !== enhancement) reset();
    enhancement = next;
    root.classList.toggle("is-enhanced", enhancement);
    previousY = window.scrollY;
    queue(); // A layout/font/resize event must never attach media.
  };
  const recordIntent = (event: Event) => {
    if (event.isTrusted && enhancement && withinHero() && !document.hidden) intentAt = performance.now();
  };
  window.addEventListener("wheel", recordIntent, { passive: true });
  window.addEventListener("touchmove", recordIntent, { passive: true });
  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]")) return;
    if (event.key === " " && target instanceof Element && target.closest("button")) return;
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) recordIntent(event);
  });
  // Classic scrollbars occupy the layout gutter. Overlay scrollbars can
  // occupy the last few CSS pixels of the viewport instead. Pointer intent
  // at either edge is insufficient alone: an actual within-hero scroll is
  // still mandatory. Interactive content is never mistaken for the gutter.
  const recordScrollbar = (event: PointerEvent | MouseEvent) => {
    if (!event.isTrusted || event.button !== 0 || !enhancement || document.hidden) return;
    if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, summary, [contenteditable]")) return;
    const documentWidth = document.documentElement.clientWidth;
    const gutter = window.innerWidth - documentWidth;
    const rightEdge = event.clientX >= (gutter > 0 ? documentWidth : window.innerWidth - 16);
    const leftEdge = event.clientX <= 16 && getComputedStyle(document.documentElement).direction === "rtl";
    if ((rightEdge || leftEdge) && withinHero()) {
      scrollbarDragging = true;
      recordIntent(event);
    }
  };
  window.addEventListener("pointerdown", recordScrollbar, { passive: true });
  window.addEventListener("mousedown", recordScrollbar, { passive: true });
  // Some native bars consume pointerdown before the document receives it.
  // A mouse approaching/leaving through the narrow scrollbar edge also arms
  // intent, but never fetches media without a subsequent within-hero scroll.
  // This is input evidence, not a claim that scroll.isTrusted distinguishes
  // all script-induced scrolling. Actual native-bar runtime QA is required.
  const recordScrollbarApproach = (event: PointerEvent) => {
    if (!event.isTrusted || event.pointerType !== "mouse" || !enhancement || document.hidden) return;
    if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, summary, [contenteditable]")) return;
    const documentWidth = document.documentElement.clientWidth;
    const edge = window.innerWidth > documentWidth ? documentWidth - 2 : window.innerWidth - 18;
    if (event.clientX >= edge && withinHero()) {
      recordIntent(event);
      if (event.type === "pointerleave" || event.buttons === 1) scrollbarDragging = true;
    } else if (event.buttons === 0) scrollbarDragging = false;
  };
  window.addEventListener("pointermove", recordScrollbarApproach, { passive: true });
  document.documentElement.addEventListener("pointerleave", recordScrollbarApproach, { passive: true });
  document.documentElement.addEventListener("pointerenter", () => { scrollbarDragging = false; }, { passive: true });
  const releaseScrollbar = () => { scrollbarDragging = false; };
  window.addEventListener("pointerup", releaseScrollbar, { passive: true });
  window.addEventListener("mouseup", releaseScrollbar, { passive: true });
  window.addEventListener("pointercancel", clearIntent, { passive: true });
  window.addEventListener("blur", clearIntent);
  // Navigation/reset events invalidate earlier input, so an anchor jump,
  // history restore or resize alone cannot initiate a request.
  document.addEventListener("click", clearIntent, true);
  window.addEventListener("hashchange", () => { clearIntent(); queue(); });
  window.addEventListener("popstate", () => { clearIntent(); previousY = window.scrollY; queue(); });
  window.addEventListener("pageshow", () => { reset(); previousY = window.scrollY; measure(); });
  window.addEventListener("pagehide", reset);
  window.addEventListener("scroll", () => {
    const changed = Math.abs(window.scrollY - previousY) > .5;
    previousY = window.scrollY;
    if (!enhancement) return;
    const p = progress();
    if (!attached && !pending && !failed && changed && (scrollbarDragging || performance.now() - intentAt < 900)
      && withinHero() && p > 0 && p < .96 && !document.hidden) {
      const source = window.innerWidth <= 899 ? video.dataset.srcSmall
        : window.innerWidth >= 1600 ? video.dataset.srcLarge : video.dataset.src;
      if (source) void loadMedia(source);
    }
    if (!withinHero()) { if (pending) detach(); video.pause(); cancelFrame(); return; }
    queue();
  }, { passive: true });
  video.addEventListener("loadeddata", () => { if (attached && enhancement) queue(); });
  video.addEventListener("seeked", () => {
    if (attached && !failed && enhancement && !document.hidden && withinHero()) { frame.classList.add("is-ready"); queue(); }
  });
  video.addEventListener("error", () => { detach(); failed = true; cancelFrame(); });
  reduced.addEventListener("change", measure);
  connection?.addEventListener?.("change", measure);
  window.addEventListener("resize", () => { clearIntent(); measure(); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    clearIntent();
    cancelFrame();
    video.pause();
    if (document.hidden && pending) detach();
    if (!document.hidden) measure();
  });
  measure();
  document.fonts?.ready.then(measure);
}
