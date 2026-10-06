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

  // Images and late fonts change heights after load; re-measure once.
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}
