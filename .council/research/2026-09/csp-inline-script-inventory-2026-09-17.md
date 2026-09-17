# Inline-script inventory — the gate on a Content-Security-Policy

**Date:** 17 September 2026
**Owner:** Technical Lead
**Status:** inventory complete; the CSP decision itself is the Chairman's (T3)

Chairman ruling R7 (15 September 2026) shipped the four static headers and a
short HSTS, and held a Content-Security-Policy back as "its own item once the
inline-script inventory (theme toggle, nav script) is known". This is that
inventory, measured against the built `dist/` — not the source tree, because
what CSP sees is the rendered HTML.

The headline is that the ruling's own framing understated the problem. The
theme toggle and nav script are trivial. The obstacle is somewhere else
entirely, and it is large.

---

## 1. Inline `<script>` blocks — smaller than it looks

186 distinct inline `<script>` elements across 1,536 occurrences. Only
**11 are executable JavaScript**:

| Occurrences | SHA-256 (base64) | What it is |
|---:|---|---|
| 446 | `dkPGrVx42crwPkGY5LexhgIJhNPqnXIg9ID5U6xGyIM=` | component bind-once guard |
| 223 | `6IRua+S3PJBI40goqf7KZwFkaUOgqf0e6k1C9UjYPeU=` | theme toggle (reads `dp-theme`) |
| 223 | `RSPjZnyuNpDQ843UHQPig8FMulPkv6k80HTBlJQCFmM=` | keyboard handling for the CSS-only menu |
| 223 | `yEtmfZTsBNZZsHWx+29/nIvEsfls5eO5pf0KZBw2H/0=` | back-to-top button |
| 10 | `Ya0pUYrC7nM5Cn/056TyVuEiz6dFGrzmkWzgON0pF0U=` | Astro island runtime |
| 9 | `QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c=` | Astro `load` directive runtime |
| 1 | `S7XmSBIcV/NId1B3Iec1b6A2ao282i+y0IaTBVc9AFE=` | salary-transfer coverage note |
| 1 | `SncyOmZwT7Cteo8Ly/lE6vG2e0rblINVrk2MKub5ap0=` | Pagefind search init |
| 1 | `TxRdPfjyj8BEUofmJbep99KdEkhMf2hDDWHSL5lt3bs=` | card-finder client ranker |
| 1 | `dw5E65MXf8kRqMA2pj9QPQo9fPpTuZKeWKUbp6URNFI=` | card-compare bootstrap |
| 1 | `Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q=` | Astro visible-directive runtime |

The other **175 are `application/ld+json` or `application/json`** — our
schema.org blocks and the card-finder's data payloads. Browsers do not execute
them and `script-src` does not apply, so they need no hash. An earlier
count in this session said "13 distinct inline scripts"; that conflated the
data blocks with the executable ones and is corrected here.

Eleven hashes is a perfectly manageable `script-src`. Three of them are Astro's
own island runtimes, so the list changes on any Astro upgrade or island edit —
which means the hashes must be **generated at build time**, never hand-maintained.

## 2. The actual blocker: 3,625 inline event-handler attributes

| Occurrences | Attribute | Source |
|---:|---|---|
| 3,402 | `onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'"` | `BankLogo.astro:60`, `ProgrammeLogo.astro:33` |
| 223 | `onload="this.setAttribute('media','all')"` | `BaseLayout.astro:133` |

**An inline event-handler attribute cannot be allowed by a hash or a nonce.**
There is no mechanism for it. Any `script-src` that omits `'unsafe-inline'`
disables all 3,625 of them, and `'unsafe-inline'` defeats the point of having
the policy at all.

What breaks if they stop firing:

- **The logo fallback (3,402).** `BankLogo` and `ProgrammeLogo` render an
  `<img>` with a text placeholder hidden behind it; the `onerror` swaps them
  when a mark is missing. Six issuers ship as text placeholders on purpose
  (ADIB, DIB, CBD, Emirates Islamic, RAKBANK, Emirates NBD — 2026-05-29
  amendment). Kill the handler and those become broken-image icons on every
  bank hub, card review and directory tile. This is a visible, site-wide
  regression, not a subtle one.
- **The stylesheet preload (223).** `media="print"` + `onload` flips the sheet
  to `all` once fetched. Without it the stylesheet never applies and pages
  render unstyled. A `<noscript>` fallback would be needed.

## 3. What this means for the ruling

A strict CSP is **not** a header-file change. It requires, in order:

1. Move both handlers out of attributes and into one of the hashed scripts —
   a delegated `error` listener for the logos (capture phase; `error` does not
   bubble), and the stylesheet flip folded into the existing head script.
2. Generate the `script-src` hash list at build time from `dist/`, so an Astro
   upgrade cannot silently break the policy.
3. Ship `Content-Security-Policy-Report-Only` first, with a report endpoint,
   and read real violations before enforcing.

That is a T3 change touching two shared components, the base layout and the
build. It is worth doing — but it is a piece of work, not a follow-up, and R7
was right to separate it.

**Recommendation:** open it as its own brief rather than folding it into the
audit remediation. Until it lands, `audit:static` correctly lists CSP as the
one missing recommended header, and that is an honest state rather than a gap.

## 4. Method

```
npm run build
# count executable vs data blocks, hash each, count handler attributes
```

Measured against `dist/` at commit on `main`, 17 September 2026. Figures are
reproducible by rebuilding; the three Astro-runtime hashes will differ after
any Astro version change, which is the point made in §1.
