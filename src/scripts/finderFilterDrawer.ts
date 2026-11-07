/** Native mobile enhancement: one existing form, never duplicated controls. */
export function initialiseFinderFilterDrawer() {
  const filters = document.querySelector<HTMLDetailsElement>("#finder-filters");
  const form = document.querySelector<HTMLFormElement>("#finder-form");
  const dialog = document.querySelector<HTMLDialogElement>("#finder-filter-drawer");
  const summary = filters?.querySelector<HTMLElement>("summary");
  const content = dialog?.querySelector<HTMLElement>("[data-finder-drawer-content]");
  const close = dialog?.querySelector<HTMLButtonElement>("[data-finder-drawer-close]");
  if (!filters || !form || !dialog || !summary || !content || !close || typeof dialog.showModal !== "function") return;

  const mobile = window.matchMedia("(max-width: 820px)");
  const context = filters.querySelector<HTMLElement>(".dp-finder-value-context");
  const nodes: HTMLElement[] = context ? [form, context] : [form];
  const anchors = nodes.map(node => {
    const anchor = document.createComment("Finder filter position");
    node.before(anchor);
    return anchor;
  });
  const ownedStyles = ["overflow", "position", "top", "left", "right", "width"];
  let originalStyles: { name: string; value: string; priority: string }[] = [];
  let scrollY = 0;
  let active = false;
  let supported = true;
  let returnFocusOnClose = true;

  const restore = (returnFocus = true) => {
    if (!active) return;
    active = false;
    nodes.forEach((node, index) => anchors[index].after(node));
    originalStyles.forEach(({ name, value, priority }) => {
      if (value) document.body.style.setProperty(name, value, priority);
      else document.body.style.removeProperty(name);
    });
    window.scrollTo(0, scrollY);
    filters.open = !mobile.matches;
    if (returnFocus && mobile.matches) summary.focus({ preventScroll: true });
  };
  const closeDrawer = (returnFocus = true) => {
    returnFocusOnClose = returnFocus;
    if (dialog.open) dialog.close();
    restore(returnFocus);
  };
  const openDrawer = () => {
    if (!mobile.matches || active || !supported) return;
    scrollY = window.scrollY;
    originalStyles = ownedStyles.map(name => ({ name, value: document.body.style.getPropertyValue(name), priority: document.body.style.getPropertyPriority(name) }));
    active = true;
    returnFocusOnClose = true;
    nodes.forEach(node => content.append(node));
    filters.open = true;
    // showModal supplies top-layer rendering and native outside-page inertness.
    // Fixed-body ownership also stops background scrolling on mobile Safari.
    document.body.style.setProperty("overflow", "hidden");
    document.body.style.setProperty("position", "fixed");
    document.body.style.setProperty("top", `-${scrollY}px`);
    document.body.style.setProperty("left", "0");
    document.body.style.setProperty("right", "0");
    document.body.style.setProperty("width", "100%");
    try { dialog.showModal(); close.focus({ preventScroll: true }); }
    catch {
      supported = false;
      restore(false);
      filters.open = true;
      summary.removeAttribute("aria-haspopup");
      summary.removeAttribute("aria-controls");
    }
  };
  summary.addEventListener("click", event => {
    if (!mobile.matches || !supported) return;
    event.preventDefault();
    openDrawer();
  });
  close.addEventListener("click", () => closeDrawer());
  // Native Escape/cancel remains intact; its close event releases our ownership.
  dialog.addEventListener("close", () => {
    // Native close is queued: a prior close must not dismantle a reopened modal.
    if (!dialog.open) restore(returnFocusOnClose);
  });
  dialog.addEventListener("keydown", event => {
    if (!active || !mobile.matches || !dialog.open || event.key !== "Tab") return;
    const exposedByDetails = (node: HTMLElement) => {
      // A collapsed details descendant can still report layout rectangles.
      // Only its first direct summary is exposed, and every enclosing details
      // must allow the node (an inner summary cannot escape a closed parent).
      for (let ancestor = node.parentElement; ancestor && ancestor !== dialog; ancestor = ancestor.parentElement) {
        if (ancestor.tagName !== "DETAILS" || (ancestor as HTMLDetailsElement).open) continue;
        const firstSummary = [...ancestor.children].find(child => child.tagName === "SUMMARY");
        if (!firstSummary?.contains(node)) return false;
      }
      return true;
    };
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), a[href], summary, [tabindex="0"]')]
      .filter(node => node.getClientRects().length > 0 && !node.closest("[hidden]") && exposedByDetails(node));
    const first = focusable[0], last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  form.addEventListener("submit", () => { if (active) closeDrawer(); });

  const resize = () => {
    if (!mobile.matches) {
      const focused = document.activeElement instanceof HTMLElement && nodes.some(node => node.contains(document.activeElement))
        ? document.activeElement as HTMLElement
        : active && dialog.contains(document.activeElement) ? form.querySelector<HTMLElement>("input:not([type=hidden]), select") : null;
      closeDrawer(false);
      filters.open = true;
      summary.removeAttribute("aria-haspopup");
      summary.removeAttribute("aria-controls");
      focused?.focus({ preventScroll: true });
    } else if (supported && !active) {
      if (nodes.some(node => node.contains(document.activeElement))) summary.focus({ preventScroll: true });
      filters.open = false;
      summary.setAttribute("aria-haspopup", "dialog");
      summary.setAttribute("aria-controls", "finder-filter-drawer");
    }
  };
  mobile.addEventListener("change", resize);
  window.addEventListener("pagehide", () => closeDrawer(false));
  resize();
}
