/**
 * /calculator/interest/ — what a carried balance costs.
 *
 * Arithmetic on the reader's own inputs. The two defaults come from L2 —
 * the median published monthly rate and the modal minimum-payment rule —
 * and the page beside this island says how many cards each matches. Picking
 * a card fills its published rate and rule in; the reader can still edit
 * both, because a card's KFS may have moved since it was verified.
 *
 * Pure maths lives in src/lib/interestPayoff.ts and is tested there. This
 * file is only the form and the read-out.
 */
import { useMemo, useState } from "preact/hooks";
import {
  payoff,
  effectiveAnnualPct,
  nominalAnnualPct,
  type PaymentRule,
  type ParsedMinPayment,
  type RateDefault,
  type MinPaymentDefault,
} from "../../lib/interestPayoff";

export interface CardRateOption {
  slug: string;
  name: string;
  bank: string;
  monthly: number;
  minPayment: ParsedMinPayment | null;
  minPaymentText: string | null;
}

interface Props {
  cards: CardRateOption[];
  rateDefault: RateDefault | null;
  minDefault: MinPaymentDefault | null;
}

const aed = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 });
const fmtAED = (n: number) => aed.format(Math.round(n));

function monthsLabel(n: number): string {
  const y = Math.floor(n / 12);
  const m = n % 12;
  if (y === 0) return `${m} month${m === 1 ? "" : "s"}`;
  if (m === 0) return `${y} year${y === 1 ? "" : "s"}`;
  return `${y} yr ${m} mo`;
}

export default function InterestPayoffCalculator({ cards, rateDefault, minDefault }: Props) {
  const [balance, setBalance] = useState(10000);
  const [rate, setRate] = useState(rateDefault?.monthlyRatePct ?? 3.5);
  const [mode, setMode] = useState<"minimum" | "fixed">("minimum");
  const [minPct, setMinPct] = useState(minDefault?.percent ?? 5);
  const [minFloor, setMinFloor] = useState(minDefault?.floorAED ?? 100);
  const [fixed, setFixed] = useState(1000);
  const [cardSlug, setCardSlug] = useState("");

  const selected = cards.find((c) => c.slug === cardSlug) ?? null;

  const rule: PaymentRule =
    mode === "minimum"
      ? { kind: "minimum", percent: minPct, floorAED: minFloor }
      : { kind: "fixed", amountAED: fixed };

  const result = useMemo(
    () => payoff({ balanceAED: balance, monthlyRatePct: rate, rule }),
    [balance, rate, rule.kind, minPct, minFloor, fixed],
  );

  // The comparison the reader most needs: the same first payment, held
  // flat instead of shrinking with the balance.
  const counterpart = useMemo(() => {
    if (mode === "minimum") {
      return {
        label: `If you paid a flat ${fmtAED(result.firstPayment)} every month instead`,
        r: payoff({ balanceAED: balance, monthlyRatePct: rate, rule: { kind: "fixed", amountAED: result.firstPayment } }),
      };
    }
    return {
      label: `At the minimum payment (${minPct}% or ${fmtAED(minFloor)}) instead`,
      r: payoff({ balanceAED: balance, monthlyRatePct: rate, rule: { kind: "minimum", percent: minPct, floorAED: minFloor } }),
    };
  }, [mode, balance, rate, result.firstPayment, minPct, minFloor]);

  const pickCard = (slug: string) => {
    setCardSlug(slug);
    const c = cards.find((k) => k.slug === slug);
    if (!c) return;
    setRate(c.monthly);
    if (c.minPayment) {
      setMinPct(c.minPayment.percent);
      setMinFloor(c.minPayment.floorAED ?? 0);
    }
  };

  // Schedule rows worth showing: the first six months, then each
  // anniversary, then the final month.
  const rows = useMemo(() => {
    const s = result.schedule;
    return s.filter((row, i) => i < 6 || row.month % 12 === 0 || i === s.length - 1);
  }, [result]);

  const num = (e: Event) => Number((e.target as HTMLInputElement).value) || 0;

  return (
    <div class="dp-calc dp-ipc">
      <form class="dp-calc-form" onSubmit={(e) => e.preventDefault()} aria-label="Balance, rate and payment">
        <div class="dp-calc-form-head">
          <h2>Your balance</h2>
        </div>

        <div class="dp-ipc-field">
          <label htmlFor="ipc-balance">Balance carried (AED)</label>
          <input id="ipc-balance" class="dp-ui-field dp-ipc-wide" type="number" min={0} step={100} value={balance} onInput={(e) => setBalance(Math.max(0, num(e)))} />
        </div>

        <fieldset class="dp-ipc-field dp-ipc-mode">
          <legend>How you pay</legend>
          <label><input type="radio" name="ipc-mode" checked={mode === "minimum"} onChange={() => setMode("minimum")} /> Minimum only</label>
          <label><input type="radio" name="ipc-mode" checked={mode === "fixed"} onChange={() => setMode("fixed")} /> A fixed amount</label>
        </fieldset>

        {mode === "fixed" && (
          <div class="dp-ipc-field">
            <label htmlFor="ipc-fixed">Fixed monthly payment (AED)</label>
            <input id="ipc-fixed" class="dp-ui-field dp-ipc-wide" type="number" min={0} step={50} value={fixed} onInput={(e) => setFixed(Math.max(0, num(e)))} />
          </div>
        )}

        <details class="dp-ipc-options">
          <summary>Adjust interest rate and minimum payment</summary>
          <div class="dp-ipc-options-fields">
        <div class="dp-ipc-field">
          <label htmlFor="ipc-card">Start from a card's published rate</label>
          <select id="ipc-card" class="dp-ui-field dp-ipc-select" value={cardSlug} onChange={(e) => pickCard((e.target as HTMLSelectElement).value)}>
            <option value="">Use the default ({rate}% a month)</option>
            {cards.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} — {c.monthly}%/mo
              </option>
            ))}
          </select>
          {selected && (
            <p class="dp-ipc-hint">
              {selected.minPaymentText
                ? <>Published minimum: “{selected.minPaymentText}”.</>
                : <>This card publishes no minimum-payment rule in our data; the default rule below is kept.</>}
            </p>
          )}
        </div>

        <div class="dp-ipc-field">
          <label htmlFor="ipc-rate">Monthly rate (%)</label>
          <div class="dp-ipc-inline">
            <input id="ipc-rate" class="dp-ui-field" type="number" min={0} max={20} step={0.01} value={rate} onInput={(e) => setRate(Math.max(0, num(e)))} />
            <span class="dp-ipc-hint">
              = {nominalAnnualPct(rate).toFixed(1)}% a year as quoted; {effectiveAnnualPct(rate).toFixed(1)}% compounded
            </span>
          </div>
        </div>

          {mode === "minimum" && <fieldset class="dp-ipc-field dp-ipc-rule">
            <legend>Minimum payment rule</legend>
            <div class="dp-ipc-inline">
              <input class="dp-ui-field" type="number" min={0} max={100} step={0.01} value={minPct} onInput={(e) => setMinPct(Math.max(0, num(e)))} aria-label="Minimum payment percentage of balance" />
              <span>% of balance, or</span>
              <input class="dp-ui-field" type="number" min={0} step={10} value={minFloor} onInput={(e) => setMinFloor(Math.max(0, num(e)))} aria-label="Minimum payment floor in AED" />
              <span>AED, whichever is higher</span>
            </div>
          </fieldset>}
          </div>
        </details>
      </form>

      <section class="dp-calc-results" aria-live="polite">
        <header class="dp-calc-results-head">
          <h2>{result.clears ? "What it costs" : "This never clears"}</h2>
          <p class="dp-ipc-basis">{rate}% monthly interest · {mode === "minimum" ? `${minPct}% of balance or ${fmtAED(minFloor)}, whichever is higher` : `${fmtAED(fixed)} fixed monthly payment`}</p>
          <p class="dp-calc-results-sub">
            {result.clears
              ? "Interest accrues on the opening balance each month, your payment lands, and the rest carries. Estimates from the rate and rule you set; your statement decides."
              : "Your payment does not beat the month's interest, so the balance never falls. Raise the payment or the minimum percentage."}
          </p>
        </header>

        {result.clears && (
          <dl class="dp-stats is-four dp-ipc-stats">
            <div class="dp-stat"><dt>Time to clear</dt><dd>{monthsLabel(result.months)}</dd></div>
            <div class="dp-stat"><dt>Total interest</dt><dd>{fmtAED(result.totalInterest)}</dd></div>
            <div class="dp-stat"><dt>Total paid back</dt><dd>{fmtAED(result.totalPaid)}</dd></div>
            <div class="dp-stat"><dt>First payment</dt><dd>{fmtAED(result.firstPayment)}</dd></div>
          </dl>
        )}

        {result.clears && counterpart.r.clears && (
          <div class="dp-take dp-ipc-take">
            <p class="label">{counterpart.label}</p>
            <p>
              Clears in <strong>{monthsLabel(counterpart.r.months)}</strong> with{" "}
              <strong>{fmtAED(counterpart.r.totalInterest)}</strong> of interest —{" "}
              {counterpart.r.totalInterest < result.totalInterest
                ? <>{fmtAED(result.totalInterest - counterpart.r.totalInterest)} less than the plan above.</>
                : <>{fmtAED(counterpart.r.totalInterest - result.totalInterest)} more than the plan above.</>}
            </p>
          </div>
        )}
        {result.clears && !counterpart.r.clears && (
          <div class="dp-take dp-ipc-take">
            <p class="label">{counterpart.label}</p>
            <p>The balance would never clear: that payment does not cover the first month's interest.</p>
          </div>
        )}

        {result.clears && rows.length > 0 && (
          <details class="dp-ipc-schedule">
            <summary>Show the month-by-month schedule</summary>
            <div class="dp-ipc-schedule-wrap" tabIndex={0} role="region" aria-label="Monthly repayment schedule">
              <table class="dp-data-table">
                <thead>
                  <tr><th>Month</th><th class="num">Opening</th><th class="num">Interest</th><th class="num">Payment</th><th class="num">Closing</th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td class="num">{fmtAED(row.opening)}</td>
                      <td class="num">{fmtAED(row.interest)}</td>
                      <td class="num">{fmtAED(row.payment)}</td>
                      <td class="num">{fmtAED(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="dp-ipc-hint">First six months, then each anniversary, then the final month.</p>
          </details>
        )}
      </section>

      <style>{`
        .dp-ipc { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--dp-ui-gap, 20px); }
        @media (min-width: 900px) { .dp-ipc { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); } }
        .dp-ipc .dp-calc-form {
          display: flex; flex-direction: column; gap: 12px; align-self: start;
          border: 1px solid var(--line); border-radius: var(--dp-ui-radius, 8px);
          padding: clamp(12px, 2.2vw, 20px); background: var(--paper);
        }
        .dp-ipc .dp-calc-form h2, .dp-ipc .dp-calc-results h2 { font-size: 1.4rem; margin: 0 0 5px; }
        .dp-ipc-field label, .dp-ipc-field legend {
          display: block; font-size: 12px; font-weight: 600; color: var(--ink); margin-bottom: 4px;
        }
        .dp-ipc-mode, .dp-ipc-rule { border: 0; padding: 0; margin: 0; min-inline-size: 0; }
        .dp-ipc-mode label { display: inline-flex; gap: 6px; align-items: center; margin-right: 12px; font-weight: 500; min-block-size: var(--dp-ui-control, 44px); }
        .dp-ipc-mode input { accent-color: var(--green); }
        .dp-ipc-wide, .dp-ipc-select { width: 100%; }
        .dp-ipc-inline input { inline-size: 88px; }
        .dp-ipc-inline { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 12px; color: var(--ink-soft); }
        .dp-ipc-hint { font-size: 12px; color: var(--ink-soft); margin: 6px 0 0; line-height: 1.5; font-feature-settings: 'tnum'; }
        .dp-ipc-options { border-block-start: 1px solid var(--line); }
        .dp-ipc-options-fields { display: grid; gap: 12px; padding-block-end: 5px; }
        .dp-ipc-basis { margin: 0; color: var(--ink); font-size: .9rem; font-weight: 650; }
        .dp-ipc .dp-calc-results-sub { margin-block: 6px 14px; color: var(--ink-soft); font-size: .875rem; }
        .dp-ipc-stats { margin-bottom: 18px; }
        .dp-ipc-stats dd { font-feature-settings: 'tnum'; }
        .dp-ipc-take { margin: 0 0 18px; }
        .dp-ipc summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--green); min-block-size: var(--dp-ui-control, 44px); align-content: center; }
        .dp-ipc :is(summary, .dp-ipc-schedule-wrap):focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
        .dp-ipc-schedule-wrap { overflow-x: auto; margin-top: 10px; }
        .dp-ipc-schedule .num { text-align: right; font-feature-settings: 'tnum'; }
      `}</style>
    </div>
  );
}
