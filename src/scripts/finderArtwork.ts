/** Keep off-screen Finder artwork outside the browser's native lazy
 * preload distance. Existing nodes persist across filter/order changes. */
export function initialiseFinderArtwork() {
  const grid = document.getElementById("finder-grid");
  if (!grid) return;
  const slots = grid.querySelectorAll<HTMLElement>("[data-finder-art-viewport]");
  const reveal = (slot: Element) => {
    const template = slot.querySelector<HTMLTemplateElement>("template[data-finder-art-template]");
    if (template) template.replaceWith(template.content.cloneNode(true));
  };
  if (!("IntersectionObserver" in window)) {
    // On older engines still show the marked, native lazy-loading images.
    slots.forEach(reveal);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.1) continue;
      // A queued notification may race a filter which hid this tile.
      if (entry.target.closest(".dp-finder-tile[hidden]")) continue;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.1 });
  slots.forEach(slot => observer.observe(slot));
}
