# Main reconciliation and site audit — 6 August 2026

## Authority and scope

Chairman direction in this session: reconcile the work completed with Claude
Code, establish one current source state, audit the site, and assess the
installed Higgsfield app. Under the 6 August Charter amendment, that direction
is Stage 7 approval for this local scope. No push or deployment was requested.

## Reconciliation record

- Remote baseline fetched and inspected: `origin/main` at `0fb0426`, including
  the 6 August handoff and PRs #311–#322.
- The pre-existing local integrity sprint was preserved in commit `c65f197`
  and rebased onto that baseline as `cc2e1ab`.
- Two overlaps were adjudicated: the newer salary-transfer evidence was kept,
  and both Charter amendments were retained (organisational byline on 5 August;
  in-session Chairman approval on 6 August).
- The reconciled source state now records 5 banks with current salary-transfer
  offers, 5 checked without a current live banded offer, and 2 unresolved:
  Standard Chartered and Emirates Islamic.

## Audit findings closed in this session

1. **Build-time freshness was presented as continuous live state.** Homepage
   and deals copy now says current/recorded, shows exact expiry and verification
   dates, and tells readers to re-check the provider.
2. **Trust pages made unsupported personal claims.** `/about/` and `/team/`
   now use the Chairman-approved organisational byline without inventing a
   founder anecdote or undisclosed product history. Named contributors still
   require real-name profiles.
3. **Salary coverage conflated absence with incomplete research.** The tracker
   now names current offers, checked negative/expired findings, and unresolved
   banks separately.
4. **HSBC deal evidence was incomplete.** The deal now cites HSBC's full offer
   terms and records the salary range, two-credit requirement, balance route,
   app condition, payment timing and 180-day clawback boundary.
5. **Light/dark contrast failed on key CTAs and tracker status text.** The
   homepage CTA, dark-mode deals brief, tracker secondary text and expiry
   colours now meet the automated contrast check.
6. **Image dimensions were wrong in 110 of 112 manifest entries.** Pexels'
   original dimensions had been stored for smaller `large2x` downloads. The
   manifest now reflects the shipped bytes; the fetcher measures downloaded
   files and a regression test checks every entry against `sharp` metadata.
7. **New deal images caused a mobile performance regression.** The three valid
   new bank-deal photographs were resized to 960 px and recompressed. The
   unidentified red-tailed-aircraft photograph on the named Etihad sale was
   removed because it did not establish Etihad identity; the page uses the
   editorial fallback until a separately licensed Etihad image is available.
8. **Council records had drifted.** The source-of-truth documents now record
   fourteen agent roles, the current stack/palette/provenance contract, the
   reconciled release state and the 6 August Chairman direction.

## Verification evidence

- Runtime: Node 22.20.0.
- Tests: 308 passed, 0 failed.
- Astro check: 0 errors, 0 warnings, 0 hints across 107 files.
- Production build: 179 generated pages; internal routes pruned; 176 public
  HTML pages indexed by Pagefind.
- Internal-link validator: 29,598 links checked; 0 unresolved.
- Structured data: 288 JSON-LD scripts parsed; 0 parse errors.
- Dependency audit: live npm registry check, 0 vulnerabilities.
- Render probes: 360 px mobile and 1,280 px desktop had no horizontal page
  overflow and no broken images on the audited routes. Light and dark theme
  CTA colours were inspected from computed styles.
- Lighthouse mobile:

  | Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
  |---|---:|---:|---:|---:|---:|---:|---:|---:|
  | `/` | 100 | 100 | 100 | 100 | 0.9 s | 1.4 s | 0 ms | 0 |
  | `/deals/` | 100 | 100 | 100 | 100 | 0.9 s | 1.1 s | 0 ms | 0 |
  | `/salary-transfer/` | 100 | 100 | 100 | 100 | 0.9 s | 1.5 s | 0 ms | 0 |

## Higgsfield assessment

The app was tagged as installed, but no Higgsfield callable tool was exposed to
this Codex task. No generation was attempted. Higgsfield's current official
site describes image generation/editing/storyboarding, image-to-video, multiple
video models, reference inputs and camera/motion controls, and its terms cover
API, MCP and CLI access:

- <https://higgsfield.ai/ai-image>
- <https://higgsfield.ai/ai-video>
- <https://higgsfield.ai/claude-ai-video-generator>
- <https://higgsfield.ai/terms-of-use-agreement>

**Recommended DubaiPoints uses:** off-site 9:16, 1:1 and 16:9 social teasers;
abstract points-to-miles explainers; motion typography; generic rewards/travel
mood loops; and storyboards or pre-visualisation. Exact figures should be added
as deterministic overlays after generation, not rendered by the model.

**Do not use it as documentary evidence:** no generated bank/card/airline/hotel
product imagery, logos, provider documents, screenshots, real-person claims or
identifiable landmarks presented as fact. Do not make a hero video the default
site treatment; the static homepage is fast and the publication's trust model
favours evidence over spectacle.

Before any Higgsfield asset publishes, extend the provenance record beyond the
current image-only manifest to capture: model, full prompt, input source and
rights, generation ID/date, edit chain, output hash and a visible
`AI-generated video` label. Do not upload partner, issuer or personal media
unless the required rights and consents exist and the account's training terms
are acceptable. Higgsfield's 26 July 2026 terms say consumer inputs and outputs
may be used to improve models, while Enterprise Agreement content is treated
differently; the applicable account terms must be checked before use.

## Remaining gates and known unknowns

- Standard Chartered and Emirates Islamic salary-transfer searches remain
  unresolved.
- Buttondown remains deliberately unconfigured; the newsletter uses its honest
  email fallback.
- Four welcome bonuses remain unpriced and unranked; substantive
  `needs-review` card fields remain protected from guessing.
- Modcare's sites remain recorded as `noindex`; the PPF guide's first-hand
  recommendation basis is carried by its approved brief and was not separately
  re-verified in this code audit.
- Deployed production state, Cloudflare analytics and external monitor health
  were not claimed from a local build.
- No push or deployment was performed.
