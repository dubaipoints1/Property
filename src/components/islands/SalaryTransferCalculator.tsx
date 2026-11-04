import { useMemo, useState } from "preact/hooks";
import {
  type AdditionalProduct,
  type CalculatorInput,
  type SalaryTransferOffer,
  formatAED,
  offerTitle,
  rankOffers,
} from "../../lib/salaryTransfer";
import { Tween, useFlip } from "./motion";

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
      <form class="dpsc-form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label class="dpsc-label" for="dpsc-salary">
            Monthly salary
          </label>
          <input
            id="dpsc-salary"
            type="number"
            min={0}
            step="any"
            value={monthlySalary}
            onInput={(e) =>
              setMonthlySalary(
                Number((e.target as HTMLInputElement).value) || 0,
              )
            }
            class="dpsc-input"
          />
          <p class="dpsc-hint">Salary thresholds vary by offer. Enter your exact monthly salary.</p>
        </div>

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
      </form>

      <div class="dpsc-results">
        {top && (
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
              .
            </p>
          </div>
        )}

        {!top && (
          <div class="dpsc-empty">
            No estimate can be ranked for these inputs. Check the offer conditions below.
          </div>
        )}

        <div class="dpsc-rows" ref={rowList}>
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
              <p><a href={`/salary-transfer/${r.offer.bankSlug}/`}>Read offer conditions →</a></p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
