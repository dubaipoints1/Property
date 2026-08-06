# Dossier — HSBC and ADCB salary-transfer offers (Stage 3, 6 August 2026)

Prepared for the coverage-backfill brief
(`.council/briefs/2026-08-05-salary-transfer-coverage-backfill.md`) and
the 30 May unverified-figures brief. All sources read as Firecrawl
**markdown** scrapes in the main session on 6 August 2026 — no JSON/LLM
extraction (§6). Verbatim excerpts below are the fact base for the typed
entries; anything not quoted here is not in the entries.

## HSBC — New to Bank and Customer Relationship Offer (LIVE)

Sources:
- Landing: `https://www.hsbc.ae/premier/rewards-and-offers/` (fresh
  scrape, 6 Aug 2026)
- T&C PDF:
  `https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/new-to-bank-and-customer-relationship-offer-terms-and-conditions.pdf`
  — fetched successfully 6 Aug 2026 via the Firecrawl PDF parser after
  two prior raw-fetch timeouts (the registry `_pending` verdict said
  change the channel, and that was right).

Key excerpts (T&C unless noted):

> "…launched a cashback offer (the 'Offer') for new customers ('you')
> who open an HSBC (Premier/Advance) Account during the offer period
> from 2 January 2026 till 31 December 2026 (Both dates inclusive)"

> "…for only New to Bank Customers (i.e. customers who do not currently
> bank with HSBC)… Existing customers, including those who hold inactive
> relationships with HSBC as of the Offer start date, are not eligible…
> Joint account holders opening new accounts under their sole name will
> not be eligible… HSBC Staff are not eligible."

> "You must download and activate the HSBC Mobile Banking App within 30
> days after opening your account."

> Premier salary criteria: "transfer at least 2 eligible salaries of
> AED 40,000 (AED 30,000 if you are an Emirati national) or more into
> your HSBC Premier account within the first 3 months of your account
> opening date."

> Advance salary criteria: "Transfer at least 2 eligible salaries
> between AED 10,000 or more up to AED 39,999 into your HSBC Advance
> Account within the first 3 months of your account opening…"

> Rewards table rows: "AED 2,000 | Premier Salary" · "AED 750 | Advance
> Salary OR Balance" · "AED 1,000 | Advance Salary OR Balance (Employees
> of companies listed with our Employee Workspace Solutions EWS)". The
> larger AED 8,000/10,000/12,000 rows are **funding-based** (new-to-bank
> balances from AED 500k / AED 2M), not salary-based.

> Payout: "The Cashback will automatically be credited to your new HSBC
> UAE account within 90 calendar days, if you fulfill all the conditions
> and salary eligibility criteria of this Offer."

> Clawback: "If you close your HSBC account within less than 180
> calendar days from your first funds deposit or salary credit… you will
> no longer be eligible… [and] if you fail to transfer the required
> number of consecutive salary payments as per the required eligibility
> criteria and your salary transfer is interrupted within less than 180
> calendar days from the date of your first [credit]…" clawback applies.

> Oddity, quoted in full because it is unusual: "Participants in this
> Campaign may not make any public comment (including via social media)
> regarding the Offer or any other aspect of this Campaign without
> HSBC's prior written consent and any breach of this provision shall
> confer a right on HSBC at HSBC's discretion not to award the Offer to
> or to claw-back the Offer from the participant concerned immediately
> and without prior notice."

> Ambiguity flagged for the entry: the eligibility FAQ contains the row
> "Eligibility is based on salary credits and new HSBC customers
> transferring salary from other banks to HSBC will not be eligible for
> this Offer." As printed this contradicts the offer's own premise; the
> prudent reading (consistent with "eligible salaries") is that
> qualifying credits must be genuine employer salary payments, not funds
> the customer moves between banks personally. The entry quotes and
> flags this rather than silently interpreting it.

Landing-page corroboration (footnote 11): "Within the first 3 months of
your account opening date you must transfer an ongoing individual
monthly net salary of AED 40,000 (AED 30,000 if you're an Emirati) or
more into your HSBC Premier Account and continue to meet the criteria
for at least 2 consecutive months." Offer ends 31 December 2026.

**Editorial call**: one tracker entry covering BOTH salary tiers
(Advance 10,000–39,999 → AED 750; Premier 40,000+ → AED 2,000), since
they are one campaign under one T&C. Funding-based legs are noted in the
body, not modelled as salary bands. The Emirati 30,000 threshold and the
EWS AED 1,000 uplift live in `requirements[]`.

## ADCB — "Switch" salary-transfer campaign, cycle 10 (EXPIRED)

Sources:
- Landing: `https://www.adcb.com/en/personal/promotions/switch-nine-salary-transfer`
  (fresh scrape 6 Aug 2026 — page still live and still showing the
  ended campaign)
- T&C PDF: `https://www.adcb.com/switch10` →
  `/en/multimedia/tnc/switch10-tnc.pdf` (Ver.02/April2026, 7 pages,
  promo codes SW10ST / SW10TRB / SW10BTH)

Key excerpts:

> "Offer Period means: 1st January 2026 to 30th June 2026 (both days
> included)." · "…sign and submit the Form for this Offer A by 30th June
> 2026."

> Salary Transfer Reward table (paid as electronics vouchers):
> AED 5,000–<10,000 → 500 (UAE nationals) / 250 (expatriates);
> 10,000–<20,000 → 1,500 / 1,000; 20,000–<50,000 → 3,000 / 2,000;
> 50,000+ → 7,000 / 5,500.

> Bundling: "The Customer should spend AED 2,500 or equivalent… on an
> ADCB Credit Card within three (3) months after month of enrollment."
> The page's "up to AED 12,000" headline is Offer A (salary, max 7,000)
> plus Offer B (relationship balances, max 5,000) combined.

> Lock-in and clawback: salary must keep arriving "for a period of at
> least 12 months"; "Customer must agree to hold off AED 1 to be placed
> in their ADCB Account. Meeting the Salary Transfer or Relationship
> Balance criteria is mandatory for a minimum of 12 months; otherwise, a
> claw back of the (Dirham) value of the reward will apply." Clawback
> triggers include stopping salary within 12 months of the first
> transfer, missing a credit-card minimum payment, and closing the card
> or account within 12 months of enrolment.

> Payout mechanics: notification within 5 months of onboarding; rewards
> are third-party electronics vouchers valid 3 months from issue, redeem
> in person with Emirates ID, one invoice per voucher, not valid online.

> Exclusions: salary not transferred to ADCB after 1 Jan 2025;
> employer must be ADCB-listed; net salary < AED 5,000 ineligible; 2025
> campaign participants ineligible; ADCB staff ineligible.

**Editorial call**: campaign EXPIRED five weeks before this dossier —
the CBD pattern applies (a bank with no live offer is a finding to
record, not a gap to fill). The verified figures go into a
`salaryTransferOfferHistory` entry (`adcb-switch10-2026-h1`) so the
archive carries a real record where the old illustrative skeleton
(`adcb-2026-h1`, moved to history earlier) never did. Bands are typed at
the **expatriate** values with the UAE-national scale in requirements —
the site's primary reader is the expat switcher. The landing page stays
in the monitor registry; ADCB has run Switch 8, 9 and 10, so a cycle 11
is plausible and the monitor will see the page change.

— Head of Research (main session), 6 August 2026.
