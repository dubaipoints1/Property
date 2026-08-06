---
slug: session-handoff-2026-08-05
type: session handoff
date: 2026-08-05
status: current
supersedes: nothing — first handoff of this kind
---

# Session handoff — 5 August 2026

Written so the next Claude Code session (or human) does not re-derive what
this one learned. Read `CLAUDE.md` first; this is the delta on top of it.

---

## 1. What shipped

### PR #309 — car-costs guide, motoring taxonomy, FAB entry
Merged earlier the same day. Established motoring as a **bounded category,
not a beat** (`.council/04_content_taxonomy.md`), and shipped
`guides/expat-starter-car-costs`.

### PR #310 — registry promotion + guide imagery + two §10 amendments
Merged as `2326b0e`. Two independent workstreams on one branch.

**Salary-transfer monitoring registry.** Four candidates promoted from
verify run `31003513821`. Monitor now watches **11 URLs across 6 banks**
(was 7 across 4): `fab`, `enbd`, `mashreq`, `dib`, `adcb`,
`emirates-islamic`.

**Car-costs guide imagery.** Aerial Dubai interchange hero, Modcare logo
and recommendation card, PPF coverage tiers as a table.

**Two Charter amendments**, both Chairman-approved 5 August:
- §10 gains a **non-issuer mark** lane (`public/logos/partners/`).
- §10 gains a **recommendation clause** — a piece may recommend a named
  business, but the disclosure must state the *basis*.

---

## 2. Open items

| Item | Detail |
|---|---|
| **FAB tracker entry** | `src/content/salaryTransferOffers/fab-20-percent-2026.mdx` is a **draft on `main`** awaiting Fact-Checker Stage 6. The band-modelling question is deliberately undecided — see the `{/* VERIFICATION NOTE */}` block at the foot of the file. |
| **cbd, citi, hsbc** | No salary-transfer candidate from any discovery run, including after the 5 Aug pattern fix. Their gap is *not* segment anchoring. Needs a hand search, not another regex. |
| **Two transient failures** | Mashreq Gold T&C (HTTP 502) and DIB leaflet (HTTP 408). Server errors, not dead pages. Both sit in `_pending` in the registry. Re-verify. |
| **PRs #300 / #302** | Scrape refreshes, unmerged. Their own bodies say never auto-merge. Deliberately untouched. |
| **Modcare `noindex`** | **Both** `modcare.ae` and `modcareppf.com` serve `robots: noindex`. No link from us can help them rank until lifted. Owner's conversation, not a code change. |
| **Reader-facing tracker coverage** | Still **3 of 12 banks**. The registry work was monitoring only. Writing entries is editorial work nobody has done. |

---

## 3. Operational facts worth not re-deriving

### Network allowlist — what actually fails from a web session

Confirmed by direct test on 5 August, on top of the list already in
`CLAUDE.md`:

| Host | Result | Consequence |
|---|---|---|
| `modcare.ae` | **403** CONNECT tunnel failed | Any third-party image host is likely blocked. Fetch via Actions. |
| `api.pexels.com` | 000 | `npm run fetch:stock` only works in Actions. |
| `fal.run` | 000 | `npm run gen:ai` only works in Actions. |
| `*.dubaipoints.pages.dev` | 403 | **Cannot read the PR preview deploy.** Verify against local `dist/`. |

GitHub Actions runners use different egress and are unaffected. Firecrawl
(MCP) uses its *own* egress, so it can read pages the session cannot —
useful for locating an asset URL even when you cannot download it.

### Rendering a page to check it — this is the important one

Playwright and Chromium are pre-installed but **not** in `node_modules`:

```
playwright:  /opt/node22/lib/node_modules/playwright/index.mjs   (global)
chromium:    /opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

`/opt/pw-browsers/chromium/chrome-linux/chrome` does **not** exist — use
the versioned path. Serve the build with
`npx http-server dist -p 8099 -s` and navigate to it.

**Three defects this session passed `astro check`, all 277 tests, and
`npm run build` while the page was visibly broken.** Rendering it is the
only thing that caught them. Treat a browser check as standard for
anything visual.

### Image and logo workflows

- `refetch-image.yml` — parameterised (branch, slug, query, alt,
  orientation, pick). **Works for NEW slugs too**, despite its old
  comment: `fetch-stock.ts:248` guards `if (existing && !args.replace)`,
  so with `--replace` an unknown slug falls through to the normal append
  path. Do not hand-write another `seed-images-eNN.yml`.
- `fetch-partner-logo.yml` — new. **Non-issuer marks only.** Sniffs real
  MIME before committing, because a WordPress uploads path will serve an
  HTML 404 body under a 200 status.
- A `workflow_dispatch` workflow can only be dispatched once it exists on
  the **default branch**; before that, dispatch returns a bare 404. Every
  `seed-images-eNN.yml` carries a `push:` trigger on `claude/**` for
  exactly this reason. Follow that pattern for a new one.

---

## 4. Gotchas discovered the hard way

**MDX will wrap bare text in a `<p>` you did not write.** An HTML block
split across lines gets its text re-parsed as markdown, producing invalid
nested `<p class="…"><p>…</p></p>`. The browser auto-closes the outer tag,
children land in an unclassed inner element, and your CSS silently stops
matching. Keep such elements on one line. Nothing in the toolchain warns.

**`naturalWidth === 0` on a lazy-loaded image is not a broken asset.**
Measuring immediately after `scrollIntoViewIfNeeded()` reports 0 because
the fetch has not finished. Wait before asserting. This produced a false
"the logo is not loading" report.

**Declare `width`/`height` matching the asset's real ratio.** A square
icon mark declared at a wordmark's ratio reserves the wrong box and shifts
layout when it paints.

**`.council/sops/ai-illustration-art-direction.md` briefs GENERATION, not
selection.** Its "muted, never saturated" palette rule is for AI prompts.
It is **not** a filter for licensed stock, and the shipped library is not
muted — `guide-expat-starter-banking-basics` is neon-lit DIFC towers at
night. A good Pexels photograph was wrongly flagged as an off-register
deviation on the strength of that rule. The SOP now carries a scope note
saying so.

**`git ls-remote` in an until-loop is the reliable way to wait for a
workflow's commit.** Foreground `sleep` is blocked; use
`run_in_background`.

---

## 5. Judgement calls a reviewer should know about

**Council stages were signed off in-session, not by sub-agents.** PR #310
records Stage 5.5 / 6 / 6.5 as passing. Those checks were carried out in
the main session rather than by convening `head-of-ux`, `fact-checker` and
`standards-editor`. The substance was checked — disclosure basis traced to
the brief's COI section, technical claims traced to `modcare.ae`, no
unsourced figure, no prices — but it was one pass, not four independent
ones. Stated in the PR body too.

**A recorded departure from a Council deliverable.**
`.council/sessions/2026-08-05-motoring-taxonomy-seo.md` §3c set a minimum
of **one link, `rel="nofollow ugc"`** on the Modcare block. The guide
ships **two follow links**, on Chairman direction. Recorded as a decision,
not an oversight. Its practical effect is currently nil because both
Modcare domains are `noindex`.

**The advertorial line moved three times in one day**, each on explicit
owner direction: contact block cut to citation links (morning) → logo
admitted (afternoon) → "worked example" reframed to "recommended"
(evening). Each step was flagged before it was taken. The guardrail that
held throughout is that a recommendation must state its basis; that is now
written into §10 rather than left to habit.

**Errors made and corrected in this session**, listed so the corrections
are not silently reversed later:
- Claimed the Modcare logo was not loading. It was — the measurement was
  premature.
- Flagged a hero image as off-register for saturation, misapplying an
  AI-only rule to licensed stock. Withdrawn; the real defect was that the
  photograph was of a *vintage* car on a guide about modern running costs.
- Diagnosed the FAB/ADCB discovery misses as a `/promotions/` path issue.
  The real cause was **segment anchoring** — the patterns required
  `salary` to *start* a path segment while both slugs carry it as a
  suffix.
- Predicted Emirates Islamic's 6k/16k T&C documents would be the strongest
  candidates. Both returned WEAK; the MBRHE package, which had been
  dismissed as too narrow, is the one that verified.

---

## 6. If you are picking this up cold

1. `CLAUDE.md` — Charter and engineering manual, including the two new
   §10 amendments at the top of `## Amendments`.
2. `.council/briefs/2026-08-05-uae-car-running-costs-guide.md` — the
   originating brief, including the COI declaration that the recommendation
   rests on.
3. `.council/sessions/2026-08-05-motoring-taxonomy-*.md` — the four
   specialist views and the synthesis.
4. This file.
