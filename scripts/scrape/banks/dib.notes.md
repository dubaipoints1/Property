# DIB scrape notes (Islamic)

- Rollout order #7 per the scrape-accuracy brief — the first Islamic
  bank, and the reason the profit-rate parser shape exists.
- ISLAMIC PHRASING: fees quote "Monthly Profit Rate on Salam" (Murabaha
  financing cost), never "interest rate". parseFxFee carries a
  profit-rate anti-trigger (fixture-locked 2 July 2026) so those
  percentages are never promoted to the FX fee.
- The SoC PDF is a multi-card schedule and its URL says "soc" — the C6
  URL rule fires and fee/FX correctly short-circuit to editor
  confirmation. Expect Multi-tier warnings on every run: contract, not
  failure.
- FX trap inside the SoC: an outdated 3.41% "International Usage Fee"
  row sits ABOVE the current "effective 1st Nov 2022: 3.70%" row. L2
  carries 3.70 (editor-confirmed) — never accept a proposal that
  regresses to 3.41.
- FEE FLAG (2 July 2026): L2 annualFee is 210; the Wajaha SoC lists
  Consumer Card Reward at AED 157.50 and Platinum at AED 208.95. The
  Wajaha schedule is the premium-segment doc — editor to re-confirm the
  fee against the standard consumer SoC and reconcile.
