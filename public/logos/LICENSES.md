# Logo assets

This directory holds bank and airline-programme logos used by the site.

## Status

As of 2026-05-29, this directory holds a **mix**: 9 files are real brand
SVGs sourced per the replacement rule below (see the source log), and the
remaining 6 are **placeholder text-marks** authored by DubaiPoints — not
official brand marks — rendering the bank/programme name in a neutral
serif until a clean asset is sourced.

- **Real marks (9):** banks/fab, banks/adcb, banks/hsbc, banks/citi,
  banks/standard-chartered, airlines/qatar-privilege-club,
  airlines/etihad-guest, airlines/skywards, airlines/marriott-bonvoy.
- **Still placeholders (6):** banks/emirates-nbd (official asset is
  PNG-only — pending a format decision), banks/dib, banks/adib,
  banks/cbd, banks/emirates-islamic, banks/rakbank (no clean free source
  found). Each renders the name in serif and falls back gracefully.

## Replacement rule

Per the editorial style guide, real SVGs must be:

1. Sourced from EITHER (a) the issuer's published **brand kit / press
   page**, OR (b) **Wikimedia Commons** where the file is tagged
   **{{PD-textlogo}}** (below the threshold of originality, not
   copyrightable). Per the Charter §10 amendment (2026-05-29), Commons
   {{PD-textlogo}} marks are licensed for nominative editorial use — to
   identify a product the publication reviews, never to imply endorsement.
   Not screenshotted from the website. Not redrawn. No AI-generated marks.
2. **Unmodified.** Original aspect ratio preserved. No tinting or
   recolouring outside the bank's own hub page on this site.
3. Filed under the slug used in `src/content/banks/` or
   `src/content/programs/`, e.g. `banks/emirates-nbd.svg`.
4. Rendered **nominatively** — adjacent to the brand name (e.g.
   `<BankLogo>` beside the name). A mark standing alone in a hero needs a
   visible credit line. Takedown requests honoured within 24 hours.

When you replace a file, log the source URL and the date pulled in
this document.

## Source log

| Slug | Source URL | Pulled | Notes |
|---|---|---|---|
| banks/emirates-nbd | https://www.emiratesnbd.com/en/brand-assets | 2026-05-29 | Issuer brand kit (emiratesnbd.com/en/brand-assets); trademark of Emirates NBD Bank PJSC, used nominatively per Charter §10 — official primary logo (blue, horizontal) — only freely-available format is PNG |
| banks/fab | https://commons.wikimedia.org/wiki/File:First_Abu_Dhabi_Bank_Logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of First Abu Dhabi Bank, used nominatively |
| banks/adcb | https://commons.wikimedia.org/wiki/File:Abu_Dhabi_Commercial_Bank_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Abu Dhabi Commercial Bank, used nominatively |
| banks/emirates-islamic | placeholder | 2026-05-06 | Replace with Emirates Islamic brand-kit SVG |
| banks/rakbank | placeholder | 2026-05-06 | Replace with RAKBANK brand-kit SVG |
| banks/mashreq | placeholder | 2026-05-26 | Replace with Mashreq brand-kit SVG |
| banks/dib | placeholder | 2026-05-26 | Replace with Dubai Islamic Bank brand-kit SVG |
| banks/adib | placeholder | 2026-05-26 | Replace with ADIB brand-kit SVG |
| banks/cbd | placeholder | 2026-05-26 | Replace with Commercial Bank of Dubai brand-kit SVG |
| banks/hsbc | https://commons.wikimedia.org/wiki/File:HSBC_logo_(2018).svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of HSBC Holdings, used nominatively |
| banks/citi | https://commons.wikimedia.org/wiki/File:Citi.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Citigroup, used nominatively |
| banks/standard-chartered | https://commons.wikimedia.org/wiki/File:Standard_Chartered_(2021).svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Standard Chartered PLC, used nominatively |
| airlines/skywards | https://commons.wikimedia.org/wiki/File:Emirates_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Emirates, used nominatively — parent-airline mark for the Emirates Skywards programme |
| airlines/etihad-guest | https://commons.wikimedia.org/wiki/File:Etihad-airways-logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Etihad Airways, used nominatively — parent-airline mark for the Etihad Guest programme |
| airlines/marriott-bonvoy | https://commons.wikimedia.org/wiki/File:Marriott_Logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Marriott International, used nominatively — parent-brand mark for the Marriott Bonvoy programme |
| airlines/qatar-privilege-club | https://commons.wikimedia.org/wiki/File:Qatar_Airways_logo.svg | 2026-05-29 | Wikimedia Commons — {{PD-textlogo}} (below threshold of originality); trademark of Qatar Airways, used nominatively — parent-airline mark for the Privilege Club programme |
