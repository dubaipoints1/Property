// Shared motion helpers for the calculator islands (6 Oct 2026).
//
// The site-wide GSAP layer (src/scripts/motion-gsap.ts) works on static
// HTML. These islands re-render on every keystroke, so their motion lives
// inside Preact: a number that glides to its new value, and result rows
// that slide to their new rank instead of jumping. No GSAP here: the Web
// Animations API and requestAnimationFrame are enough, so the islands stay
// small. Both helpers do nothing under prefers-reduced-motion.
import type { ComponentChildren } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A number that eases from its previous value to the new one. Screen
 *  readers get only the final value: the animated copy is aria-hidden, so
 *  an aria-live results region announces one figure, not sixty frames. */
export function Tween({ value, format }: { value: number; format: (n: number) => ComponentChildren }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value || reducedMotion() || !Number.isFinite(start) || !Number.isFinite(value)) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    const dur = 550;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = start + (value - start) * eased;
      from.current = v;
      setShown(k === 1 ? value : v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (shown === value) return <>{format(value)}</>;
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span class="sr-only">{format(value)}</span>
    </>
  );
}

/** FLIP: after each render, children of the list that moved slide from
 *  their old position to the new one. Children need a `data-flip` key. */
export function useFlip<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);
  const last = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-flip]"));
    const animate = !reducedMotion();
    // Positions relative to the list, so scrolling between renders is not
    // mistaken for movement.
    const origin = list.getBoundingClientRect().top;
    const next = new Map<string, number>();
    items.forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      const key = el.dataset.flip!;
      const top = el.getBoundingClientRect().top - origin;
      next.set(key, top);
      const prev = last.current.get(key);
      if (!animate) return;
      if (prev != null) {
        const dy = prev - top;
        if (Math.abs(dy) > 1) {
          el.animate(
            [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
            { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          );
        }
      } else if (last.current.size > 0) {
        el.animate(
          [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 320, easing: "ease-out" },
        );
      }
    });
    last.current = next;
  }, deps);

  return ref;
}
