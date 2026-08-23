# Coverage expansion dossier — Liv, Wio, Al Hilal (22 August 2026)

Head-of-Research dossier for the Chairman-directed breadth expansion
("make the website way better than the competitors in breadth and
depth"). All sources fetched live via Firecrawl on 2026-08-22; quotes
verbatim. This dossier underwrites the three new bank hubs, the two Liv
L2 card entries, and the tracker classifications shipped with it.

## Liv (digital brand of Emirates NBD)

Identity: "Liv" is a brand owned by Emirates NBD Bank PJSC (stated on
the Liv KFS). Digital-only; services via Liv X app; ENBD ATM network.

### Cards — <https://www.liv.me/en/liv-credit-card> + feature T&C
<https://www.liv.me/en/important-information/features/liv-credit-card-feature>
+ charges <https://www.liv.me/en/charges> (all fetched 2026-08-22)

Two cards (a third, Tamayaz, targets UAE Nationals — out of scope for
now). Rewards accrue as points convertible to cashback or Emirates
Skywards Miles; rate is set by TOTAL monthly spend tier and applies to
all that month's spends once a tier is reached:

**Liv Cashback+ Card** (Mastercard World tier)
- Tiers: AED 0–6,999 → 1.0% · 7,000–14,999 → 2.0% · 15,000+ → 4.0%
- Low-merchant categories (government, utilities, bills): 0.1%
- Cap: AED 1,500/month, additionally bounded by a % of credit limit
  (illustration: AED 20,000 limit → AED 800/mo max)
- Skywards alternative: up to 10,000 Miles/month
- Joining fee AED 700; annual fee AED 700 (joining fee waived with
  active Liv Max subscription); FX 1.99%; monthly interest 3.25%
  (APR 39%); late fee AED 175; card replacement AED 25
- Perks: 800+ airport lounges, 3 VOX tickets/mo + 25% F&B, 1 Careem
  airport transfer/yr, travel medical insurance to USD 500,000,
  Talabat 20% off 1 order/mo, Global Blue VIP

**Liv Cashback Card** (Mastercard Platinum tier)
- Tiers: AED 0–4,999 → 0.75% · 5,000–9,999 → 1.5% · 10,000+ → 2.0%
- Low-merchant 0.1%; cap AED 750/month (+ credit-limit bound)
- Skywards alternative: up to 5,000 Miles/month
- Free for life; FX 1.99%; monthly interest 3.49% (APR 41.88%)
- Perks: 25+ lounges, 2 VOX tickets/mo + 25% F&B, Talabat 20% off

Eligibility: **no salary minimum published** on any fetched Liv page or
the KFS; application and approval are app-based. L2 entries carry
`minSalary: 0` with `_provenance.eligibility: needs-review` (renders
"Pending"). One card per customer ("Customers can only apply for 1 of
the two credit cards"). Redemption needs a 500-point minimum.

Network basis (editor-confirmed): the feature T&C's tier names
("Tamayaz Platinum / Tamayaz World" in the KFS product table), the
Mastercard-published MCC framework, and Mastercard-branded perks (Zee5
Mastercard 4K offer) on both cards.

Salary transfer: rate-based only — "Transfer your salary and earn 6%
interest p.a on your savings" (Goal Account campaign,
<https://www.liv.me/en/campaign/salary-transfer-x-goal-account>);
historic Bonus Multiplier pays account interest by salary band. No
banded cash bonus. Tracker classification: checked, no current live
banded cash offer (rate-based benefits noted).

## Wio Bank (PJSC, Abu Dhabi)

Identity: independent digital bank, licensed by CBUAE, regulated by
SCA; backed by ADQ/Alpha Dhabi/e&/FAB consortium (public record).

### Credit — <https://wio.io/personal-credit> (fetched 2026-08-22)
- "Get up to 2% cashback on all your spends with Wio Credit" — with
  Salary, Family or Plus plans; cap AED 2,500/month
- Paying OTHER banks' credit cards through Wio Credit earns 0.5%
  cashback (cap AED 2,500/month) — unique-in-market feature
- Easy Cash: borrow from credit limit at AED 1/day per AED 1,000,
  repay within 30 days, 6-day grace, AED 199 late fee day 36
- Easy Installments 3–48 months
- Credit interest from 2.49%/month (Salary plan, per salary-plan page)
- KFS: "Credit Card Version 5, 01/08/2026" listed at
  <https://wio.io/key-fact-statement> — the PDF is served through a
  JS viewer that defeated three fetch channels (Firecrawl pdf parser
  ×2, session curl 403). **FX fee, annual/plan fee split and network
  are therefore unverified — no L2 card entry ships until the KFS is
  read (workstation task).**

### Salary plan — <https://wio.io/salary-plan> (fetched 2026-08-22)
- Free plan with salary transfer; otherwise Plus plan (paid) while
  setting up, auto-switches when salary lands within 2 months
- Minimum salary AED 15,000/month — or AED 5,000 for employees of
  Wio partner companies
- Benefits: 6% p.a. on one-month Fixed Saving Spaces (needs AED 5,000
  min monthly spend), 3.25% p.a. Saving Spaces, loans from 4.75%,
  credit interest from 2.49%/mo, up to 2% credit cashback
- No banded cash bonus. Tracker classification: checked, no current
  live banded cash offer (rate-based benefits noted).

## Al Hilal Bank (ADCB Group, Sharia-compliant)

Identity: digital-first Islamic bank, part of ADCB Group (shares ADCB
offer platform and ATM network; RAK branch closed 3 May per site).

### Cashback Credit Card —
<https://www.alhilalbank.ae/en/personal/cards/credit-cards/cashback-credit-card>
+ T&C PDF <https://www.alhilalbank.ae/en/Images/ahb-cashback-tcs-final.pdf>
(both fetched 2026-08-22)
- Choose 2 of 5 categories (grocery, fuel, international, dining,
  education) for the headline rate; rest of retail 1%; government MCCs
  and in-app utility payments 0%
- The headline rate is spend-tiered: total calendar-month spend
  AED 0–3,000 → 1% · 3,000.01–8,000 → 3% · >8,000 → 5% in the two
  chosen categories
- Caps: AED 250 per 5% category, AED 500 total per statement cycle
- No minimum spend to earn; category changes once/month, free twice a
  year; EEA transactions always 1%; MCC tables published in the T&C
- Mastercard (MCC framework + Priceless benefits page)
- Card upgraded effective 1 September 2024 per the product page
- **Fees unverified**: the Schedule of Fees PDF
  (<https://www.alhilalbank.ae/en/Images/Ahb-sof.pdf>) reset the
  connection on three fetch attempts (basic ×2, stealth ×1). Annual
  fee, FX and salary minimum therefore unsourced — no L2 card entry
  ships until the SoF is read (workstation task).

### Salary Transfer Campaign — EXPIRED
<https://www.alhilalbank.ae/en/salary-transfer-campaign> (fetched
2026-08-22): "The campaign will be valid from 4th May 2026 till 04th
August 2026." Structure (for the record): welcome bonus to AED 15,000
built from salary-transfer component (10% of salary capped AED 5,000;
AED 60,000+ transfer → +5,000), card-spend tiers (15k/25k/40k/55k →
+500/1,200/2,000/3,000), personal-finance and home-finance kickers.
The page still ranks #1 for salary-transfer queries 18 days after
closing. Tracker classification: checked — campaign expired 4 August
2026; successor watch noted. News-desk story filed same day.

## Addendum (same day, second pass) — Wio KFS v5 and fee schedule READ

The "unreachable" Wio documents fell to a channel change: the wio.io
`/file/` routes serve a JS viewer, but the viewer HTML embeds the real
Contentful asset URLs, which fetch cleanly.

### Wio Credit — Key Fact Statement v5, Effective August 2026
<https://assets.ctfassets.net/l65m9bcr2nac/6YdOzuMWXOLOGLsbL9YYG/e8d5c70a361d636d530db6d1790e0d85/wio-personal-credit-KFS-version-5_Eng_-august-2026.pdf>
(fetched 2026-08-22; canonical public link
<https://wio.io/file/wio-personal-credit-KFS-version-5(Eng)-august-2026.pdf>)
- Product: "The **Wio Mastercard World Card**" — network confirmed.
- "a **Foreign Exchange Fee of 2%** of the purchase amount will be
  charged" on non-AED transactions.
- Cashback: "not applicable to Standard Plan customers"; maximum
  **AED 2,500 per calendar month** (incl. "My Money" current-account
  transactions); **2% (using Wio Credit) of all purchases**; **0.5%**
  paying another UAE bank's credit card with Wio Credit (up to 0.5% of
  the Wio Credit limit; the KFS places a "minimum spend a total of
  retail transactions of AED 5,000.00 in the same cycle" condition in
  this clause); **0.5%** on government, real-estate and utility
  payments (incl. Easy Cash); cash advances/quasi-cash/crypto excluded;
  credited the 1st of the following month.
- Interest-free up to 60 days; minimum payment 5% or AED 100;
  first-month roll-over waiver; roll-over rate "set out in your Offer".
- Easy Cash: up to 50% of limit, AED 1/day per AED 1,000, up to 90
  days; Installments 3–48 months at 0% up to the roll-over rate.
- No salary minimum stated in v5 (the superseded deposit-card KFS said
  21–64 and AED 5,000+); eligibility is app-assessed → L2 carries
  `minSalary: 0` with `needs-review` eligibility, rendering "Pending".

### Wio Schedule of Fees Retail — Version 8, July 2026
<https://assets.ctfassets.net/l65m9bcr2nac/40SC3XeKXQBq62PViGbnSu/80e874a8d2fdb91f6d6cb27ce325d7e2/Schedule_of_Fees_Retail_-_Version_8_-_Jul_2026.pdf>
(fetched 2026-08-22; canonical public link <https://www.wio.io/personal-fees.pdf>)
- Plans: Standard AED 25/mo (free ≥ AED 3,000 balance) · Plus AED
  49/mo (free ≥ 35,000) · **Salary: free, minimum monthly salary
  transfer AED 15,000** (reducible for partner-company employees) ·
  Family AED 49/mo (free ≥ 35,000 or one member's 15,000+ salary).
- Credit: **no annual card fee row exists — the card itself is
  unpriced; the plan subscription is the price**. Card replacement
  AED 26.25; **late payment AED 199**; **roll-over interest 3.25%/month
  (39% APR) on Standard/Plus/Family and 2.29%/month (27.48% APR) on
  the Salary plan**; Easy Cash AED 1/day/1,000 (36.5% APR); 3-month
  installment AED 52.50 processing, longer tenures free.
- FX transaction fee 2% (debit table; matches the credit KFS's 2%).

Consequence: the **Wio Credit L2 entry ships** (annualFee 0 with the
plan-cost reality prose-front-and-centre, fxFee 2.0, base 2% with caps,
Mastercard). The Al Hilal SoF, by contrast, defeated five attempts
(connection reset ×3 across two proxies, general-KFS timeouts ×2,
alternate-domain 404) — its card entry remains gated on a workstation
read; mechanics are fully verified, fees are not.

### bankReputation — unshipped (same pass)
The collection had one entry (of 15 banks), was rendered by **no page**,
and its core `customerServiceRating` field is an unsourced 0–5 score —
the exact class of number the §6 posture and the Chairman-reserved
review-scores decision exist to police. Removed (collection definition +
directory); any future bank-reputation surface should come back through
the scores methodology decision, not as an orphaned schema.

## Follow-ups queued
1. Workstation: read Wio Credit KFS v5 (Aug 2026) and Al Hilal SoF;
   then ship both L2 card entries.
2. Scraper modules for liv / wio / al-hilal (fab.ts pattern) once L2
   entries exist for them to refresh.
3. Liv Tamayaz (Emirati segment) coverage decision.
4. Monitor registry additions for the three banks' product pages at
   the next provisioning pass.
