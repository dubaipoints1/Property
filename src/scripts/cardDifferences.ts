import { identicalKnownSections, type CardDifference, type DifferenceSection } from "../lib/cardDifference";

/** Hide only whole, known-identical sections across the selected cards.
 * Identity, example values, verification and review actions always remain. */
export function initialiseCardDifferences() {
  const toolbar = document.querySelector<HTMLElement>("[data-card-differences]");
  const grid = document.getElementById("dp-compare-grid");
  const source = document.getElementById("card-difference-data");
  if (!toolbar || !grid || !source || toolbar.dataset.differencesReady) return;
  const button = toolbar.querySelector<HTMLButtonElement>("[data-differences-toggle]");
  const status = toolbar.querySelector<HTMLElement>("[data-differences-status]");
  if (!button || !status) return;
  const records: Record<string, CardDifference> = JSON.parse(source.textContent || "{}");
  const rowOrder = ["head", "fees", "eligibility", "top", "rates", "value", "welcome", "programme", "foot"];
  let differencesOnly = false;
  const refresh = () => {
    const columns = [...grid.querySelectorAll<HTMLElement>("[data-slug]")].filter(column => !column.hidden);
    const selected = columns.map(column => records[column.dataset.slug!]);
    if (selected.length < 2) differencesOnly = false;
    const hidden = new Set<DifferenceSection>(differencesOnly && selected.every(Boolean) ? identicalKnownSections(selected) : []);
    for (const section of grid.querySelectorAll<HTMLElement>("[data-difference-section]")) {
      const hide = hidden.has(section.dataset.differenceSection as DifferenceSection);
      if (hide && section.contains(document.activeElement)) button.focus({ preventScroll: true });
      section.hidden = hide;
    }
    const rows = rowOrder.filter(row => !hidden.has(row as DifferenceSection));
    grid.style.setProperty("--compare-rows", String(rows.length));
    rows.forEach((row, index) => grid.style.setProperty("--compare-row-" + row, String(index + 1)));
    button.disabled = selected.length < 2;
    button.setAttribute("aria-pressed", String(differencesOnly));
    button.textContent = differencesOnly ? "Show all facts" : "Show differences only";
    status.textContent = selected.length < 2 ? "Choose at least two cards to compare differences. All facts are shown."
      : differencesOnly ? `${hidden.size} known-identical section${hidden.size === 1 ? "" : "s"} hidden. Unknown or conditional facts stay visible. Estimates and review links are always shown.`
        : "All facts are shown. Differences-only hides known-identical sections; unknown or conditional facts stay visible.";
  };
  button.addEventListener("click", () => { differencesOnly = !differencesOnly; refresh(); });
  document.addEventListener("dp:card-selection", refresh);
  addEventListener("dp:card-profile", refresh);
  toolbar.dataset.differencesReady = "true";
  toolbar.hidden = false;
  refresh();
}
