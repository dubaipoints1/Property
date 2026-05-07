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
    <div class="dp-tracker">
      <div class="dp-tracker-bands">
        {BANDS.map((b) => {
          const active = activeBand === b.label;
          return (
            <button
              key={b.label}
              type="button"
              onClick={() => setActiveBand(active ? null : b.label)}
              class={`dp-tracker-chip${active ? " is-active" : ""}`}
            >
              {b.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setActiveBand(null)}
          class="dp-tracker-chip is-muted"
        >
          All bands
        </button>
      </div>

      <div class="dp-tracker-filters">
        <label class="dp-tracker-toggle">
          <input
            type="checkbox"
            checked={cashOnly}
            onChange={(e) =>
              setCashOnly((e.target as HTMLInputElement).checked)
            }
          />
          <span>Cash only</span>
        </label>
        <label class="dp-tracker-toggle">
          <input
            type="checkbox"
            checked={noCardRequired}
            onChange={(e) =>
              setNoCardRequired((e.target as HTMLInputElement).checked)
            }
          />
          <span>No credit card required</span>
        </label>
        <label class="dp-tracker-toggle">
          <input
            type="checkbox"
            checked={shariaOnly}
            onChange={(e) =>
              setShariaOnly((e.target as HTMLInputElement).checked)
            }
          />
          <span>Sharia-compliant</span>
        </label>
        <label class="dp-tracker-select">
          <span>Tenure</span>
          <select
            value={tenureFilter ?? ""}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setTenureFilter(v === "" ? null : Number(v));
            }}
          >
            <option value="">Any</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </label>
        <label class="dp-tracker-select dp-tracker-select-end">
          <span>Sort</span>
          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey((e.target as HTMLSelectElement).value as SortKey)
            }
          >
            <option value="reward-desc">Highest reward</option>
            <option value="expiry-asc">Ending soonest</option>
            <option value="aed-per-month">AED per month of tenure</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p class="dp-tracker-empty">
          No live offers match these filters. Remove one — most filters are
          restrictive when stacked.
        </p>
      ) : (
        <ul class="dp-tracker-list">
          {filtered.map(({ offer, headlineReward }) => (
            <li class="dp-tracker-row" key={offer.id}>
              <div class="dp-tracker-row-main">
                <a href={`/salary-transfer/${offer.bankSlug}/`} class="dp-tracker-bank">
                  {offer.bankName}
                </a>
                <p class="dp-tracker-name">{offer.name}</p>
                <p class="dp-tracker-meta">
                  <span>{offer.salaryBands[0]?.rewardType.replace("_", " ")}</span>
                  <span>· {offer.tenureMonths} months</span>
                  {offer.sharia && <span>· Sharia</span>}
                  {!offer.creditCardRequired && <span>· No card</span>}
                </p>
              </div>
              <div class="dp-tracker-row-amount">
                <p class="dp-tracker-reward">
                  <span class="num">{formatAED(headlineReward)}</span>
                </p>
                <p class="dp-tracker-expiry">Ends in {daysUntil(offer.validUntil)} days</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
