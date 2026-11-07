import { cardJourneyParams } from "../lib/readerJourneyState";
import { MAX_CARD_SELECTION as MAX_CARDS, readCardSelection, setCardSelection, updateCardSelection } from "../lib/cardSelection";

// Recovers the ?cards= selection this page could never render. See the
  // note beside the frontmatter's selection block: the server read search
  // params in a static build, so they were always empty and the picker's
  // "Update comparison" button returned the same three cards every time.
  export function initialiseCardComparison(defaultSlugs = []) {
    var grid = document.getElementById("dp-compare-grid");
    var empty = document.getElementById("dp-compare-empty");
    var countEl = document.getElementById("dp-compare-count");
    var modeEl = document.getElementById("dp-compare-mode");
    if (!grid || !empty || !countEl || !modeEl) return;

    var cols = Array.prototype.slice.call(grid.querySelectorAll("[data-slug]"));
    var known = Object.create(null);
    cols.forEach(function (el) {
      known[el.getAttribute("data-slug")] = el;
    });

    var selectedOrder = [];
    var refreshPicker = function () {};
    function requested() {
      return readCardSelection(new URLSearchParams(window.location.search), new Set(Object.keys(known)));
    }

    function apply() {
      var chosen = requested();
      var isDefault = chosen.length === 0;
      var show = isDefault ? defaultSlugs : chosen;
      selectedOrder = show.slice();

      cols.forEach(function (el) {
        el.hidden = show.indexOf(el.getAttribute("data-slug")) < 0;
      });
      // Keep the URL, visible comparison and keyboard order in sync.
      grid.prepend.apply(grid, show.map(function (slug) { return known[slug]; }));
      // An img inside a template is inert: the browser cannot fetch every
      // card, or the default cards on a visit with an explicit selection.
      show.forEach(function (slug) {
        var template = known[slug].querySelector("[data-compare-art-template]");
        if (!template) return;
        var img = template.content.querySelector("img").cloneNode(true);
        img.addEventListener("error", function () { img.remove(); }, { once: true });
        template.replaceWith(img);
      });

      countEl.textContent = String(show.length);
      modeEl.textContent = isDefault ? "top welcome-bonus cards" : "selected";
      grid.dataset.visibleCount = String(show.length);

      var none = show.length === 0;
      empty.hidden = !none;
      grid.hidden = none;
      if (typeof CustomEvent !== "undefined") document.dispatchEvent?.(new CustomEvent("dp:card-selection", { detail: { selected: show } }));

      // The checkboxes are server-rendered against the defaults, so they need
      // the same correction.
      var boxes = document.querySelectorAll('.dp-compare-picker-form input[name="cards"]');
      Array.prototype.forEach.call(boxes, function (box) {
        box.checked = show.indexOf(box.value) >= 0;
      });
      refreshPicker();
    }

    apply();
    window.addEventListener?.("popstate", apply);

    // Native checkboxes remain independent. At the comparison limit,
    // prevent a fifth choice being silently discarded on submission.
    var picker = document.querySelector(".dp-compare-picker-form");
    var selection = document.getElementById("dp-compare-selection");
    if (picker && selection) {
      var boxes = Array.prototype.slice.call(picker.querySelectorAll('input[name="cards"]'));
      function updatePickerState() {
        var selected = boxes.filter(function (box) { return box.checked; }).length;
        boxes.forEach(function (box) {
          box.disabled = !box.checked && selected >= MAX_CARDS;
        });
        selection.textContent = selected + " of " + MAX_CARDS + " selected. "
          + (selected >= MAX_CARDS ? "Deselect a card to choose another."
            : selected === 0 ? "Choose a card, or update to restore the defaults."
              : "Choose cards, then update the comparison.");
      }
      refreshPicker = updatePickerState;
      boxes.forEach(function (box) { box.addEventListener("change", function () {
        selectedOrder = selectedOrder.filter(function (slug) { return boxes.some(function (item) { return item.value === slug && item.checked; }); });
        selectedOrder = updateCardSelection(selectedOrder, box.value, box.checked, new Set(Object.keys(known)));
        boxes.forEach(function (item) { item.checked = selectedOrder.indexOf(item.value) >= 0; });
        updatePickerState();
      }); });
      picker.addEventListener?.("submit", function (event) {
        event.preventDefault();
        var state = setCardSelection(cardJourneyParams(new URLSearchParams(window.location.search), new Set(Object.keys(known))), selectedOrder, new Set(Object.keys(known)));
        window.location.href = "/cards/compare/" + (state.size ? "?" + state : "");
      });
      updatePickerState();
    }
  }
