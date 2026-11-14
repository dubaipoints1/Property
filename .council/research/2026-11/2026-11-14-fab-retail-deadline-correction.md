# FAB retail deal deadline correction — source receipt

Read 14 November 2026 on verified main base
`ef6da887fce2f8fd717b7276198a103c63477564`. This resolves the date
evidence gap in `fab-retail-index-deadline-drift-november-2026-triage`
only; no queue row was edited. The prior record truthfully describes the
previous failed detail reads. The exact issuer detail pages now respond
and each has matching date lines in its heading and offer body.
The [issuer index](https://www.bankfab.com/en-ae/personal/credit-cards/offers)
also lists those same dates (lines 59–60 on this read); the index alone
is not the governing evidence.

## Exact issuer date pins

- `fab-amazon-10pct-monthly` — [FAB Amazon.ae detail](https://www.bankfab.com/en-ae/personal/credit-cards/offers/amazon-year-round-offer), rendered lines 53 and 68.
- `fab-noon-10pct-monthly` — [FAB noon detail](https://www.bankfab.com/en-ae/personal/credit-cards/offers/noon-year-round-offer), rendered lines 53 and 68.
- `fab-lulu-20pct-online` — [FAB LuLu detail](https://www.bankfab.com/en-ae/personal/credit-cards/offers/lulu-hypermarket-20-percent-off), rendered lines 53 and 66.

```text
fab-amazon-10pct-monthly
Valid until 15 November 2026
Valid once per month until 15 November 2026.
fab-noon-10pct-monthly
Valid until 15 November 2026
Valid once per month until 15 November 2026.
fab-lulu-20pct-online
Valid until 15 November 2026
Valid twice per month until 15 November 2026.
```

Deterministic read-back: apply the anchored regular expression
`^Valid(?: (?:once|twice) per month)? until (\d{1,2}) ([A-Za-z]+) (\d{4})\.?$`
to both source lines of each merchant, normalise month using a fixed
calendar month table and require the two resulting ISO dates to match
the existing MDX entry's corrected `expiresOn` value. No financial amount,
earn rate or other card field is extracted or changed here.

The offer pages previously recorded 31 December. We cannot establish
when FAB first changed the pages or whether November will be followed
by a different campaign. No exact cutoff hour or actual basket
availability was verified. LuLu's heading says Thursdays while its
body says twice per month; the recorded end date comes from both date
lines and does not establish eligible days. Amazon's normal-month
purchase offer is not the separate Amazon now weekend offer or the
FAB card-acquisition gift-card promotion. No new merchant terms, code
claim, coupon test, source dates for other facts, or release permission.
