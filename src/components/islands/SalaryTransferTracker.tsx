import { useMemo, useState } from "preact/hooks";
import {
  type SalaryTransferOffer,
  type RewardType,
  daysUntil,
  findBand,
} from "../../lib/salaryTransfer";

// Salary-Transfer Tracker island. Markup + styling ported from the Claude
// Design artifact "Salary-Transfer Tracker (standalone)" (imported 27 June
// 2026): a segmented salary-band control, multi-select filter chips, a
// value/expiry sort, and a sortable sticky-header table (desktop) that
// swaps to one card per offer on mobile (CSS-only), with an expandable
// "fine print + verification" detail per offer.
//
// The design's vanilla-JS STATE/render() is reference only — this Preact
// island is the single rendering path. Data is the real getLiveOffers()
// feed (SalaryTransferOffer[]); the design's `tier` / `fallBelowFee` /
// `newCustomerOnly` sample fields are NOT stored structurally, so the
// detail renders only fields we hold (holding period, clawback prose,
// card-required, Sharia, requirements, verified date + source) — nothing
// invented (Charter §6). Scoped --dpst-* tokens live in global.css.

interface Props {
  offers: SalaryTransferOffer[];
}

type SortKey = "value" | "expiry";

const BANDS: { label: string; min: number; max: number | null }[] = [
  { label: "AED 5k–8k", min: 5000, max: 7999 },
  { label: "AED 8k–15k", min: 8000, max: 14999 },
  { label: "AED 15k–30k", min: 15000, max: 29999 },
  { label: "AED 30k–50k", min: 30000, max: 49999 },
  { label: "AED 50k+", min: 50000, max: null },
];

const fmt = (n: number) => n.toLocaleString("en-AE");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const validClass = (n: number) => (n <= 14 ? "urgent" : n <= 45 ? "soon" : "far");
const validText = (n: number) =>
  n <= 0 ? "Ended" : n === 1 ? "Ends tomorrow" : `Ends in ${n} days`;

// Reward-type → badge class + label. cashback_monthly shares the teal
// "cashback" treatment; points gets its own scoped variant.
const badgeClass = (t: RewardType) =>
  t === "cash"
    ? "cash"
    : t === "voucher"
      ? "voucher"
      : t === "cashback_monthly"
        ? "cashback"
        : "points";
const badgeLabel = (t: RewardType) =>
  t === "cash"
    ? "Cash"
    : t === "voucher"
      ? "Voucher"
      : t === "cashback_monthly"
        ? "Cashback"
        : "Points";

// Short logo tag from the bank name (e.g. "ADCB", or initials for
// multi-word names like "Emirates NBD" → "ENBD").
function logoTag(name: string): string {
  if (name.length <= 6) return name.toUpperCase();
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

function bandCell(o: SalaryTransferOffer): string {
  const min = Math.min(...o.salaryBands.map((b) => b.minSalary));
  const noUpper = o.salaryBands.some((b) => b.maxSalary === null);
  if (noUpper) return `AED ${fmt(min)}+`;
  const max = Math.max(...o.salaryBands.map((b) => b.maxSalary as number));
  return `AED ${fmt(min)} – ${fmt(max)}`;
}

export default function SalaryTransferTracker({ offers }: Props) {
  // band: index into BANDS, or null = all bands (kept for our thin live
  // data, where defaulting to one band could hide offers).
  const [band, setBand] = useState<number | null>(null);
  const [cash, setCash] = useState(false);
  const [noCard, setNoCard] = useState(false);
  const [sharia, setSharia] = useState(false);
  const [sort, setSort] = useState<SortKey>("value");
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const appliedLabel =
    (band !== null ? `Band: ${BANDS[band].label}` : "All bands") +
    (() => {
      const n = [cash, noCard, sharia].filter(Boolean).length;
      return n ? ` · ${n} filter${n > 1 ? "s" : ""}` : "";
    })();

  const rows = useMemo(() => {
    const sample = band !== null ? BANDS[band].min : null;
    return offers
      .filter((o) => {
        if (cash && !o.salaryBands.some((b) => b.rewardType === "cash"))
          return false;
        if (noCard && o.creditCardRequired) return false;
        if (sharia && !o.sharia) return false;
        if (sample !== null && !findBand(o.salaryBands, sample)) return false;
        return true;
      })
      .map((o) => {
        const matched = sample !== null ? findBand(o.salaryBands, sample) : null;
        const reward = matched
          ? matched
          : o.salaryBands.reduce((best, b) =>
              b.rewardAmount > best.rewardAmount ? b : best,
            );
        return { offer: o, reward };
      })
      .sort((a, b) =>
        sort === "value"
          ? b.reward.rewardAmount - a.reward.rewardAmount
          : daysUntil(a.offer.validUntil) - daysUntil(b.offer.validUntil),
      );
  }, [offers, band, cash, noCard, sharia, sort]);

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearFilters = () => {
    setCash(false);
    setNoCard(false);
    setSharia(false);
  };

  const banksTracked = new Set(offers.map((o) => o.bankSlug)).size;

  // Per-offer detail (fine print + verification). Real fields only.
  const Detail = ({ o }: { o: SalaryTransferOffer }) => (
    <>
      <div class="dpst-fineblock">
        <div class="dpst-finehead">Commitment</div>
        <div class="dpst-fineitem">
          <span class="k">Holding period</span>
          <span class="v">{o.tenureMonths} months</span>
        </div>
        <div class="dpst-fineitem">
          <span class="k">Reward type</span>
          <span class="v">
            {o.salaryBands.map((b) => badgeLabel(b.rewardType)).filter((v, i, a) => a.indexOf(v) === i).join(" / ")}
          </span>
        </div>
        {o.clawbackTerms && <p class="dpst-finenote">{o.clawbackTerms}</p>}
      </div>
      <div class="dpst-fineblock">
        <div class="dpst-finehead">Eligibility</div>
        <div class="dpst-fineitem">
          <span class="k">Credit card required</span>
          <span class={`v ${o.creditCardRequired ? "warn" : "ok"}`}>
            {o.creditCardRequired ? "Yes" : "No"}
          </span>
        </div>
        <div class="dpst-fineitem">
          <span class="k">Sharia-compliant</span>
          <span class={`v ${o.sharia ? "ok" : ""}`}>{o.sharia ? "Yes" : "No"}</span>
        </div>
        {o.requirements.length > 0 && (
          <ul class="dpst-finereqs">
            {o.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
      <div class="dpst-verified">
        <div class="vrow">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>{" "}
          Source-verified
        </div>
        <div class="vdate">
          Last checked <b>{fmtDate(o.lastVerified)}</b> against the bank's
          published terms.
        </div>
        <a href={o.sourceUrl} target="_blank" rel="noopener">
          View source document →
        </a>
      </div>
    </>
  );

  return (
    <section class="dpst" aria-label="UAE salary-transfer offer tracker">
      {/* CONTROLS */}
      <div class="dpst-controls">
        <span class="dpst-ctrl-label" id="dpst-band-label">
          Your monthly salary band
        </span>
        <div
          class="dpst-bands"
          role="group"
          aria-labelledby="dpst-band-label"
        >
          {band !== null && (
            <span
              class="dpst-band-slider"
              style={{ transform: `translateX(${band * 100}%)` }}
              aria-hidden="true"
            />
          )}
          {BANDS.map((b, i) => (
            <button
              key={b.label}
              type="button"
              class="dpst-band"
              aria-pressed={band === i}
              onClick={() => setBand(band === i ? null : i)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div class="dpst-ctrl-row">
          <div>
            <span class="dpst-ctrl-label">Filters</span>
            <div class="dpst-chips" role="group" aria-label="Offer filters">
              <button
                type="button"
                class="dpst-chip"
                aria-pressed={cash}
                onClick={() => setCash(!cash)}
              >
                <span class="tick" aria-hidden="true">
                  ✓
                </span>
                Cash only
              </button>
              <button
                type="button"
                class="dpst-chip"
                aria-pressed={noCard}
                onClick={() => setNoCard(!noCard)}
              >
                <span class="tick" aria-hidden="true">
                  ✓
                </span>
                No card required
              </button>
              <button
                type="button"
                class="dpst-chip"
                aria-pressed={sharia}
                onClick={() => setSharia(!sharia)}
              >
                <span class="tick" aria-hidden="true">
                  ✓
                </span>
                Sharia-compliant
              </button>
              <button
                type="button"
                class="dpst-chip is-reset"
                onClick={() => {
                  clearFilters();
                  setBand(null);
                }}
              >
                Clear all
              </button>
            </div>
          </div>
          <div>
            <span class="dpst-ctrl-label">Sort by</span>
            <div class="dpst-sort">
              <button
                type="button"
                class="dpst-sort-btn"
                aria-pressed={sort === "value"}
                onClick={() => setSort("value")}
              >
                Reward value{" "}
                <span class="arrow" aria-hidden="true">
                  ↓
                </span>
              </button>
              <button
                type="button"
                class="dpst-sort-btn"
                aria-pressed={sort === "expiry"}
                onClick={() => setSort("expiry")}
              >
                Ends soonest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT COUNT */}
      <div class="dpst-meta">
        <span class="dpst-count">
          <b>{rows.length}</b> offer{rows.length === 1 ? "" : "s"} match your
          filters
        </span>
        <span class="applied">{appliedLabel}</span>
      </div>

      {offers.length === 0 ? (
        <div class="dpst-empty">
          <div class="mark" aria-hidden="true">
            ⌀
          </div>
          <h4>No verified live offers right now.</h4>
          <p>
            We list salary-transfer offers only while we can verify them against
            the bank's current published terms. None are verified as live today —
            check back, or see the methodology below for how we source them.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div class="dpst-empty">
          <div class="mark" aria-hidden="true">
            ⌀
          </div>
          <h4>No offers match — yet.</h4>
          <p>
            No live salary-transfer offers fit this band and filter combination.
            Loosen a filter to see more.
          </p>
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setBand(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* TABLE (desktop) */}
          <div class="dpst-tablewrap">
            <table class="dpst-table">
              <thead>
                <tr>
                  <th scope="col">Bank</th>
                  <th scope="col">Reward type</th>
                  <th
                    scope="col"
                    class={`sortable${sort === "value" ? " sorted" : ""}`}
                    aria-sort={sort === "value" ? "descending" : "none"}
                    onClick={() => setSort("value")}
                  >
                    Headline value{" "}
                    <span class="sort-ind" aria-hidden="true">
                      ↓
                    </span>
                  </th>
                  <th scope="col">Salary band</th>
                  <th
                    scope="col"
                    class={`sortable${sort === "expiry" ? " sorted" : ""}`}
                    aria-sort={sort === "expiry" ? "ascending" : "none"}
                    onClick={() => setSort("expiry")}
                  >
                    Validity{" "}
                    <span class="sort-ind" aria-hidden="true">
                      ↕
                    </span>
                  </th>
                  <th scope="col">
                    <span class="sr-only">Expand</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ offer: o, reward }) => {
                  const isOpen = open.has(o.id);
                  const n = daysUntil(o.validUntil);
                  return (
                    <>
                      <tr
                        key={o.id}
                        class={`dpst-row${isOpen ? " is-open" : ""}`}
                        onClick={() => toggleOpen(o.id)}
                        aria-expanded={isOpen}
                      >
                        <td class="col-bank">
                          <div class="dpst-bank">
                            <span class="dpst-logo">{logoTag(o.bankName)}</span>
                            <span>
                              <a
                                href={`/salary-transfer/${o.bankSlug}/`}
                                class="dpst-bank-name"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {o.bankName}
                              </a>
                              <span class="dpst-bank-tier">{o.name}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span class={`dpst-badge ${badgeClass(reward.rewardType)}`}>
                            <span class="ic" aria-hidden="true" />
                            {badgeLabel(reward.rewardType)}
                          </span>
                        </td>
                        <td>
                          <span class="dpst-value">
                            <span class="cur">AED</span>
                            {fmt(reward.rewardAmount)}
                          </span>
                        </td>
                        <td class="dpst-band-cell">{bandCell(o)}</td>
                        <td>
                          <span class={`dpst-chip-valid ${validClass(n)}`}>
                            <span class="dot" aria-hidden="true" />
                            {validText(n)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            class="dpst-expand"
                            aria-label={`Toggle fine print for ${o.bankName}`}
                            tabIndex={-1}
                          >
                            ▾
                          </button>
                        </td>
                      </tr>
                      <tr class="dpst-detail-row">
                        <td colSpan={6}>
                          <div class="dpst-detail">
                            <div class="dpst-detail-inner">
                              <Detail o={o} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CARDS (mobile) */}
          <div class="dpst-cards">
            {rows.map(({ offer: o, reward }) => {
              const isOpen = open.has(o.id);
              const n = daysUntil(o.validUntil);
              return (
                <div
                  key={o.id}
                  class={`dpst-card${isOpen ? " is-open" : ""}`}
                >
                  <div class="dpst-card-head">
                    <div class="dpst-bank">
                      <span class="dpst-logo">{logoTag(o.bankName)}</span>
                      <span>
                        <a
                          href={`/salary-transfer/${o.bankSlug}/`}
                          class="dpst-bank-name"
                        >
                          {o.bankName}
                        </a>
                        <span class="dpst-bank-tier">{o.name}</span>
                      </span>
                    </div>
                    <div class="dpst-card-val">
                      <span class="dpst-value">
                        <span class="cur">AED</span>
                        {fmt(reward.rewardAmount)}
                      </span>
                    </div>
                  </div>
                  <div class="dpst-card-kv">
                    <div class="kv">
                      <span class="k">Reward type</span>
                      <span class="v">
                        <span class={`dpst-badge ${badgeClass(reward.rewardType)}`}>
                          <span class="ic" aria-hidden="true" />
                          {badgeLabel(reward.rewardType)}
                        </span>
                      </span>
                    </div>
                    <div class="kv">
                      <span class="k">Salary band</span>
                      <span class="v">{bandCell(o)}</span>
                    </div>
                    <div class="kv">
                      <span class="k">Validity</span>
                      <span class="v">
                        <span class={`dpst-chip-valid ${validClass(n)}`}>
                          <span class="dot" aria-hidden="true" />
                          {validText(n)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="dpst-card-acc"
                    aria-expanded={isOpen}
                    onClick={() => toggleOpen(o.id)}
                  >
                    Fine print &amp; verification{" "}
                    <span class="chev" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  <div class="dpst-card-detail">
                    <div class="dpst-card-detail-inner">
                      <Detail o={o} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FOOTER */}
      <div class="dpst-foot">
        <span class="left">
          Tracking <b>{banksTracked} UAE bank{banksTracked === 1 ? "" : "s"}</b>{" "}
          · each offer verified against the bank's published terms
        </span>
        <span>
          Verdicts are DubaiPoints' own ·{" "}
          <a href="#methodology">Methodology →</a>
        </span>
      </div>
    </section>
  );
}
