import { cardFinderState, cardJourneyParams } from "../lib/readerJourneyState";
import { compareKnownAnnualFees } from "../lib/cardFeeProvenance";

// ── Client-side ranker — runs on page load and re-reads on form submit.
  // Mirrors the server-side score formula documented at the top of the file.
  export function initialiseCardFinder() {
    var idxEl = document.getElementById("finder-card-index");
    if (!idxEl) return;
    var CARDS = JSON.parse(idxEl.textContent || "[]");

    var grid = document.getElementById("finder-grid");
    var count = document.getElementById("finder-count");
    var mode = document.getElementById("finder-mode");
    var empty = document.getElementById("finder-empty");
    if (!grid || !count || !mode || !empty) return;

    // A query-string value that is not one of the offered options used to
    // reach the filter unchanged: /cards/finder/?network=visa (lowercase)
    // matched no card, so the reader saw an empty result set while the
    // control still read "Any" and nothing on the page explained why.
    // An unrecognised value now falls back to the default, which is what
    // the control shows.
    var optEl = document.getElementById("finder-options");
    var OPTIONS = JSON.parse((optEl && optEl.textContent) || "{}");
    function readParams() {
      return cardFinderState(new URLSearchParams(window.location.search));
    }

    // MIRROR: verbatim JS copy of loyaltyTag() in
    // src/lib/cardsDataFormat.ts (this inline script runs without
    // imports). Change both together; the TS one is unit-tested.
    function loyaltyTag(loyalty) {
      var l = (loyalty || "").toLowerCase();
      if (
        l.indexOf("cashback") >= 0 ||
        l.indexOf("aed") >= 0 ||
        l === ""
      )
        return "cashback";
      if (
        l.indexOf("skywards") >= 0 ||
        l.indexOf("etihad") >= 0 ||
        l.indexOf("avios") >= 0 ||
        l.indexOf("alfursan") >= 0 ||
        l.indexOf("miles") >= 0
      )
        return "miles";
      return "points";
    }

    function feeMatches(annualFee, bucket) {
      if (bucket === "any") return true;
      if (!Number.isFinite(annualFee) || annualFee < 0) return false;
      if (bucket === "free") return annualFee === 0;
      if (bucket === "under-500") return annualFee < 500;
      if (bucket === "under-1000") return annualFee < 1000;
      return true;
    }

    function spendBasis(rates, key, evidence) {
      // A held category is not an absent category: do not replace its
      // unknown conditions with a guessed universal base-rate fallback.
      if (key !== "general" && evidence.pendingEarnKeys?.includes(key)) {
        return { key: key, value: null };
      }
      if (key !== "general" && Number.isFinite(rates[key]) && evidence.earnLabels[key]) {
        return { key: key, value: rates[key] };
      }
      return { key: "everythingElse", value: evidence.fallbackPending || !Number.isFinite(rates.everythingElse) || !evidence.earnLabels.everythingElse ? null : rates.everythingElse };
    }

    function matchesPreference(card, prefer) {
      if (prefer === "none") return false;
      if (prefer === "lounges") return card.hasLounge;
      if (prefer === "status") return card.hasStatus;
      return loyaltyTag(card.loyaltyProgram) === prefer;
    }

    function apply() {
      var p = readParams();
      var hasSalary = !isNaN(p.salary) && p.salary > 0;

      var ranked = CARDS.filter(function (c) {
        if (hasSalary && c.eligibleForSalaryFilter === false) return false;
        if (hasSalary && c.minSalary > p.salary) return false;
        if (p.network !== "any" && c.network !== p.network) return false;
        if (!feeMatches(c.annualFee, p.fee)) return false;
        // Invitation-only products enter the shortlist only on opt-in.
        if (!p.includeInviteOnly && c.invitationOnly) return false;
        // Phase 2a.0: discontinued cards filtered out by default; reader
        // opts in via the "Include legacy cards" checkbox.
        if (!p.includeLegacy && c.discontinued) return false;
        return true;
      })
        .map(function (c) {
          var basis = spendBasis(c.earnRates, p.spend, c.evidence);
          return {
            slug: c.slug,
            preferred: matchesPreference(c, p.prefer),
            invitationOnly: c.invitationOnly,
            card: c,
            basis: basis,
            score: basis.value,
            annualFee: c.annualFee,
          };
        })
        .sort(function (a, b) {
          if ((a.score === null) !== (b.score === null)) return a.score === null ? 1 : -1;
          if (b.preferred !== a.preferred) return Number(b.preferred) - Number(a.preferred);
          if (b.score !== a.score) return b.score - a.score;
          return compareKnownAnnualFees(a.annualFee, b.annualFee);
        });

      var top = ranked.slice(0, 6);
      var topSlugs = top.map(function (r) {
        return r.slug;
      });
      var bySlug = new Map();
      grid.querySelectorAll(".dp-finder-tile[data-slug]").forEach(function (tile) {
        bySlug.set(tile.getAttribute("data-slug"), tile);
        tile.hidden = true;
      });
      var preferenceLabel = OPTIONS.preferLabels[p.prefer];
      var spendLabel = p.spend === "general" ? "general spending" : OPTIONS.spendLabels[p.spend].toLowerCase();
      var visibleTiles = top.map(function (r) {
        var tile = bySlug.get(r.slug);
        var note = tile.querySelector("[data-finder-match]");
        var labels = [];
        if (r.invitationOnly) labels.push("Invitation only");
        if (r.card.eligibleForSalaryFilter === false) labels.push("Eligibility confirmation pending");
        if (p.prefer !== "none") {
          labels.push(r.preferred ? "Matches your preference: " + preferenceLabel : "Different reward or benefit");
        }
        note.textContent = labels.join(" · ");
        note.hidden = labels.length === 0;

        var card = r.card;
        var evidence = card.evidence;
        var rate = evidence.earnLabels[r.basis.key] || "rate needs confirmation";
        var ranking = r.basis.value === null ? "Not rate-ranked for this spending choice: merchant, channel and reduced-category conditions need checking. No general rate is assumed."
          : p.spend === "general" ? "General spending: " + rate + "."
          : r.basis.key === "everythingElse"
            ? "No separate rate listed for " + spendLabel + "; general-spending rate used: " + rate + "."
            : OPTIONS.spendLabels[p.spend] + ": " + rate + ".";
        tile.querySelector("[data-finder-ranking]").textContent = ranking;

        var applied = [];
        if (hasSalary) {
          if (card.invitationOnly || evidence.salaryPending) {
            applied.push("Confirm salary and eligibility with the bank.");
          } else if (evidence.salaryLabel) {
            applied.push("Meets the listed salary minimum of " + evidence.salaryLabel + " a month.");
          } else {
            applied.push("No positive salary minimum is listed.");
          }
        }
        if (p.network !== "any") applied.push("Network: " + p.network + ".");
        if (p.fee !== "any") {
          applied.push("Fee filter: " + OPTIONS.feeLabels[p.fee] + (evidence.feeExcludesVat ? " (before VAT)." : "."));
        }
        tile.querySelector("[data-finder-filters]").textContent = applied.length ? applied.join(" ") : "No salary, network or fee filter applied.";

        var checks = evidence.feeNotes.concat(evidence.capNotes);
        var categoryCap = evidence.categoryCaps[p.spend === "general" ? "everythingElse" : p.spend];
        if (categoryCap) checks.push(categoryCap);
        if (card.salaryTransferRequired) checks.push("Salary transfer required.");
        if (card.invitationOnly) checks.push("The bank must invite you.");
        if (card.discontinued) checks.push("Closed to new applicants.");
        if (r.preferred && p.prefer === "lounges") checks.push("Check visit limits and qualifying spend in the issuer terms.");
        if (r.preferred && p.prefer === "status") checks.push("Check the status period and renewal conditions.");
        tile.querySelector("[data-finder-checks]").replaceChildren(...checks.map(function (check) {
          var item = document.createElement("li");
          item.textContent = check;
          return item;
        }));
        tile.hidden = false;
        return tile;
      });
      // Move the actual elements in ranked order, not merely the grid cells.
      grid.prepend.apply(grid, visibleTiles);

      count.textContent = ranked.length === 0
        ? "No cards meet your filters"
        : "Showing " + visibleTiles.length + " of " + ranked.length + (ranked.length === 1 ? " card that meets" : " cards that meet") + " your filters";
      var compareLink = document.getElementById("finder-compare");
      if (compareLink) {
        var top3 = topSlugs.slice(0, 3);
        var compareState = cardJourneyParams(new URLSearchParams(window.location.search), new Set(CARDS.map(function (card) { return card.slug; })));
        compareState.set("cards", top3.join(","));
        compareState.set("via", "finder");
        compareLink.href = "/cards/compare/?" + compareState;
        compareLink.textContent = "Compare top " + top3.length + " →";
        compareLink.hidden = top3.length < 2;
      }
      mode.textContent = (p.prefer !== "none" ? preferenceLabel + " matches first. " : "")
        + "Ordered by published earn rate for " + spendLabel
        + (p.spend === "general" ? "" : " (general rate where no separate rate is listed)")
        + ", then lower annual fee. Rates use different units. The order is not based on the AED examples and is not an approval decision.";
      mode.hidden = visibleTiles.length === 0;
      if (typeof CustomEvent !== "undefined") document.dispatchEvent?.(new CustomEvent("dp:card-results", { detail: { slugs: topSlugs, state: p } }));

      if (visibleTiles.length === 0) {
        empty.hidden = false;
        grid.hidden = true;
      } else {
        empty.hidden = true;
        grid.hidden = false;
      }
    }

    // The static build emits the form's default state, so on a shared or
    // bookmarked URL the results were filtered by the query string while
    // every control still showed its default — the reader could not see
    // what was being applied, or change one filter without silently
    // resetting the rest (2026-09-06 audit, F-039).
    function syncControls(p) {
      var form = document.getElementById("finder-form");
      if (!form) return;
      var salary = form.querySelector('input[name="salary"]');
      if (salary) salary.value = isNaN(p.salary) || p.salary <= 0 ? "" : String(p.salary);
      var prefer = form.querySelector('select[name="prefer"]');
      if (prefer) prefer.value = p.prefer;
      var more = document.getElementById("finder-more");
      if (more && (p.spend !== "general" || p.network !== "any" || p.fee !== "any" || p.includeInviteOnly || p.includeLegacy)) more.open = true;
      [["spend", p.spend], ["network", p.network], ["fee", p.fee]]
        .forEach(function (pair) {
          var el = form.querySelector(
            'input[name="' + pair[0] + '"][value="' + pair[1] + '"]',
          );
          if (el) el.checked = true;
        });
      var invite = form.querySelector('select[name="include_invite_only"]');
      if (invite) invite.value = String(p.includeInviteOnly);
      var legacy = form.querySelector('input[name="include_legacy"]');
      if (legacy) legacy.checked = p.includeLegacy;
    }

    var initial = readParams();
    var filters = document.getElementById("finder-filters");
    if (filters instanceof HTMLDetailsElement) {
      var compactFilters = window.matchMedia("(max-width: 820px)");
      var activeFilters = initial.salary > 0 || initial.prefer !== "none" || initial.spend !== "general"
        || initial.network !== "any" || initial.fee !== "any" || initial.includeInviteOnly || initial.includeLegacy;
      // Default results are immediately visible on phones. Shared filters
      // stay exposed. Without JS, the native disclosure can still open.
      filters.open = !compactFilters.matches || activeFilters;
      compactFilters.addEventListener("change", function () {
        if (!compactFilters.matches) filters.open = true;
      });
    }
    syncControls(initial);
    apply();
    window.addEventListener?.("popstate", function () { syncControls(readParams()); apply(); });

    // The form submits by GET, so the address bar already holds the
    // reader's filters; this copies it so a result can be saved or sent.
    var share = document.getElementById("finder-share");
    var shareStatus = document.getElementById("finder-share-status");
    if (share && navigator.clipboard) {
      share.hidden = false;
      share.addEventListener("click", function () {
        var clean = new URL(window.location.href);
        clean.search = cardJourneyParams(new URLSearchParams(clean.search), new Set(CARDS.map(function (card) { return card.slug; }))).toString();
        navigator.clipboard.writeText(clean.href).then(
          function () { if (shareStatus) shareStatus.textContent = "Link copied"; },
          function () { if (shareStatus) shareStatus.textContent = "Copy the address bar to save these results"; }
        );
        window.setTimeout(function () { if (shareStatus) shareStatus.textContent = ""; }, 2500);
      });
    }
  }
