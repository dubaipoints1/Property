import { useMemo, useState } from "preact/hooks";
import {
  type SalaryTransferOffer,
  daysUntil,
  findBand,
  formatAED,
} from "../../lib/salaryTransfer";

interface Props {
  offers: SalaryTransferOffer[];
}

type SortKey = "reward-desc" | "expiry-asc" | "aed-per-month";

const BANDS: { label: string; min: number; max: number | null }[] = [
  { label: "AED 5k–8k", min: 5000, max: 7999 },
  { label: "AED 8k–15k", min: 8000, max: 14999 },
  { label: "AED 15k–30k", min: 15000, max: 29999 },
  { label: "AED 30k–50k", min: 30000, max: 49999 },
  { label: "AED 50k+", min: 50000, max: null },
];

export default function SalaryTransferTracker({ offers }: Props) {
  const [activeBand, setActiveBand] = useState<string | null>(null);
  const [cashOnly, setCashOnly] = useState(false);
  const [noCardRequired, setNoCardRequired] = useState(false);
  const [shariaOnly, setShariaOnly] = useState(false);
  const [tenureFilter, setTenureFilter] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("reward-desc");

  const filtered = useMemo(() => {
    const sampleSalary = activeBand
      ? BANDS.find((b) => b.label === activeBand)?.min ?? null
      : null;

    return offers
      .filter((o) => {
        if (cashOnly && !o.salaryBands.some((b) => b.rewardType === "cash"))
          return false;
        if (noCardRequired && o.creditCardRequired) return false;
        if (shariaOnly && !o.sharia) return false;
        if (tenureFilter !== null && o.tenureMonths !== tenureFilter)
          return false;
        if (sampleSalary !== null) {
          const band = findBand(o.salaryBands, sampleSalary);
          if (!band) return false;
        }
        return true;
      })
      .map((o) => {
        const band =
          sampleSalary !== null ? findBand(o.salaryBands, sampleSalary) : null;
        const headlineReward = band
          ? band.rewardAmount
          : Math.max(...o.salaryBands.map((b) => b.rewardAmount));
        return { offer: o, headlineReward };
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "reward-desc":
            return b.headlineReward - a.headlineReward;
          case "expiry-asc":
            return (
              new Date(a.offer.validUntil).getTime() -
              new Date(b.offer.validUntil).getTime()
            );
          case "aed-per-month":
            return (
              b.headlineReward / b.offer.tenureMonths -
              a.headlineReward / a.offer.tenureMonths
            );
        }
      });
  }, [
    offers,
    activeBand,
    cashOnly,
    noCardRequired,
    shariaOnly,
    tenureFilter,
    sortKey,
  ]);

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        {BANDS.map((b) => {
          const active = activeBand === b.label;
          return (
            <button
              key={b.label}
              type="button"
              onClick={() => setActiveBand(active ? null : b.label)}
              class={`rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-brand-500"
              }`}
            >
              {b.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setActiveBand(null)}
          class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-500"
        >
          All bands
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-700">
        <label class="flex items-center gap-1">
          <input
            type="checkbox"
            checked={cashOnly}
            onChange={(e) =>
              setCashOnly((e.target as HTMLInputElement).checked)
            }
          />
          Cash only
        </label>
        <label class="flex items-center gap-1">
          <input
            type="checkbox"
            checked={noCardRequired}
            onChange={(e) =>
              setNoCardRequired((e.target as HTMLInputElement).checked)
            }
          />
          No credit card required
        </label>
        <label class="flex items-center gap-1">
          <input
            type="checkbox"
            checked={shariaOnly}
            onChange={(e) =>
              setShariaOnly((e.target as HTMLInputElement).checked)
            }
          />
          Sharia-compliant
        </label>
        <label class="flex items-center gap-1">
          Tenure
          <select
            value={tenureFilter ?? ""}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setTenureFilter(v === "" ? null : Number(v));
            }}
            class="rounded border border-slate-300 px-2 py-1"
          >
            <option value="">Any</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </label>
        <label class="ml-auto flex items-center gap-1">
          Sort
          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey((e.target as HTMLSelectElement).value as SortKey)
            }
            class="rounded border border-slate-300 px-2 py-1"
          >
            <option value="reward-desc">Highest reward</option>
            <option value="expiry-asc">Ending soonest</option>
            <option value="aed-per-month">AED per month of tenure</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No live offers match these filters. Try removing one — most filters
          are restrictive when stacked.
        </p>
      ) : (
        <ul class="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {filtered.map(({ offer, headlineReward }) => (
            <li
              key={offer.id}
              class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <a
                  href={`/salary-transfer/${offer.bankSlug}/`}
                  class="text-base font-semibold text-slate-900 no-underline hover:text-brand-600"
                >
                  {offer.bankName}
                </a>
                <p class="text-xs text-slate-600">{offer.name}</p>
                <p class="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span>
                    {offer.salaryBands[0]?.rewardType.replace("_", " ")}
                  </span>
                  <span>· {offer.tenureMonths} months</span>
                  {offer.sharia && <span>· Sharia</span>}
                  {!offer.creditCardRequired && <span>· No card needed</span>}
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-slate-900">
                  {formatAED(headlineReward)}
                </p>
                <p class="text-[11px] text-slate-500">
                  Ends in {daysUntil(offer.validUntil)} days
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
