import { useEffect, useMemo, useState } from "preact/hooks";
import { boundedSalaryAmount, hasSalaryJourney, salaryJourneyHref, salaryJourneyParams, salaryJourneyReturnHref, salaryJourneyState, type SalaryJourneyState } from "../../lib/readerJourneyState";
import { TRACKER_SALARY_BANDS } from "../../lib/salaryTransferTrackerBands";
import {
  type AdditionalProduct,
  type CalculatorInput,
  type SalaryTransferOffer,
  formatAED,
  offerTitle,
  rankOffers,
} from "../../lib/salaryTransfer";
import { Tween, useFlip } from "./motion";
import "./salaryTransferCalculator.css";

interface Props {
  offers: SalaryTransferOffer[];
}

const PRODUCT_OPTIONS: { value: AdditionalProduct; label: string }[] = [
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Personal loan or finance" },
  { value: "auto_finance", label: "Auto finance" },
  { value: "insurance", label: "Insurance" },
  { value: "savings", label: "Savings product" },
  { value: "mortgage", label: "Mortgage" },
];

const STATUS_LABEL: Record<string, string> = {
  eligible: "Estimate — matches your inputs",
  warning: "Estimate — check warnings",
  conditional: "Requires confirmation",
  disqualified: "Does not match your inputs",
};

const STATUS_CLASS: Record<string, string> = {
  eligible: "is-eligible",
  warning: "is-warning",
  conditional: "is-warning",
  disqualified: "is-disqualified",
};

export default function SalaryTransferCalculator({ offers }: Props) {
  const [monthlySalary, setMonthlySalary] = useState(20000);
  const [willStay12Months, setWillStay12Months] = useState(true);
  const [willingProducts, setWillingProducts] = useState<AdditionalProduct[]>([]);
  const [shariaOnly, setShariaOnly] = useState(false);
  const [cashOnly, setCashOnly] = useState(false);
  const [journey, setJourney] = useState<SalaryJourneyState | null>(null);
  const [needsExactSalary, setNeedsExactSalary] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const state = salaryJourneyState(params);
    if (!hasSalaryJourney(params)) return;
    setJourney(state); setCashOnly(state.cash); setShariaOnly(state.sharia);
    setWillingProducts(state.products ?? []);
    if (state.stay !== undefined) setWillStay12Months(state.stay);
    if (state.salary !== undefined) setMonthlySalary(state.salary);
    else { setMonthlySalary(0); setNeedsExactSalary(true); }
  }, []);
  const context: SalaryJourneyState = { ...(journey ?? { cash: false, noCard: false, sharia: false, sort: "value" }), cash: cashOnly, sharia: shariaOnly, noCard: journey?.noCard === true && !willingProducts.includes("credit_card"), salary: needsExactSalary ? undefined : monthlySalary, products: willingProducts, stay: willStay12Months };
  useEffect(() => {
    if (!journey) return;
    const url = new URL(location.href);
    for (const key of ["st_band", "st_cash", "st_no_card", "st_sharia", "st_sort", "st_offer", "st_return", "st_salary", "st_products", "st_stay"]) url.searchParams.delete(key);
    for (const [key, value] of salaryJourneyParams(context)) url.searchParams.set(key, value);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    dispatchEvent(new CustomEvent("dp:salary-profile"));
  }, [journey, monthlySalary, cashOnly, shariaOnly, needsExactSalary, willingProducts, willStay12Months]);

  const input: CalculatorInput = {
    monthlySalary,
    willStay12Months,
    willingProducts,
    shariaOnly,
    cashOnly,
  };

  const results = useMemo(() => rankOffers(offers, input), [
    offers,
    monthlySalary,
    willStay12Months,
    willingProducts,
    shariaOnly,
    cashOnly,
  ]);

  const top = results.find((r) => r.status === "eligible");
  const rowList = useFlip<HTMLDivElement>([results.map((r) => r.offer.id).join("|")]);

  const toggleProduct = (p: AdditionalProduct) => {
    setWillingProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  return (
    <div class="dpsc">
      {journey?.band && <p class="dpsc-hint">From your tracker: {TRACKER_SALARY_BANDS.find(b => b.slug === journey.band)?.label}. Enter your exact monthly salary; the tracker band is not an exact salary.</p>}
      <form class="dpsc-form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label class="dpsc-label" for="dpsc-salary">
            Monthly salary
          </label>
          <input
            id="dpsc-salary"
            type="number"
            min={0}
            max={1_000_000}
            step="0.01"
            value={monthlySalary}
            onInput={(e) => {
              const value = boundedSalaryAmount(String((e.target as HTMLInputElement).valueAsNumber));
              if (value !== undefined) { setMonthlySalary(value); setNeedsExactSalary(false); }
              else { setMonthlySalary(0); setNeedsExactSalary(true); }
            }}
            class="dpsc-input dp-ui-field"
          />
          <p class="dpsc-hint">Salary thresholds vary by offer. Enter your exact monthly salary.</p>
          <p class="dpsc-hint">Your choices are included in offer links. Share a link only if you want to share those choices.</p>
        </div>

        <details class="dpsc-options">
          <summary>Product choices and filters</summary>
          <div class="dpsc-options-content">
        <div class="dpsc-checks">
          <label class="dpsc-check">
            <input
              type="checkbox"
              checked={willStay12Months}
              onChange={(e) =>
                setWillStay12Months((e.target as HTMLInputElement).checked)
              }
            />
            I will stay at least 12 months
          </label>
          <label class="dpsc-check">
            <input
              type="checkbox"
              checked={shariaOnly}
              onChange={(e) =>
                setShariaOnly((e.target as HTMLInputElement).checked)
              }
            />
            Show Sharia-compliant offers only
          </label>
          <label class="dpsc-check">
            <input
              type="checkbox"
              checked={cashOnly}
              onChange={(e) =>
                setCashOnly((e.target as HTMLInputElement).checked)
              }
            />
            Cash rewards only (no vouchers)
          </label>
        </div>

        <fieldset class="dpsc-checks">
          <legend class="dpsc-label">Willing to take additional products</legend>
          {PRODUCT_OPTIONS.map((p) => (
            <label class="dpsc-check" key={p.value}>
              <input
                type="checkbox"
                checked={willingProducts.includes(p.value)}
                onChange={() => toggleProduct(p.value)}
              />
              {p.label}
            </label>
          ))}
        </fieldset>
          </div>
        </details>
      </form>

      <div class="dpsc-results">
        <p class="sr-only" role="status">{needsExactSalary ? "Enter your exact salary to calculate." : top ? `Highest matching estimate: ${top.offer.bankName}, ${formatAED(top.cashEquivalentAED)} cash-equivalent.` : "No estimate matches without a warning. Review the results and offer conditions."}</p>
        {top && !needsExactSalary && (
          <div class="dpsc-best">
            <p class="dpsc-best-eyebrow">Highest matching estimate</p>
            <h2>{top.offer.bankName}</h2>
            <p class="dpsc-best-offer">
              {offerTitle(top.offer.bankName, top.offer.name)}
            </p>
            <p class="dpsc-best-figure">
              <Tween value={top.cashEquivalentAED} format={formatAED} />
              <span class="unit">cash-equivalent</span>
            </p>
            <p class="dpsc-best-basis">
              Based on a salary of {formatAED(input.monthlySalary)} and the
              salary band {formatAED(top.matchedBand!.minSalary)}–
              {top.matchedBand!.maxSalary === null
                ? "no upper limit"
                : formatAED(top.matchedBand!.maxSalary)}
              . {willStay12Months ? "Assumes you will stay at least 12 months." : "Does not assume you will stay 12 months."}
            </p>
          </div>
        )}

        {(!top || needsExactSalary) && (
          <div class="dpsc-empty">
            {needsExactSalary ? "Enter a valid exact salary above to calculate, with no more than two decimal places. No estimate is selected until then." : results.some((r) => r.status === "warning")
              ? "No estimate matches without a warning. Review the results and offer conditions below."
              : "No matching estimate for these inputs. Check the offer conditions below."}
          </div>
        )}

        <div class="dpsc-rows" ref={rowList} hidden={needsExactSalary}>
          {results.map((r) => (
            <article
              key={r.offer.id}
              data-flip={r.offer.id}
              class={`dpsc-row ${STATUS_CLASS[r.status]}`}
            >
              <header class="dpsc-row-head">
                <h3>
                  {/* The rank was glued to the bank name in the accessible
                      name ("#1First Abu Dhabi Bank") because the gap was a
                      CSS margin, and every offer name repeats its own bank
                      prefix (2026-09-06 audit, F-038). */}
                  {r.offer.bankName} — {offerTitle(r.offer.bankName, r.offer.name)}
                </h3>
                <span class="dpsc-status">{STATUS_LABEL[r.status]}</span>
              </header>

              {(r.status === "eligible" || r.status === "warning") && (
                <div class="dpsc-row-value">
                  <strong><Tween value={r.cashEquivalentAED} format={formatAED} /></strong>{" "}
                  cash-equivalent
                  {r.cashEquivalentAED !== r.rawRewardAED && (
                    <span class="face">
                      {" "}
                      (face value {formatAED(r.rawRewardAED)})
                    </span>
                  )}
                </div>
              )}

              {r.breakdown.length > 0 && r.status !== "disqualified" && (
                <ul class="dpsc-breakdown">
                  {r.breakdown.map((b) => (
                    <li>
                      {b.label}: {formatAED(b.amount)}
                      {b.requires && <span class="req"> — {b.requires}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {r.reasons.length > 0 && (
                <ul class="dpsc-reasons">
                  {r.reasons.map((reason) => (
                    <li>{reason}</li>
                  ))}
                </ul>
              )}
              <p><a data-salary-offer={r.offer.id} href={salaryJourneyHref(`/salary-transfer/${r.offer.bankSlug}/`, { ...context, offer: r.offer.id })}>Read offer conditions →</a></p>
            </article>
          ))}
        </div>
      </div>
      {journey && <p class="dpsc-hint"><a href={salaryJourneyReturnHref(context)}>Return to the same tracker shortlist →</a></p>}
    </div>
  );
}
