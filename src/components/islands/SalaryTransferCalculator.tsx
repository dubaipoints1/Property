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
  eligible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  disqualified: "bg-slate-100 text-slate-500 border-slate-200",
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
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <form
        class="lg:col-span-2 space-y-6 rounded-lg border border-slate-200 bg-white p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label class="block text-sm font-medium text-slate-700">
            Monthly salary
          </label>
          <input
            type="number"
            min={4000}
            step={500}
            value={monthlySalary}
            onInput={(e) =>
              setMonthlySalary(
                Number((e.target as HTMLInputElement).value) || 0,
              )
            }
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p class="mt-1 text-xs text-slate-500">
            UAE WPS minimum is AED 4,000.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">
            Monthly credit-card spend (AED)
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={monthlyCardSpend}
            onInput={(e) =>
              setMonthlyCardSpend(
                Number((e.target as HTMLInputElement).value) || 0,
              )
            }
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={willStay12Months}
              onChange={(e) =>
                setWillStay12Months((e.target as HTMLInputElement).checked)
              }
            />
            I will stay at least 12 months
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shariaOnly}
              onChange={(e) =>
                setShariaOnly((e.target as HTMLInputElement).checked)
              }
            />
            Show Sharia-compliant offers only
          </label>
          <label class="flex items-center gap-2 text-sm">
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

        <fieldset class="space-y-2">
          <legend class="text-sm font-medium text-slate-700">
            Willing to take additional products
          </legend>
          {PRODUCT_OPTIONS.map((p) => (
            <label class="flex items-center gap-2 text-sm" key={p.value}>
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

      <div class="lg:col-span-3 space-y-4">
        {top && (
          <div class="rounded-lg border-2 border-brand-500 bg-brand-50 p-5">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Best for you
            </p>
            <h3 class="mt-1 text-xl font-semibold text-slate-900">
              {top.offer.bankName}
            </h3>
            <p class="text-sm text-slate-700">{top.offer.name}</p>
            <p class="mt-3 text-3xl font-bold text-slate-900">
              {formatAED(top.cashEquivalentAED)}
              <span class="ml-2 text-sm font-medium text-slate-600">
                cash-equivalent
              </span>
            </p>
            <p class="mt-2 text-sm text-slate-700">
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
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            No offers match your filters. Loosen them — for example, allow
            additional products or include voucher rewards.
          </div>
        )}

        <div class="space-y-3">
          {results.map((r, idx) => (
            <article
              key={r.offer.id}
              class={`rounded-lg border p-4 ${STATUS_CLASS[r.status]}`}
            >
              <header class="flex flex-wrap items-baseline justify-between gap-2">
                <h4 class="font-semibold text-slate-900">
                  <span class="mr-2 text-slate-400">#{idx + 1}</span>
                  {r.offer.bankName} — {r.offer.name}
                </h4>
                <span class="text-xs font-medium uppercase tracking-wide">
                  {STATUS_LABEL[r.status]}
                </span>
              </header>

              {r.matchedBand && (
                <div class="mt-2 text-sm">
                  <strong>{formatAED(r.cashEquivalentAED)}</strong>{" "}
                  cash-equivalent
                  {r.cashEquivalentAED !== r.rawRewardAED && (
                    <span class="text-slate-600">
                      {" "}
                      (face value {formatAED(r.rawRewardAED)})
                    </span>
                  )}
                </div>
              )}

              {r.breakdown.length > 0 && r.status !== "disqualified" && (
                <ul class="mt-2 space-y-1 text-xs text-slate-700">
                  {r.breakdown.map((b) => (
                    <li>
                      {b.label}: {formatAED(b.amount)}
                      {b.requires && (
                        <span class="text-slate-500"> — {b.requires}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {r.reasons.length > 0 && (
                <ul class="mt-2 list-disc pl-5 text-xs">
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
