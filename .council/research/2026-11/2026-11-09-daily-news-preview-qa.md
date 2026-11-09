# Daily news desk candidate — local QA

2026-11-09; base `cb6eb709037ef51f08e8f393a4791e6e15e2af7f`.
Review candidate only. No production release or new public articles.

## Scope and reproducible commands

Node 22.20.0, Playwright 1.56.1, local installed Chrome 156.0.8078.81,
axe 4.13.0. Built `dist/` served with the repository's `startStaticServer`.
External hosts blocked consistently; this is not real-user performance,
physical iPhone Safari, a production visit, or full-site certification.

`npm run check`: 219 files; zero errors/warnings, seven existing hints.
`npm run build`: 338 indexed pages, 23,764 internal links resolved; CSP
15 script hashes, 1,217-character header. Public article count unchanged.
Focused news/report/draft guards: 28 tests pass, zero failures/skips.
Local full suite: 1,151 pass, one failure, zero skips (1,152 total).
The inherited macOS Bash 3 failure is `save never deletes state files written
by another run`, `scripts/ci/automation-state.sh:92 parent_args[@]: unbound
variable`. This is NOT waived; final-head Linux validation remains required.

Render probe:

```
node scripts/audit/render-probe.mjs \
  --routes /,/news/,/news/banking/,/news/airlines/,/news/hotels/ \
  --viewports 390,440,1440 --themes light,dark --screens none \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --out <private-evidence>/render-probe-final --concurrency 2
```

Five routes completed, none skipped/errored. Zero measured overflow,
axe/contrast, image, link, focus, heading, console/page/request/HTTP,
reduced-motion and menu failures. Screening flagged 76 inherited small
targets/hidden-radio boxes; not all are false positives and no whole-site
accessibility compliance claim follows. The first pass flagged 86: peer
review isolated three new desk links and All guides below the 44px house
target. Root enlarged these plus the existing All news action to 44px;
source re-review and actual runtime geometry pass. Other controls are not
silently cleared or redesigned by this scoped work.

## Additional runtime and visual evidence

150 local cases passed in private `runtime.json`:

- Five routes at 320/390/440/768/1024/1440/1920 CSS pixels, JavaScript on/off,
  light/dark system preference. Real light/dark UI checked with JavaScript;
  no-JS cases check native content/controls, not a claim that the no-JS theme
  control works or overrides the system preference.
- Homepage has six unique publication-dated news routes and three separate
  explicitly updated guides, in date order. No guide refresh re-dates news.
- News indexes preserve unique complete story partitioning, three visible
  older text links with no preview images, initially closed native archive,
  lazy archive images, Enter/Space toggling and visible first archived story.
- No horizontal overflow or page errors at those widths. Changed standalone
  nav/actions measure at least 44px in both dimensions.
- Baseline/candidate first viewport PNGs at 390/1440, light/dark, are
  byte-identical under matched reduced-motion conditions. Hero markup,
  controller, media and loading logic are unchanged.
- Normal-motion 390/1440: no initial video src or MP4 request; programmatic
  scrolling alone does not attach media. Genuine wheel input then scrolling
  within the hero requests the appropriate video. The first QA attempt used
  programmatic scrolling and correctly did NOT load it; the test—not the
  protected controller—was corrected.

Root viewed the actual news-section desktop/mobile light/dark screenshots,
guide section and archive transition. Native typography, equal bounded image
slots, genuine issuer art/credits and honest existing explanatory diagrams
are retained; no clipping/overlap found in the changed content. Section-only
preview PNGs hide fixed header/skip/top controls ONLY in screenshot styling
to avoid tall-element screenshot overlays. Production source is unaffected;
the separate viewport/interaction checks retain normal chrome.

Private evidence: `/private/tmp/dubaipoints-daily-news-qa.qpk9FG/`:
`runtime.mjs`, `runtime.json`, `previews.mjs`, `render-probe-final/`,
`check.log`, `build.log`, `full-tests.log`, `focused-tests.log`, PNG previews.
These are local machine evidence, not public preview URLs or live-deploy proof.

## Preservation and boundaries

No changes to `src/content`, original three held quantitative drafts/briefs,
card/offer data, provenance/verification dates, manifests/art, hero/controller,
analytics/BaseLayout, fonts/global CSS, dependency lockfile, monitoring or
workflows. No paid source/media calls, extra feeds, worker activation,
newsletter restoration or publication. Daily scheduling awaits the owner's
separate choice. Article-specific COI/byline and full article gates remain
pending even where a source-bounded independent review passed.

Next: exact-head Linux CI, owner light/dark preview review and feature Chairman
release clearance. An advisory Council workflow warning is not approval.
