# Source archive — ADCB card offers (read 20 Oct 2026): nothing usable

Result: **no deal filed.** Every ADCB campaign page we read had already
ended.

- Registry index https://www.adcb.com/en/personal/promotions/deals-and-discounts:
  the free reader (run 39438534959) got a Cloudflare block ("Sorry, you have
  been blocked … You are unable to access adcb.com", HTTP 403). Firecrawl
  scrape: the page is an app explainer ("Saving on your lifestyle spends is
  easy with Deals & Discounts on the ADCB Mobile Banking app"); it lists no
  offers on the web.
- Firecrawl `map` of /en/personal/promotions/ (search "promotions") listed
  ~40 campaign pages. Three were scraped:
  - /adcb-and-talabat-partnership: "Discount valid during Saturday & Sunday
    from 25th April 2026 to 07 June 2026" — **expired**.
  - /noon: "Offer is valid from 15 September 2023 to 29 February 2024" —
    **expired**.
  - /makemytrip: "This is a limited period offer valid from 1st Aug to 31st
    Aug 2025" — **expired**.

ADCB keeps dead campaign URLs live and its current merchant offers inside the
mobile app. A future pass needs either the app catalogue or a fresh map that
dates each page before scraping it.
