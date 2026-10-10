// Reading aids for guides and articles (7 Oct 2026).
//
// The UX review of 7 October 2026 asked for calm over spectacle: GSAP,
// Lenis smooth scroll, word-by-word headings, magnetic buttons, card tilt
// and count-ups were removed. What stays is what helps a reader: a thin
// gold progress bar along the top of an article, and the "In this guide"
// list marking the section on screen. Plain DOM, no library.
const body = document.querySelector<HTMLElement>(".dp-article-body");

if (body) {
  // Reading progress. Runs under reduced motion too: it moves only as the
  // reader scrolls, it does not animate on its own.
  const bar = document.createElement("div");
  bar.className = "dp-read-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let ticking = false;
  const paint = () => {
    ticking = false;
    const r = body.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.8;
    const done = Math.min(1, Math.max(0, (window.innerHeight * 0.2 - r.top) / Math.max(total, 1)));
    bar.style.transform = `scaleX(${done})`;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paint();

  // Table of contents: mark the section currently on screen.
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".dp-toc-card a[href^='#']"));
  const targets = links
    .map((a) => document.getElementById(decodeURIComponent(a.getAttribute("href")!.slice(1))))
    .filter((t): t is HTMLElement => t != null);
  if (targets.length && "IntersectionObserver" in window) {
    const setCurrent = (id: string) =>
      links.forEach((a) => {
        const on = a.getAttribute("href") === `#${id}`;
        a.parentElement?.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // The first heading in document order inside the reading band.
        const current = targets.find((t) => visible.has(t.id));
        if (current) setCurrent(current.id);
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    targets.forEach((t) => io.observe(t));
  }
}
