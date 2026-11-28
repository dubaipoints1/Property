// Native lazy-loading starts far outside the viewport. Observe decorative
// marks on the tracker index instead; issuer names and all terms are SSR.
const pending = new WeakMap();
let sharedObserver;
const minimumVisible = 0.01;

export function observeTrackerIssuerMark(target, reveal) {
  if (typeof IntersectionObserver === "undefined") {
    reveal();
    return () => {};
  }
  const observer = sharedObserver ??= new IntersectionObserver(entries => {
    for (const { target: node, isIntersecting, intersectionRatio } of entries) {
      if (!isIntersecting || intersectionRatio < minimumVisible || !node.getClientRects().length) continue;
      const activate = pending.get(node);
      if (!activate) continue;
      pending.delete(node);
      sharedObserver.unobserve(node);
      activate();
    }
  }, { threshold: minimumVisible });
  pending.set(target, reveal);
  observer.observe(target);
  return () => {
    if (pending.delete(target)) observer.unobserve(target);
  };
}
