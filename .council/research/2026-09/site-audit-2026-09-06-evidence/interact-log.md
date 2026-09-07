# Live interaction sessions (Firecrawl interact, 6–7 Sep 2026)
| Scenario | Status | File |
|---|---|---|
| search | completed | search.md |
| dark-mode | completed | dark-mode.md |
| salary-calculator | completed | salary-calculator.md |
| card-finder | completed (second attempt) | card-finder.md |
| compare | completed | compare.md |
| mobile-nav | timed out ×3 — covered by local Playwright menu probe | mobile-nav.md |
The tool reports no creditsUsed for interact sessions; session IDs are recorded in each file.


---

# interact: card-finder (live, 2026-09-07 ~07:56 UTC)
Tool: firecrawl_interact, url https://dubaipoints.ae/cards/finder/?spend=travel&prefer=miles (desktop). sessionId 01a07add-fb05-722a-939f-c0bcd31607b8, scrapeId 01a07add-f9f3-7161-b2fc-2cdc4824b9b8.
Result text: "6 of 57 cards match — ranked by best fit". First three: EMIRATES NBD DNATA PLATINUM CREDIT CARD, EMIRATES NBD ETIHAD GUEST VISA INSPIRE, EMIRATES NBD DNATA WORLD CREDIT CARD (then RAKBANK World, ENBD Etihad Guest Elevate, FAB Etihad Guest Infinite).
Observations: (a) the result set honours the URL parameters (travel/miles cards ranked) but the form controls do NOT reflect them — the accessibility tree shows "General / mixed" and "No preference" radios checked while results are filtered by travel + miles, so a reader landing from a shared URL sees controls that contradict the list; (b) card names are rendered in uppercase (text-transform) and the accessible names are therefore all-caps; (c) each tile's link reads "Read review " (trailing space, generic text repeated six times); (d) page states "Cards covered 57 · Last refreshed 22 August 2026 · Methodology Read →"; salary input placeholder "e.g. 15,000" is the only accessible name of the salary spinbutton; (e) "DubaiPoints earns no commission on these recommendations" disclosure sits below the results.


---

# interact: compare (live, 2026-09-07 ~07:52 UTC)
Tool: firecrawl_interact, url https://dubaipoints.ae/cards/compare/, desktop default viewport. scrapeId 01a07ada-2ca4-731e-88c8-26a46c92f2b4.

## Agent output
To select cards to compare on this page, a reader uses the following controls:

1. **Disclosure Toggle (Button):** Labeled `"Pick cards to compare Up to 4 cards · grouped by bank ▾"`, which expands the selection form.
2. **Checkboxes:** Labeled with individual credit card names (e.g., `"ADCB 365 Cashback Credit Card"`, `"Emirates NBD Marriott Bonvoy World Elite Mastercard"`, etc.) grouped under their respective bank names.
3. **Submit Button:** Labeled `"Update comparison"`, which applies the selected cards.
4. **Reset Link:** Labeled `"Reset to defaults"`, which resets the selection.

**Comparison Table Visibility:**
Yes, a side-by-side comparison is visible before any selection is made. By default, it displays the three highest welcome-bonus cards (structured as side-by-side articles rather than an HTML `<table>` element).


---

# interact: dark-mode (live, 2026-09-07 07:46 UTC)
Tool: firecrawl_interact, url https://dubaipoints.ae/, prompt: report html data-theme, click button[aria-label="Toggle dark mode"], report again. sessionId 01a07ad6-e194-741e-9e36-d7bc52416482, scrapeId 01a07ad6-e0f0-74fe-a5fb-f5b38863afe5.
Result: "Initial: light / After toggle: dark" — the toggle sets data-theme=dark on <html> (persistence across navigation not tested in this session; BaseLayout init script reads localStorage dp-theme).
Accessibility tree notes (homepage, desktop): h1 reads "Fly further. Payless." — the accessible name concatenates the two display lines without a space ("Payless"), so screen readers hear one word; regions are labelled (Tools, Live data desk, Latest analysis, Build your points strategy, Browse dubaipoints.ae, Why trust DubaiPoints, Newsletter); the strategy panel is a radio group (Travel & miles checked by default); homepage live desk still lists "RAKBANK up to AED 4,000 cash · 4 bands · from AED 5,000+ salary Verified 22 Aug 2026" as a live offer on 7 Sep; "Start here" tiles carry counts (57 CARDS, 15 BANKS, 6 PROGRAMMES, 3 LIVE, 21 GUIDES, LIVE TRACKER "6 live offers"); header link names are uppercase (JOIN BRIEF, SALARY OFFERS, CARD DEALS, LATEST NEWS).


---

# interact: mobile-nav (live, 2026-09-06/07)
Three firecrawl_interact attempts (mobile viewport, click label[aria-controls="dp-nav-overlay"], read #dp-nav-toggle state and overlay items) exceeded the MCP transport timeout (60 s on 6 Sep, 45 s on 7 Sep) before returning. No result recorded from the live site.
Substitute evidence: the local render probe's `menu` check (Playwright, 390 px) reports for the homepage `enterOpens: false, spaceOpens: false, escapeCloses: false` — the CSS-only hamburger (label for a hidden checkbox, Header.astro:126-131) does not respond to keyboard activation or Escape; the salary-calculator interact run also showed the nav's accordion checkboxes exposed as unlabeled form controls ("      ", "Cards ▾", "Points + Miles ▾", "Travel ▾"). See audit-output/render/routes/root.json → menu, focus.mobile.


---

# interact: salary-calculator (live, 2026-09-07 ~07:50 UTC)
Tool: firecrawl_interact, url https://dubaipoints.ae/salary-transfer/calculator/. sessionId 01a07ad9-3a72-750c-9369-d429ba02fe9e, scrapeId 01a07ad9-39ee-7419-aa70-93c112b025d7.

Controls and defaults (as reported): MONTHLY SALARY = 20000 (number input); MONTHLY CREDIT-CARD SPEND (AED) = 3000; "I will stay at least 12 months" checked; "Show Sharia-compliant offers only" unchecked; "Cash rewards only (no vouchers)" unchecked; product checkboxes Credit card (checked), Personal loan, Insurance, Savings product, Mortgage (unchecked). The page's form-control census also picked up four unlabeled checkboxes belonging to the header/mobile nav ("      ", "Cards ▾", "Points + Miles ▾", "Travel ▾") — the CSS-only accordion inputs are exposed as form controls (the nav toggle carries aria-hidden and tabindex=-1, the accordion inputs apparently do not).

With MONTHLY SALARY set to 12000 the ranked results read, verbatim: "#1First Abu Dhabi Bank — First Abu Dhabi Bank — 20% Salary Transfer Campaign 2026", "#2RAKBANK — RAKBANK — Salary Transfer Cash Reward (July–August 2026)", "#3Emirates Islamic — Emirates Islamic — Salary Transfer Cashback (June–September 2026)", then HSBC, Mashreq, DIB (#4–#6). Observations: (a) the production calculator still ranks the RAKBANK July–August offer second on 7 September — the offer lapsed 31 August (same 30 Aug build as the tracker); (b) each result heading repeats the bank name twice ("First Abu Dhabi Bank — First Abu Dhabi Bank — …") and the rank number is glued to the name in the accessible name ("#1First"); (c) an h2 "First Abu Dhabi Bank" sits above the h3 result list (heading structure worth a look); (d) cash-equivalent AED figures were not part of the returned heading text — the numbers live in the result body, not the heading.
Failed attempts: card-finder (two prompts) and mobile-nav (three prompts) exceeded the 45–60 s transport timeout of the MCP bridge; those flows are covered by the local Playwright probes instead.


---

# interact: search (live, 2026-09-07 07:45 UTC)
Tool: firecrawl_interact, url https://dubaipoints.ae/search/, prompt: type "skywards", wait 2 s, report count + first three titles. sessionId 01a07ad3-e7f0-76ca-9b3f-a4006729b01f, scrapeId 01a07ad3-e709-746e-a869-767edcc77b5e.

Result: "96 results for skywards". First three: (1) Emirates Skywards (programme page; sub-results "Skywards in 60 seconds", "What a Skywards Mile is worth", "Bottom line"); (2) "Skywards' summer redemption push runs to 30 September — and its DSS raffle offers 5 million Miles to 30 August" (DEAL UPDATE · 27 Jul 2026); (3) "Skywards business-class redemptions from Dubai: the 2026 playbook" (May 2026). Items 4–5: "ENBD Skywards Infinite — up to 100k miles welcome bonus (Q2 2026)" (BONUS · 25 Jul 2026), "Emirates Skywards opens 'Season of Rewards' … through August" (CHANGE · 22 May 2026). A "Load more results" button follows five results.

Observations from the accessibility tree: search page h1 "What are you looking for?"; input labelled "Search" with a "Clear" button; header exposes links "Search cards, guides", button "Toggle dark mode", "JOIN BRIEF", "SALARY OFFERS", "CARD DEALS", "LATEST NEWS" (uppercase accessible names — CSS text-transform is not applied to the accessible name here, so the names are literally uppercase in the DOM). Footer bank links read "<Bank> logo <Bank>" — the logo image alt duplicates the visible name (redundant announcement for screen readers). Pagefind sub-results show "4documented Sweet" — a missing space in the programme page's indexed text ("4 documented sweet spots").
Note: an earlier, longer mobile-nav prompt timed out at the 60 s MCP transport limit; short single-action prompts complete.
