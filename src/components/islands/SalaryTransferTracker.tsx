import { Fragment } from "preact";
import { useMemo, useState } from "preact/hooks";
import {
  type SalaryBand,
  type SalaryTransferOffer,
  type RewardType,
  daysUntil,
} from "../../lib/salaryTransfer";
import {
  accountOnlyTrackerTiers,
  type TrackerSalaryBand,
  selectTrackerReward,
  TRACKER_SALARY_BANDS as BANDS,
} from "../../lib/salaryTransferTrackerBands";
import { bankMark } from "../../lib/logos";
import type { TrackerCardPath } from "../../lib/salaryTransferTrackerImages";
import type { SalaryTransferTimeline as Timeline } from "../../lib/salaryTransferTimeline";
import { isStale } from "../../lib/verification";
import SalaryTransferTimeline from "../SalaryTransferTimeline";
import "./salaryTransferTracker.css";

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
// details use the source-backed terms (clawback, card requirement,
// Sharia, verified date + source). Timeline summaries are prepared at
// build time and gated against the exact campaign terms.

interface Props {
  offers: SalaryTransferOffer[];
  scope?: TrackerSalaryBand;
  cardPaths: Record<string, TrackerCardPath>;
  timelines: Record<string, Timeline>;
}

type SortKey = "value" | "expiry";

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

function CampaignValidity({ offer, timeline }: { offer: SalaryTransferOffer; timeline?: Timeline }) {
  if (timeline?.endDate !== "published") {
    return <span class="dpst-chip-valid far">{timeline ? "No fixed end published" : "Check bank deadline"}</span>;
  }
  const days = daysUntil(offer.validUntil);
  return (
    <span class={`dpst-chip-valid ${validClass(days)}`}>
      <span class="dot" aria-hidden="true" />
      {validText(days)}
    </span>
  );
}

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

function rewardRange(tier: SalaryBand): string {
  const min = fmt(tier.minSalary);
  if (tier.maxSalary === null) return `AED ${min}+`;
  return `AED ${min}–${fmt(tier.maxSalary)}`;
}

function SalaryForReward({ offer, reward }: { offer: SalaryTransferOffer; reward: SalaryBand }) {
  const min = Math.min(...offer.salaryBands.map((b) => b.minSalary));
  return (
    <span class="dpst-salary">
      <span>{rewardRange(reward)}</span>
      {min < reward.minSalary && <small>Offer starts at AED {fmt(min)}</small>}
    </span>
  );
}

function RewardValue({ reward, note }: { reward: SalaryBand; note?: string }) {
  return (
    <>
      <span class="dpst-value">
        <span class="cur">AED</span>
        {fmt(reward.rewardAmount)}
      </span>
      {note && <small class="dpst-reward-note">{note}</small>}
    </>
  );
}

function BankIdentity({ offer }: { offer: SalaryTransferOffer }) {
  // Salary offers identify banks and may have multiple product paths. A
  // logo never suggests that a particular credit card is part of an offer.
  const mark = bankMark(offer.bankSlug);
  return (
    <div class="dpst-bank">
      <span class={`dpst-issuer-mark${mark.plated ? " is-plated" : ""}`} aria-hidden="true">
        <img src={mark.src} alt="" width="48" height="28" loading="lazy" decoding="async" data-logo-fallback />
        <span class="dpst-issuer-fallback">{logoTag(offer.bankName)}</span>
      </span>
      <span class="dpst-bank-copy">
        <a
          href={`/salary-transfer/${offer.bankSlug}/`}
          class="dpst-bank-name"
          onClick={(event) => event.stopPropagation()}
        >
          {offer.bankName}
        </a>
        <span class="dpst-bank-tier">{offer.name}</span>
      </span>
    </div>
  );
}

export default function SalaryTransferTracker({ offers, scope, cardPaths, timelines }: Props) {
  // band: index into BANDS, or null = all bands (kept for our thin live
  // data, where defaulting to one band could hide offers).
  const [band, setBand] = useState<number | null>(null);
  const [cash, setCash] = useState(false);
  const [noCard, setNoCard] = useState(false);
  const [sharia, setSharia] = useState(false);
  const [sort, setSort] = useState<SortKey>("value");
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const activeBand = scope ?? (band === null ? null : BANDS[band]);

  const appliedLabel =
    (activeBand ? `Band: ${activeBand.label}` : "All bands") +
    (() => {
      const n = [cash, noCard, sharia].filter(Boolean).length;
      return n ? ` · ${n} filter${n > 1 ? "s" : ""}` : "";
    })();

  const rows = useMemo(() => {
    const expiry = (offer: SalaryTransferOffer) => timelines[offer.id]?.endDate === "published"
      ? daysUntil(offer.validUntil)
      : Infinity;
    return offers
      .flatMap((offer) => {
        const path = cardPaths[offer.id];
        if ((noCard && offer.creditCardRequired && !path?.financeAlternative) ||
          (sharia && !offer.sharia)) return [];
        const accountLabel = path?.accountRewardComponent;
        const reward = selectTrackerReward(
          noCard && accountLabel ? accountOnlyTrackerTiers(offer.salaryBands, accountLabel) : offer.salaryBands,
          activeBand,
          cash,
        );
        if (!reward) return [];
        const accountAmount = accountLabel
          ? accountOnlyTrackerTiers([reward], accountLabel)[0]?.rewardAmount
          : undefined;
        const rewardNote = accountLabel
          ? noCard
            ? "Account reward only"
            : accountAmount !== undefined && accountAmount < reward.rewardAmount
              ? "Includes optional card reward"
              : undefined
          : noCard && path?.financeAlternative
            ? "Qualifying finance required without a card"
            : undefined;
        return [{ offer, reward, rewardNote }];
      })
      .sort((a, b) => {
        if (sort === "value") return b.reward.rewardAmount - a.reward.rewardAmount;
        const aExpiry = expiry(a.offer);
        const bExpiry = expiry(b.offer);
        return aExpiry === bExpiry ? 0 : aExpiry - bExpiry;
      });
  }, [offers, activeBand, cash, noCard, sharia, sort, cardPaths, timelines]);

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
  const Detail = ({ o }: { o: SalaryTransferOffer }) => {
    const path = cardPaths[o.id];
    const cardExample = path?.example;
    return (
    <>
      <SalaryTransferTimeline offer={o} timeline={timelines[o.id]} heading="h2" />
      <div class="dpst-fineblock">
        <div class="dpst-finehead">Commitment</div>
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
          {path?.financeAlternative ? (
            <><span class="k">Bundle requirement</span><span class="v warn">Eligible card or finance</span></>
          ) : (
            <>
              <span class="k">Credit card required</span>
              <span class={`v ${o.creditCardRequired ? "warn" : "ok"}`}>{o.creditCardRequired ? "Yes" : "No"}</span>
            </>
          )}
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
        {cardExample && (
          <figure class="dpst-card-example">
            <img src={cardExample.src} alt="" width={cardExample.width} height={cardExample.height} loading="lazy" decoding="async" />
            <figcaption>
              <a href={`/cards/${cardExample.slug}/`}>{cardExample.name}</a>
              <span>One eligible card option. Qualifying finance is an alternative.</span>
              <small>Card image: {cardExample.issuer}</small>
            </figcaption>
          </figure>
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
        <div class={`vdate${isStale(o.lastVerified) ? " is-stale" : ""}`}>
          Last checked <b>{fmtDate(o.lastVerified)}</b> against the bank's
          published terms.
          {isStale(o.lastVerified) && (
            <>
              {" "}
              <span class="drift">
                More than 90 days ago — pending re-verification.
              </span>
            </>
          )}
        </div>
      </div>
    </>
    );
  };

  return (
    <section class="dpst dpst-responsive" aria-label="UAE salary-transfer offer tracker">
      {/* CONTROLS */}
      <div class="dpst-controls">
        {!scope && <>
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
              title={b.label}
              aria-pressed={band === i}
              onClick={() => setBand(band === i ? null : i)}
            >
              {b.shortLabel}
            </button>
          ))}
        </div>
        </>}

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
                No credit card required
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
            {noCard && <p class="dpst-filter-note">Some offers still require another product, such as qualifying finance.</p>}
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
      <div class="dpst-meta" role="status">
        <span class="dpst-count">
          <b>{rows.length}</b> offer{rows.length === 1 ? "" : "s"} match your
          filters
        </span>
        <span class="applied">{appliedLabel}</span>
      </div>
      <p class="dpst-salary-note">
        Rewards shown are the highest within the selected range. Check the salary beside each reward; lower salaries may qualify for a different amount.
      </p>

      {offers.length === 0 ? (
        <div class="dpst-empty">
          <div class="mark" aria-hidden="true">
            ⌀
          </div>
          <h4>No current offers in the latest sweep.</h4>
          <p>
            We list salary-transfer offers only while bank material supports
            them. None were current at the latest editorial sweep — check back,
            or see the methodology below for how we source them.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div class="dpst-empty">
          <div class="mark" aria-hidden="true">
            ⌀
          </div>
          <h4>No offers match — yet.</h4>
          <p>
            No current salary-transfer offers fit this band and filter combination.
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
                  <th scope="col">Salary for reward</th>
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
                {rows.map(({ offer: o, reward, rewardNote }) => {
                  const isOpen = open.has(o.id);
                  return (
                    <Fragment key={o.id}>
                      <tr
                        class={`dpst-row${isOpen ? " is-open" : ""}`}
                        onClick={() => toggleOpen(o.id)}
                      >
                        <td class="col-bank">
                          <BankIdentity offer={o} />
                        </td>
                        <td>
                          <span class={`dpst-badge ${badgeClass(reward.rewardType)}`}>
                            <span class="ic" aria-hidden="true" />
                            {badgeLabel(reward.rewardType)}
                          </span>
                        </td>
                        <td>
                          <RewardValue reward={reward} note={rewardNote} />
                        </td>
                        <td class="dpst-band-cell"><SalaryForReward offer={o} reward={reward} /></td>
                        <td>
                          <CampaignValidity offer={o} timeline={timelines[o.id]} />
                        </td>
                        <td>
                          <button
                            type="button"
                            class="dpst-expand"
                            aria-label={`Payday to payout and fine print for ${o.bankName}`}
                            aria-expanded={isOpen}
                            aria-controls={`dpst-desktop-${o.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleOpen(o.id);
                            }}
                          >
                            ▾
                          </button>
                        </td>
                      </tr>
                      <tr class="dpst-detail-row" id={`dpst-desktop-${o.id}`} hidden={!isOpen}>
                        <td colSpan={6}>
                          <div class="dpst-detail">
                            <div class="dpst-detail-inner">
                              <Detail o={o} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CARDS (mobile) */}
          <div class="dpst-cards">
            {rows.map(({ offer: o, reward, rewardNote }) => {
              const isOpen = open.has(o.id);
              return (
                <div
                  key={o.id}
                  class={`dpst-card${isOpen ? " is-open" : ""}`}
                >
                  <div class="dpst-card-head">
                    <BankIdentity offer={o} />
                    <div class="dpst-card-val">
                      <RewardValue reward={reward} note={rewardNote} />
                    </div>
                  </div>
                  {/* One chip line instead of three label rows (19 Oct
                      2026 UX review): reward type · salary band · days
                      left, keeping the urgency colours. */}
                  <div class="dpst-card-chips">
                    <span class={`dpst-badge ${badgeClass(reward.rewardType)}`}>
                      <span class="ic" aria-hidden="true" />
                      {badgeLabel(reward.rewardType)}
                    </span>
                    <CampaignValidity offer={o} timeline={timelines[o.id]} />
                  </div>
                  <p class="dpst-card-salary">
                    <span>Salary for reward</span>
                    <SalaryForReward offer={o} reward={reward} />
                  </p>
                  <button
                    type="button"
                    class="dpst-card-acc"
                    aria-label={`Fine print & timeline for ${o.bankName}`}
                    aria-expanded={isOpen}
                    aria-controls={`dpst-mobile-${o.id}`}
                    onClick={() => toggleOpen(o.id)}
                  >
                    Fine print &amp; timeline{" "}
                    <span class="chev" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  <div class="dpst-card-detail" id={`dpst-mobile-${o.id}`} hidden={!isOpen}>
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
          {/* Absolute path + hash: the tracker also renders on the five
              /salary-transfer/aed-* band pages, where a bare #methodology
              has no target (July 2026 anchor audit). */}
          Verdicts are DubaiPoints' own ·{" "}
          <a href="/salary-transfer/#methodology">Methodology →</a>
        </span>
      </div>
    </section>
  );
}
