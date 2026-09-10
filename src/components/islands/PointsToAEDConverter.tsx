/**
 * /valuations/ — a balance in points or miles, priced at the published
 * DP value. The one number per currency that /valuations/ publishes,
 * applied to the reader's own balance; nothing else. Programmes with no
 * published baseline are listed but cannot be selected, so the tool cannot
 * quietly price a currency the table says is Pending.
 */
import { useMemo, useState } from "preact/hooks";

export interface ConverterProgramme {
  slug: string;
  name: string;
  currencyName: string;
  /** Fils per unit, or null when no baseline is published. */
  dpValue: number | null;
}

interface Props {
  programmes: ConverterProgramme[];
}

const aed = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export default function PointsToAEDConverter({ programmes }: Props) {
  const priced = programmes.filter((p) => p.dpValue != null);
  const [slug, setSlug] = useState(priced[0]?.slug ?? "");
  const [balance, setBalance] = useState(50000);

  const programme = useMemo(() => programmes.find((p) => p.slug === slug) ?? null, [programmes, slug]);
  const fils = programme?.dpValue ?? null;
  const valueAED = fils == null ? null : (balance * fils) / 100;
  const perThousand = fils == null || fils === 0 ? null : Math.ceil(100000 / fils);

  if (priced.length === 0) return null;

  return (
    <form class="dp-p2a" onSubmit={(e) => e.preventDefault()} aria-label="Points to AED converter">
      <div class="dp-p2a-fields">
        <label>
          <span>Programme</span>
          <select class="dp-calc-num" value={slug} onChange={(e) => setSlug((e.target as HTMLSelectElement).value)}>
            {programmes.map((p) => (
              <option key={p.slug} value={p.slug} disabled={p.dpValue == null}>
                {p.name}{p.dpValue == null ? " — no published baseline" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Balance ({programme?.currencyName ?? "units"})</span>
          <input class="dp-calc-num" type="number" min={0} step={1000} value={balance} onInput={(e) => setBalance(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))} />
        </label>
      </div>
      <p class="dp-p2a-out" aria-live="polite">
        {valueAED != null && fils != null ? (
          <>
            ≈ <strong>{aed.format(Math.round(valueAED))}</strong> at {fils.toFixed(1)} fils each
            {perThousand != null && <> · AED 1,000 needs about {int.format(perThousand)} {programme?.currencyName}</>}
          </>
        ) : (
          <>Pick a programme with a published baseline.</>
        )}
      </p>
      <p class="dp-p2a-note">
        DP value is our conservative cost-basis baseline, the same figure the card reviews use.
        A specific redemption can beat it or fall short of it.
      </p>
      <style>{`
        .dp-p2a { margin: 0 32px 20px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 4px; background: var(--paper); }
        .dp-p2a-fields { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .dp-p2a-fields { grid-template-columns: 1fr 1fr; } }
        .dp-p2a label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: var(--ink); }
        .dp-p2a .dp-calc-num { width: 100%; }
        .dp-p2a-out { margin: 12px 0 0; font-size: 15px; color: var(--ink-soft); font-feature-settings: 'tnum'; }
        .dp-p2a-out strong { font-family: 'Fraunces', serif; font-size: 22px; color: var(--ink); }
        .dp-p2a-note { margin: 6px 0 0; font-size: 11px; color: var(--muted); line-height: 1.5; }
        @media (max-width: 640px) { .dp-p2a { margin-left: 16px; margin-right: 16px; } }
      `}</style>
    </form>
  );
}
