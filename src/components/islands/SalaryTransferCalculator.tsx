import { useMemo, useState } from "preact/hooks";
import {
  type AdditionalProduct,
  type CalculatorInput,
  type SalaryTransferOffer,
  formatAED,
  rankOffers,
} from "../../lib/salaryTransfer";

interface Props {
  offers: SalaryTransferOffer[];
}

const PRODUCT_OPTIONS: { value: AdditionalProduct; label: string }[] = [
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Personal loan" },
  { value: "insurance", label: "Insurance" },
  { value: "savings", label: "Savings product" },
  { value: "mortgage", label: "Mortgage" },
];

const STATUS_LABEL: Record<string, string> = {
  eligible: "Eligible",
  warning: "Eligible — check warnings",
  disqualified: "Not eligible",
};

const STATUS_CLASS: Record<string, string> = {
  eligible: "is-eligible",
  warning: "is-warning",
  disqualified: "is-disqualified",
};

export default function SalaryTransferCalculator({ offers }: Props) {
  const [monthlySalary, setMonthlySalary] = useState(20000);
  const [monthlyCardSpend, setMonthlyCardSpend] = useState(3000);
  const [willStay12Months, setWillStay12Months] = useState(true);
  const [willingProducts, setWillingProducts] = useState<AdditionalProduct[]>([
    "credit_card",
  ]);
  const [shariaOnly, setShariaOnly] = useState(false);
  const [cashOnly, setCashOnly] = useState(false);

  const input: CalculatorInput = {
    monthlySalary,
    monthlyCardSpend,
    willStay12Months,
    willingProducts,
    shariaOnly,
    cashOnly,
  };

  const results = useMemo(() => rankOffers(offers, input), [
    offers,
    monthlySalary,
    monthlyCardSpend,
    willStay12Months,
    willingProducts,
    shariaOnly,
    cashOnly,
  ]);

  const eligible = results.filter((r) => r.status !== "disqualified");
  const top = eligible[0];

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
            min={4000}
            step={500}
            value={monthlySalary}
            onInput={(e) =>
              setMonthlySalary(
                Number((e.target as HTMLInputElement).value) || 0,
              )
            }
            class="dpsc-input"
          />
          <p class="dpsc-hint">UAE WPS minimum is AED 4,000.</p>
        </div>

        <div>
          <label class="dpsc-label" for="dpsc-spend">
            Monthly credit-card spend (AED)
          </label>
          <input
            id="dpsc-spend"
            type="number"
            min={0}
            step={500}
            value={monthlyCardSpend}
            onInput={(e) =>
              setMonthlyCardSpend(
                Number((e.target as HTMLInputElement).value) || 0,
              )
            }
            class="dpsc-input"
          />
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
            <p class="dpsc-best-eyebrow">Best for you</p>
            <h2>{top.offer.bankName}</h2>
            <p class="dpsc-best-offer">{top.offer.name}</p>
            <p class="dpsc-best-figure">
              {formatAED(top.cashEquivalentAED)}
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
            No offers match your filters. Loosen them — for example, allow
            additional products or include voucher rewards.
          </div>
        )}

        <div class="dpsc-rows">
          {results.map((r, idx) => (
            <article
              key={r.offer.id}
              class={`dpsc-row ${STATUS_CLASS[r.status]}`}
            >
              <header class="dpsc-row-head">
                <h3>
                  <span class="dpsc-rank">#{idx + 1}</span>
                  {r.offer.bankName} — {r.offer.name}
                </h3>
                <span class="dpsc-status">{STATUS_LABEL[r.status]}</span>
              </header>

              {r.matchedBand && (
                <div class="dpsc-row-value">
                  <strong>{formatAED(r.cashEquivalentAED)}</strong>{" "}
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
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
