import { cardFinderState, cardJourneyParams, clearCardFilters, withoutCardFilter, type CardFilterKey } from "../lib/readerJourneyState";
import { MAX_CARD_SELECTION, readCardSelection, setCardSelection, updateCardSelection } from "../lib/cardSelection";

export function initialiseCardSelection() {
  const tray = document.querySelector<HTMLElement>("[data-card-selection-tray]");
  const data = document.getElementById("finder-card-index");
  if (!tray || !data || tray.dataset.selectionReady) return;
  const cards: { slug: string; name: string }[] = JSON.parse(data.textContent || "[]");
  const names = new Map(cards.map(card => [card.slug, card.name]));
  const known = new Set(names.keys());
  const items = tray.querySelector<HTMLElement>("[data-selection-items]")!;
  const caption = tray.querySelector<HTMLElement>("[data-selection-caption]")!;
  const compare = tray.querySelector<HTMLAnchorElement>("[data-selection-compare]")!;
  const status = document.querySelector<HTMLElement>("[data-selection-status]");
  const tokenBar = document.querySelector<HTMLElement>("[data-card-filter-tokens]");
  const tokenItems = tokenBar?.querySelector<HTMLElement>("[data-filter-token-items]");
  const labels = JSON.parse(document.getElementById("finder-options")?.textContent || "{}");
  const boxes = [...document.querySelectorAll<HTMLInputElement>("[data-card-select]")];
  const safeHash = () => /^#[A-Za-z0-9_-]*$/.test(location.hash) ? location.hash : "";
  const current = () => cardJourneyParams(new URLSearchParams(location.search), known);
  const href = (state: URLSearchParams) => "/cards/finder/" + (state.size ? "?" + state : "") + safeHash();
  const announce = (message: string) => { if (status) status.textContent = message; };
  const focusAfterRemoval = () => {
    const visibleBox = boxes.find(box => !box.closest<HTMLElement>(".dp-finder-tile")?.hidden);
    const empty = document.getElementById("finder-empty");
    const reset = empty && !empty.hidden ? empty.querySelector<HTMLAnchorElement>("[data-clear-card-filters]") : null;
    // With zero results there is no tile to receive focus. The tray's
    // disappearing button must hand back to a useful recovery control.
    const fallback = document.querySelector<HTMLElement>("#finder-filters > summary");
    (visibleBox ?? reset ?? fallback)?.focus({ preventScroll: true });
  };
  const persist = (selection: string[]) => {
    const state = setCardSelection(current(), selection, known);
    if (selection.length) state.set("via", "finder");
    history.pushState(null, "", href(state));
    render();
    document.dispatchEvent(new CustomEvent("dp:card-selection", { detail: { selected: selection } }));
  };
  const tokens = (state: URLSearchParams): { key: CardFilterKey; label: string }[] => {
    const filters = cardFinderState(state), result: { key: CardFilterKey; label: string }[] = [];
    if (filters.salary !== undefined && filters.salary > 0) result.push({ key: "salary", label: `Salary: AED ${filters.salary.toLocaleString("en-GB")}/month` });
    if (filters.prefer !== "none") result.push({ key: "prefer", label: labels.preferLabels?.[filters.prefer] ?? filters.prefer });
    if (filters.spend !== "general") result.push({ key: "spend", label: labels.spendLabels?.[filters.spend] ?? filters.spend });
    if (filters.network !== "any") result.push({ key: "network", label: filters.network });
    if (filters.fee !== "any") result.push({ key: "fee", label: labels.feeLabels?.[filters.fee] ?? filters.fee });
    if (filters.includeInviteOnly) result.push({ key: "include_invite_only", label: "Invitation-only included" });
    if (filters.includeLegacy) result.push({ key: "include_legacy", label: "Archived flag: reference-only, not ranked" });
    return result;
  };
  function render() {
    const state = current(), selected = readCardSelection(state, known);
    tray!.hidden = selected.length === 0;
    caption.textContent = selected.length === 1 ? "Choose one more card to compare." : `${selected.length} of ${MAX_CARD_SELECTION} selected.${selected.length === MAX_CARD_SELECTION ? " Remove a card to choose another." : ""}`;
    items.replaceChildren(...selected.map((slug, index) => {
      const item = document.createElement("li"), remove = document.createElement("button");
      remove.type = "button";
      const tile = document.querySelector<HTMLElement>(`.dp-finder-tile[data-slug="${slug}"]`);
      remove.textContent = `${names.get(slug)}${tile?.hidden ? " · Outside current results" : ""} ×`;
      remove.setAttribute("aria-label", `Remove ${names.get(slug)} from comparison`);
      remove.addEventListener("click", () => {
        const next = selected.filter(value => value !== slug);
        persist(next);
        announce(`${names.get(slug)} removed. ${next.length} selected.`);
        const nextButton = items.querySelectorAll<HTMLButtonElement>("button")[Math.min(index, next.length - 1)];
        if (nextButton) nextButton.focus({ preventScroll: true });
        else focusAfterRemoval();
      });
      item.append(remove); return item;
    }));
    for (const box of boxes) {
      box.checked = selected.includes(box.dataset.cardSelect!);
      box.disabled = !box.checked && selected.length >= MAX_CARD_SELECTION;
    }
    for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-finder-compare-card]")) link.hidden = selected.length > 0;
    const autoCompare = document.getElementById("finder-compare");
    if (autoCompare) autoCompare.hidden = selected.length > 0 || document.querySelectorAll(".dp-finder-tile:not([hidden])").length < 2;
    compare.hidden = selected.length < 2;
    const destination = setCardSelection(state, selected, known); destination.set("via", "finder");
    compare.href = "/cards/compare/?" + destination;
    const applied = tokens(state);
    if (tokenBar && tokenItems) {
      tokenBar.hidden = applied.length === 0;
      tokenItems.replaceChildren(...applied.map(token => {
        const item = document.createElement("li"), link = document.createElement("a");
        link.href = href(withoutCardFilter(state, token.key, known));
        link.dataset.cardJourneyReset = "";
        link.textContent = token.label + " ×";
        link.setAttribute("aria-label", `Remove filter: ${token.label}`);
        item.append(link); return item;
      }));
    }
    const count = document.querySelector<HTMLElement>("[data-finder-applied-count]");
    const active = applied.filter(token => token.key !== "include_legacy").length;
    if (count) count.textContent = active ? `${active} filter${active === 1 ? "" : "s"} applied` : "Salary, spend, preference";
    for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-clear-card-filters]")) link.href = href(clearCardFilters(state, known));
  }
  for (const box of boxes) box.addEventListener("change", () => {
    const before = readCardSelection(current(), known), slug = box.dataset.cardSelect!;
    const next = updateCardSelection(before, slug, box.checked, known);
    persist(next);
    announce(`${next.length} of ${MAX_CARD_SELECTION} selected.${next.length === MAX_CARD_SELECTION ? " Remove a card to choose another." : next.length === 1 ? " Choose one more." : ""}`);
  });
  tray.querySelector<HTMLButtonElement>("[data-selection-clear]")?.addEventListener("click", () => {
    persist([]); announce("Comparison selection cleared. Filters and estimate kept.");
    focusAfterRemoval();
  });
  document.addEventListener("dp:card-results", render);
  addEventListener("dp:card-profile", render);
  addEventListener("popstate", render);
  tray.dataset.selectionReady = "true";
  for (const control of document.querySelectorAll<HTMLElement>("[data-finder-select-control]")) control.hidden = false;
  render();
}
