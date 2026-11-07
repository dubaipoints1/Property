/**
 * Self-contained so BaseLayout can emit this exact function as a hash-approved
 * inline script, without another module request or eval. No scroll dependency.
 * Fixed initial buffer: 3,000ms after navigation start when performance.now is
 * available; otherwise 3,000ms after this initialisation. Load/paint/scroll
 * events never shorten it. Late initialisation schedules
 * the next task immediately. Browser timer throttling/suspension can delay any
 * callback; visibility/BFCache restoration checks an overdue deadline again.
 * Visits ending before the buffer may not be counted. No exit backfill.
 */
export function initialiseDeferredGoogleTag(window, document) {
  if (window.__dpGoogleTagLoader) return window.__dpGoogleTagLoader;
  var id = "G-VS2RL6KX46";
  var src = "https://www.googletagmanager.com/gtag/js?id=" + id;
  var initialEpoch = Date.now();
  var navigationClock = Boolean(window.performance && typeof window.performance.now === "function");
  function now() {
    return navigationClock ? Math.max(0, window.performance.now()) : Math.max(0, Date.now() - initialEpoch);
  }
  var state = {
    phase: "scheduled", reason: null, startedAt: null, initialisedAt: now(),
    deadline: 3000, clock: navigationClock ? "navigation" : "initialisation-fallback",
  };
  window.__dpGoogleTagLoader = state;
  // An existing copy of this exact property tag is already responsible for
  // its configuration. Never append another script or queue it again.
  if (document.querySelector('script[src="' + src + '"]')) {
    state.phase = "existing";
    return state;
  }
  var timer = null;
  var suspended = false;
  function cleanupSchedule() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    window.removeEventListener("pagehide", pageHide);
    window.removeEventListener("pageshow", pageShow);
    document.removeEventListener("visibilitychange", visibilityChange);
  }
  function start(reason) {
    if (state.phase !== "scheduled" || suspended) return;
    cleanupSchedule();
    if (document.querySelector('script[src="' + src + '"]')) {
      state.phase = "existing";
      return;
    }
    state.phase = "loading";
    state.reason = reason;
    state.startedAt = now();
    try {
      // Same owner-supplied configuration, with no added events, consent,
      // personalisation, parameters, identity or account-setting changes.
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", id);
      var script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.setAttribute("data-dp-google-tag", id);
      function loaded() {
        script.removeEventListener("error", failed);
        if (state.phase === "loading") state.phase = "loaded";
      }
      function failed() {
        script.removeEventListener("load", loaded);
        if (state.phase === "loading") state.phase = "error";
      }
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", failed, { once: true });
      document.head.appendChild(script);
    } catch (_) {
      state.phase = "error";
    }
  }
  function armDeadline() {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      timer = null;
      // Guard against timer/clock precision differences; never shorten the
      // chosen buffer because a callback happened to arrive slightly early.
      if (now() < state.deadline) armDeadline();
      else start("deadline");
    }, Math.ceil(Math.max(0, state.deadline - now())));
  }
  function visibilityChange() {
    if (state.phase !== "scheduled" || suspended) return;
    if (document.visibilityState !== "hidden" && now() >= state.deadline) start("visible-deadline");
  }
  function pageHide(event) {
    if (state.phase !== "scheduled") return;
    if (event.persisted) {
      suspended = true;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    } else {
      state.phase = "cancelled";
      cleanupSchedule();
    }
  }
  function pageShow(event) {
    if (!event.persisted || state.phase !== "scheduled" || !suspended) return;
    suspended = false;
    if (now() >= state.deadline) start("restore-deadline");
    else armDeadline();
  }
  window.addEventListener("pagehide", pageHide);
  window.addEventListener("pageshow", pageShow);
  document.addEventListener("visibilitychange", visibilityChange);
  armDeadline();
  return state;
}

export const googleTagBootstrapSource = `(${initialiseDeferredGoogleTag.toString()})(window, document);`;
