# Islamic single-card page with profit-rate and FX lines — fixture

Distilled from the DIB SoC shape (2 July 2026): an Islamic card page
carries "Monthly Profit Rate" percentages (the Murabaha/Salam financing
cost — never the FX margin) alongside the genuine international-usage
fee. parseFxFee must skip the profit-rate lines and resolve the FX fee.
(No dense annual-fee cluster and no soc/sof URL token here on purpose —
this targets the profit-rate anti-trigger, not the C6 heuristic.)

The card charges a monthly profit rate on Salam of up to 3.25% on
outstanding balances converted to instalments.

| International Usage Fee[non-AED](per transaction) | 3.70% of transaction amount |
| --- | --- |
| Takaful contribution (per month) | 0.94% |
