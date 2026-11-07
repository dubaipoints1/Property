// One native controller for article and programme reading aids. A section
// remains current between headings; there is no second observer or smooth
// scrolling dependency. Anchors and native details work without JavaScript.
import { currentReadingSection } from "../lib/editorialNavigation";

const body = document.querySelector<HTMLElement>(".dp-article-body");
const bar = body ? document.createElement("div") : undefined;
if (bar) {
  bar.className = "dp-read-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
}

const contents = [...document.querySelectorAll<HTMLElement>("[data-reading-contents], .dp-toc-card")].map((nav) => {
  const entries = [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")].flatMap((link) => {
    let id: string;
    try { id = decodeURIComponent(link.hash.slice(1)); } catch { return []; }
    const target = document.getElementById(id);
    return target ? [{ link, target }] : [];
  });
  return { nav, entries, current: -1 };
});

const desktop = window.matchMedia("(min-width: 1024px)");
for (const { nav } of contents) {
  const details = nav.querySelector("details");
  if (!details) continue;
  const syncDisclosure = () => {
    if (!desktop.matches && details.contains(document.activeElement)) details.querySelector("summary")?.focus();
    details.open = desktop.matches;
  };
  syncDisclosure();
  desktop.addEventListener("change", syncDisclosure);
}

let ticking = false;
const paint = () => {
  ticking = false;
  if (body && bar) {
    const rect = body.getBoundingClientRect();
    const total = rect.height - window.innerHeight * .8;
    const done = Math.min(1, Math.max(0, (window.innerHeight * .2 - rect.top) / Math.max(total, 1)));
    bar.style.transform = `scaleX(${done})`;
  }
  const stickyHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dp-sticky-header-height")) || 81;
  const readingLine = Math.max(stickyHeight + 24, window.innerHeight * .2);
  for (const state of contents) {
    const current = currentReadingSection(state.entries.map(({ target }) => target.getBoundingClientRect().top), readingLine);
    if (current === state.current) continue;
    state.current = current;
    state.entries.forEach(({ link }, index) => {
      const active = index === current;
      link.parentElement?.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
};
const queuePaint = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(paint);
};
if (body || contents.length) {
  window.addEventListener("scroll", queuePaint, { passive: true });
  window.addEventListener("resize", queuePaint, { passive: true });
  window.addEventListener("hashchange", queuePaint);
  window.addEventListener("pageshow", queuePaint);
  document.fonts?.ready.then(queuePaint);
  paint();
}
