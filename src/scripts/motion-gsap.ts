// Site-wide GSAP motion (6 Oct 2026).
//
// The Chairman asked for the whole site, not just the homepage hero, to
// move like the paid 21st.dev / Astro templates, and chose the free route:
// the engine those templates are built on (GSAP — fully free since 3.13,
// SplitText and ScrollTrigger included — plus Lenis for smooth scroll)
// added to this site rather than a template swap.
//
// Everything here is progressive: the page is complete without it, and
// none of it runs under prefers-reduced-motion. Phones keep native scroll.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  document.documentElement.classList.add("dp-gsap");

  // 1. Smooth scroll on mouse/trackpad only. Lenis drives the native
  //    scroll position, so sticky stages, anchors and the hero reel (which
  //    reads window scroll) behave exactly as before.
  if (finePointer) {
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -120 } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // 2. Section headings rise word by word as they arrive. SplitText keeps
  //    an aria-label with the whole heading, so screen readers hear it once.
  const splitHeadings = () => {
    document
      .querySelectorAll<HTMLElement>("main h2:not(.eyebrow):not(.sr-only)")
      .forEach((h) => {
        if (h.closest("[data-reel], table, form")) return;
        const split = SplitText.create(h, { type: "words", mask: "words", aria: "auto" });
        gsap.from(split.words, {
          yPercent: 115,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.045,
          scrollTrigger: { trigger: h, start: "top 90%", once: true },
        });
      });
  };
  // Split after the web fonts settle, or line breaks would be measured in
  // the fallback face.
  if (document.fonts?.ready) document.fonts.ready.then(splitHeadings);
  else splitHeadings();

  const mm = gsap.matchMedia();

  // 3. Homepage "Cards we rate": on wide screens the row pins and scrolls
  //    sideways while the page scrolls down. It tweens the carousel's own
  //    scrollLeft, so its arrow buttons, keyboard and touch scrolling keep
  //    working; the pin only lasts as long as the row is wide.
  mm.add("(min-width: 1024px)", () => {
    const section = document.querySelector<HTMLElement>(".hp-picks");
    const track = section?.querySelector<HTMLElement>("[data-carousel]");
    if (!section || !track) return;
    const travel = () => track.scrollWidth - track.clientWidth;
    if (travel() < 80) return;
    const head = (document.querySelector(".dp-header") as HTMLElement | null)?.offsetHeight ?? 0;
    track.classList.add("is-scrubbed");
    // Fill the screen while pinned, row centred, so no empty band shows
    // under it as it slides.
    section.classList.add("is-pinned-stage");
    section.style.setProperty("--dp-pin-head", `${head}px`);
    const tween = gsap.to(track, {
      scrollLeft: travel,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: () => `top top+=${head}`,
        end: () => `+=${travel()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      track.classList.remove("is-scrubbed");
      section.classList.remove("is-pinned-stage");
    };
  });

  // 4. Magnetic buttons: primary actions lean a few pixels toward the
  //    cursor. Mouse only.
  mm.add("(hover: hover) and (pointer: fine)", () => {
    const els = document.querySelectorAll<HTMLElement>(".hp-hero-cta, .dp-carousel-btn, .dp-cta, .dp-btn");
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      let rect: DOMRect | null = null;
      const enter = () => { rect = el.getBoundingClientRect(); };
      const move = (e: PointerEvent) => {
        if (!rect) rect = el.getBoundingClientRect();
        x((e.clientX - (rect.left + rect.width / 2)) * 0.25);
        y((e.clientY - (rect.top + rect.height / 2)) * 0.35);
      };
      const leave = () => { rect = null; x(0); y(0); };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { x: 0, y: 0 });
      });
    });
    return () => cleanups.forEach((fn) => fn());
  });

  // 5. Card review pages (6 Oct 2026): the card glides in and tilts
  //    toward the cursor, the hero figures count up, the scorecard stars
  //    pop in, and the fit criteria and spec rows arrive in sequence.
  //    Only runs where the card-review hero exists.
  const crHero = document.querySelector<HTMLElement>(".dp-cr-hero");
  if (crHero) cardReviewMotion(crHero, mm);

  // Images and late fonts change heights after load; re-measure once.
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

// ── Card review helpers ────────────────────────────────────────────────

/** Count the first number in an element up from zero, keeping its
 *  decimals, thousands separators and any text around it. Leaves dates,
 *  unverified dashes and words ("Free", "None") alone. */
function countUp(el: HTMLElement, trigger: Element) {
  if (el.matches(".is-date, .is-unverified")) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null = null;
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (/\d/.test(t.data)) { node = t; break; }
  }
  if (!node) return;
  const original = node.data;
  const m = original.match(/\d[\d,]*(?:\.\d+)?/);
  if (!m) return;
  const end = parseFloat(m[0].replace(/,/g, ""));
  if (!Number.isFinite(end) || end <= 0) return;
  const decimals = (m[0].split(".")[1] ?? "").length;
  const grouped = m[0].includes(",");
  const before = original.slice(0, m.index);
  const after = original.slice((m.index ?? 0) + m[0].length);
  const fmt = (v: number) =>
    grouped
      ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : v.toFixed(decimals);
  const state = { v: 0 };
  const target = node;
  gsap.to(state, {
    v: end,
    duration: 1.1,
    ease: "power3.out",
    scrollTrigger: { trigger, start: "top 92%", once: true },
    onStart: () => { target.data = before + fmt(0) + after; },
    onUpdate: () => { target.data = before + fmt(state.v) + after; },
    onComplete: () => { target.data = original; },
  });
}

function cardReviewMotion(hero: HTMLElement, mm: gsap.MatchMedia) {
  const card = hero.querySelector<HTMLElement>(".dp-cr-photo, .dp-cr-tile");

  if (card) {
    gsap.set(card, { transformPerspective: 900, transformOrigin: "50% 50%" });
    // Arrival: from a tilted, lowered position to rest.
    gsap.from(card, { rotateY: -22, rotateX: 12, y: 36, opacity: 0, duration: 1.2, ease: "expo.out", delay: 0.1 });

    // Mouse: tilt toward the cursor with a moving sheen.
    mm.add("(hover: hover) and (pointer: fine)", () => {
      card.classList.add("dp-tilt");
      const rx = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });
      let rect: DOMRect | null = null;
      const move = (e: PointerEvent) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        ry((px - 0.5) * 18);
        rx((0.5 - py) * 14);
        card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      };
      const leave = () => { rect = null; rx(0); ry(0); card.style.removeProperty("--gx"); };
      hero.addEventListener("pointermove", move);
      hero.addEventListener("pointerleave", leave);
      return () => {
        hero.removeEventListener("pointermove", move);
        hero.removeEventListener("pointerleave", leave);
        card.classList.remove("dp-tilt");
        gsap.set(card, { rotateX: 0, rotateY: 0 });
      };
    });

    // Touch: a gentle turn as the hero scrolls away instead.
    mm.add("(hover: none)", () => {
      const t = gsap.to(card, {
        rotateX: 14, y: -12, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
      return () => { t.scrollTrigger?.kill(); t.kill(); gsap.set(card, { rotateX: 0, y: 0 }); };
    });
  }

  // Hero figures and scores count up.
  hero.querySelectorAll<HTMLElement>(".dp-cr-facts dd, .dp-verdict-pill .score").forEach((el) => countUp(el, el));
  document.querySelectorAll<HTMLElement>(".dp-editor-scorecard .score-num").forEach((el) => countUp(el, el));

  // Hero fact tiles arrive in sequence.
  gsap.from(hero.querySelectorAll(".dp-cr-facts > div"), {
    y: 18, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.35,
  });

  // Scorecard stars pop in row by row.
  document.querySelectorAll<HTMLElement>(".dp-editor-scorecard .star-meter").forEach((meter) => {
    gsap.from(meter.querySelectorAll(".star"), {
      scale: 0, opacity: 0, duration: 0.45, ease: "back.out(2.2)", stagger: 0.06,
      scrollTrigger: { trigger: meter, start: "top 92%", once: true },
    });
  });

  // "Great card if" from the left, "Skip if" from the right.
  document.querySelectorAll<HTMLElement>(".dp-great-card-if, .dp-editor-scorecard .apply-skip").forEach((pair) => {
    const sides = pair.querySelectorAll<HTMLElement>(".side, .apply, .skip");
    sides.forEach((side, i) => {
      gsap.from(side, {
        x: i === 0 ? -28 : 28, opacity: 0, duration: 0.8, ease: "expo.out",
        scrollTrigger: { trigger: pair, start: "top 88%", once: true },
      });
    });
  });

  // Spec sheet rows.
  document.querySelectorAll<HTMLElement>(".dp-spec-rows, .dp-spec-list").forEach((list) => {
    gsap.from(list.children, {
      y: 12, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.04,
      scrollTrigger: { trigger: list, start: "top 90%", once: true },
    });
  });
}
