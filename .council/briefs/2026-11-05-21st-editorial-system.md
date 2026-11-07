---
slug: 21st-editorial-system
vertical: travel-experiences
assigned-editor: travel-experiences-editor
tier: T3
draft-status: owner-preview
tech-status: preview-checked
chairman-status: pending
---

# 21st editorial system — implementation for owner preview

## Authority and release boundary

Mostafa directed “Do it all” after the 21st resource research and its
15-reference shortlist. This authorises the implementation and verification
of those useful patterns, adapted to the existing site. His earlier request
to see light/dark previews before making the design live remains the release
boundary. This brief does not approve a merge or production activation.

Baseline: `651fb0506cc03f5821e0d28659043c57eee76062` (PR #517), checked out
on `codex/21st-editorial-system`. Fresh baseline build: 322 post-prune HTML
routes, 22,428 resolved internal links. The known unrelated macOS Bash3 test
failure is not waived by this pass.

## Scope

- One consistent native button, link, icon-action, form and disclosure state
  vocabulary, retaining the existing house components and theme tokens.
- Grouped navigation and Pagefind search presentation; no second search
  engine, AI assistant or artificial suggestion data.
- One reading-contents system, real image-led hub composition and manual
  editorial rails. Existing anchors, archive access and chronology remain.
- Finder, Compare, card identity and Salary Tracker controls/hierarchy,
  preserving all figures, rankings, financial calculations and URL context.
- Reuse existing reading/progress and calculator WAAPI helpers. No generic
  decorative motion rollout or new runtime dependency.

The research report's “multi-band” wording is corrected by source inspection:
Tracker stores one selected band or null (all); independent cash/no-card/
Sharia filters can be combined. Preserve that behaviour rather than inventing
a multi-band feature. Native checkbox semantics apply to those independent
boolean filters, not a change to the band model.

## Protected scope

No homepage hero/reel change, no initial video load before scroll, no palette
or font replacement, no data/MDX/scraper/monitor changes, no new asset fetch or
generation, no copied uncleared code/media, no new paid provider calls,
credentials, newsletter, affiliate or analytics configuration.

## References and implementation posture

Origin UI Button/title, Command, Native Select, Tabs, Radio Group, Table and
Pagination; ReUI Navigation Menu; Hirael TOC; Oliver's grouped comparison
table; Ravi Katiyar's Offer Carousel; Editorial Collage Hero; Magic UI button
and Cnippet reveal ideas. The last two inform bounded feedback only; the
existing native motion helpers are preferred. No code from these resources
is copied or installed. Listing licence labels are not full source/media
clearance. In-house implementations reuse ordinary HTML/CSS patterns.

## Done when

1. The 15-reference adoption matrix names implemented/reused/withheld items
   honestly, with files and reasons rather than claiming every demo shipped.
2. Source data/formulas, routes, anchors, metadata and visible image credits
   remain intact; shared changes are mapped across all 19 route families.
3. Check, tests, build, scoped deterministic 21st review and browser states
   have actual results; no passing source scan substitutes for rendering.
4. Representative phone/landscape/tablet/laptop/wide light/dark, keyboard,
   native/no-JS, empty/error and reduced-motion states are checked, together
   with the existing full-route resize and homepage-reel guards.
5. Owner receives actual light/dark previews. Production remains unchanged
   until that preview/release boundary is satisfied.

## Preview outcome

Implementation and bounded preview QA completed on 2026-11-05. See
`.council/sessions/2026-11-05-21st-editorial-system-preview.md` for the
resource adoption matrix, full route-family mapping, actual test results
and remaining release checks. This is not a full Council approval or a
production release. Chairman status remains pending.
