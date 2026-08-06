---
status: resolved
tier: T2
raised-by: salary-transfer monitor provisioning (verify run 30988856840, 5 August 2026)
owner: business-realestate-editor
chairman-status: pending
resolved: 2026-08-06
---

# Brief — DIB cites one salary-transfer T&C document while a second live document carries different terms

**Date:** 2026-08-05
**Tier:** T2 (published figures may cite a superseded source; no schema
change proposed)

## The finding

Building the salary-transfer monitor surfaced a second DIB
salary-transfer terms document. Both are live and both carry
salary-transfer terms, but they do not agree.

| Document | Where it appears | What verification found |
|---|---|---|
| `dib.ae/docs/default-source/pdf/**dib-xtra-tc**.pdf` | `sourceUrl` of the published `src/content/salaryTransferOffers/dib-xtra-2026.mdx` | Bands published in L3 start at **AED 5,000** (AED 250 reward), rising to AED 50,000+ (AED 3,000) |
| `dib.ae/docs/default-source/pdf/**9684-salary-transfer-tc**.pdf` | Proposed by discovery run 30982700538; verified by run 30988856840 | **SUPPORTED** — deterministic parse found AED 8,000 and a **minimum salary of AED 8,000** |

The published entry's lowest band starts at AED 5,000. The second
document's parsed minimum salary is AED 8,000. A reader on AED 6,000
would qualify under one and not the other.

## Why this needs a human

Three readings fit the evidence, and the deterministic signals cannot
separate them:

1. **DIB runs two products** — the XTRA bundle (which our entry
   describes, and which requires a covered card or finance facility) and
   a separate standalone salary-transfer offer. Both entries would then
   be correct and we are simply missing one.
2. **`9684` supersedes `dib-xtra-tc`** — in which case the published
   entry cites an out-of-date source and its bands may be wrong.
3. **`9684` is narrower** — e.g. a specific channel or segment — and the
   published entry remains the right one to feature.

Per Charter §6 the bands cannot be resolved by LLM extraction from
either PDF. Someone has to read both documents and decide.

## What has already been done

- The monitor **watches `9684`** (admitted on SUPPORTED evidence), so if
  that document changes we will hear about it.
- The published `dib-xtra-2026.mdx` entry is **unchanged**. No figure has
  been altered on the strength of this finding.
- `scripts/monitor/salary-transfer.registry.json` records the conflict in
  the DIB `_evidence` field so it cannot be lost.

## What is being asked

1. Read both PDFs and establish which describes the offer we feature.
2. If `dib-xtra-tc` is superseded: rebuild `salaryBands[]`,
   `requirements[]` and `clawbackTerms` from `9684`, update `sourceUrl`,
   refresh `lastVerified`, and set `_provenance` accordingly.
3. If DIB runs both: file the second as its own entry — that would be a
   genuine coverage gain, taking the tracker from 2 banks to 3 on real
   content rather than on monitoring URLs.
4. If `9684` is narrower or stale: record that here and leave the entry
   alone, so the next person does not re-open this.

## Not urgent, but not indefinite

`dib-xtra-2026.mdx` carries `lastVerified: 2026-06-30`, so it crosses the
90-day drift threshold around **28 September 2026**, at which point the
tracker's amber flag starts rendering on it regardless of this brief.

## One-line summary

**Two live DIB salary-transfer T&C documents disagree on minimum salary
(AED 5,000 vs AED 8,000). Our published entry cites one; the monitor
watches the other. A human must read both and decide which describes the
product we feature.**

## Resolution — 6 August 2026

Both PDFs fetched fresh and read in full. The answer is reading 3
(stale), with a date-stamped proof the deterministic parse could not see:

| Document | Its own campaign dates | Verdict |
|---|---|---|
| `9684-salary-transfer-tc.pdf` | Start **10 July 2024**, end **7 September 2024** (clause 1(a)-(b)) | **Expired campaign, still hosted.** Min AED 8,000, expat bands 350/500/1,000, plus a one-month-salary prize draw. Not a competing current offer. |
| `dib-xtra-tc.pdf` | Start **1 January 2026** (clause 1(a); no hard end date) | **Current campaign.** Min AED 5,000, bundle-gated, expat bands 250/500/1,000/2,500/3,000 — matches the published entry verbatim on re-check. |

Both documents title themselves "DIB XTRA Salary Transfer Account"
campaign T&Cs — same product line, successive campaign cycles. DIB
leaves dead cycles hosted (the 2018 raffle leaflet re-verified the day
before is a third example), which is the whole mechanism of this
conflict. Historical note: DIB's minimum was AED 8,000 from at least
2018 through 2024; the 2026 cycle dropped it to 5,000.

Actions taken per item 4 (and a correction to the watch):
- `dib-xtra-2026.mdx` re-verified band-by-band against the current T&C —
  no figure changed; `lastVerified` → 2026-08-06 (clears the
  28 September amber deadline); resolution noted in the entry.
- The monitor was watching the stale document and not the current one —
  backwards. Swapped: `dib-xtra-tc.pdf` now watched in `banks`; `9684`
  parked in `_pending` as an expired campaign.
- Lesson for the verify tooling, recorded in the registry: SUPPORTED
  confirms a document is a real salary-transfer T&C, not that its
  campaign is alive. Campaign dates need a human read.
