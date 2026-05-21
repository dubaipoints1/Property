# Session handoff — 2026-05-21, end of day

_Written at the close of a long working session before container
recycle. Read this first if you're picking up the
`claude/check-firecrawl-status-QqRQp` branch._

## Where the work stopped

The session opened as a Firecrawl-status check after the user
subscribed to the Hobby plan. It expanded into a multi-phase
visual + structural rebuild of the card-review pages. Last
committed work on the branch:

1. **Charter amendment 2026-05-21** — `.council/01_editorial_standards.md`
   §10 rewritten to recognise public issuer press libraries as
   licensed for editorial use under standard editorial-publication
   interpretation, with credit-line + LIBRARY.md + 24-hour takedown
   guarantees. Logged in `CLAUDE.md` Amendments section.
2. **LIBRARY.md flipped** — five issuer-press-kit rows
   (`emirates-a380-dxb`, `emirates-cabin-business`, `etihad-787-cabin`,
   `flydubai-boeing-738`, `marriott-hotel-exterior`) moved from
   PROVISIONAL / pending-permission-email to CLEAR (binary pending).
   Source URLs, credit-line strings, and date-sourced (2026-05-21)
   recorded per row.
3. **Skywards Infinite MDX** credit strings updated from "Unsplash CC0
   / placeholder pending Emirates Media Kit clearance" to "Image
   courtesy of Emirates Media Centre" on both `heroImage.credit` and
   the `<SectionBreak />` prop.
4. **Prose typography overhaul** — `src/styles/global.css` `.dp-prose`
   block:
   - body 18px (was 16px), color `var(--ink)` (was `var(--ink-soft)`),
     mobile 17px
   - H2 Fraunces 700 at clamp(26px, 4vw, 34px), navy `var(--green)`,
     letter-spacing -0.6px (was 500 weight, 20-26px clamp, full ink)
   - H3 20px / 600 (was 18px / 500)
   - paragraph margin-bottom 22px / 18px mobile (was 18px / 16px)

   Driven by user feedback comparing our Skywards Infinite page to
   Upgraded Points (`upgradedpoints.com/.../how-to-redeem-emirates-
   skywards-miles/`) and OMAAT homepage. User's verbatim: "our font is
   not looks like a word document article" — typography needed to read
   like a publication, not a Word export.

## The one outstanding operational task

**Swap four placeholder JPGs for real licensed binaries.** All four
filenames are already referenced from live MDX (Skywards Infinite
hero + section break; Skywards Signature hero + section break), and
LIBRARY.md already records them as CLEAR per the amendment — only
the on-disk JPEG is still a 9–11 KB placeholder.

| Target filename | Source URL | License |
|---|---|---|
| `src/assets/cards/library/emirates-a380-dxb.jpg` | https://content.presspage.com/uploads/2431/69849f10-93f2-4cb4-8bc6-e313c3e4c2ed/1920_039a0171.jpg | Emirates Media Centre — editorial-publication interpretation |
| `src/assets/cards/library/emirates-cabin-business.jpg` | https://content.presspage.com/uploads/2431/bb36ac73-fde9-4318-82c9-e491a0c68749/1920_shot-14-00771-2.2-v12-ar.jpg | Emirates Media Centre — editorial-publication interpretation |
| `src/assets/cards/library/dxb-airport-concourse.jpg` | https://images.unsplash.com/photo-1459787884955-4ce8aa1ca026?fm=jpg&q=85&w=2400&auto=format&fit=crop | Unsplash CC0 (photo `N7Lc26EuUx0`) |
| `src/assets/cards/library/dubai-skyline-burj.jpg` | https://images.unsplash.com/photo-1688671525781-d9447cf1abd2?fm=jpg&q=85&w=2400&auto=format&fit=crop | Unsplash CC0 (photo `zHtsvFqXPFE`) |

### Why this didn't happen in-session

The container's network policy blocked image-CDN egress. Only
github.com hosts were allowlisted. Diagnosis was unambiguous:

```
$ curl -v 'https://content.presspage.com/...'
< HTTP/2 403
< x-deny-reason: host_not_allowed
< content-length: 21
```

Firecrawl was the fallback hope but it explicitly rejects image
URLs: _"The URL returned a file type that Firecrawl cannot process:
image/jpeg. Binary files like images... are not supported."_

### Network policy state at session close

**Correction logged 2026-05-21 (second session):** the original handoff
told the user to add domains under `claude.ai → Settings → Capabilities
→ Additional allowed domains`. That setting governs WebFetch in the
claude.ai web chat product, **not** the Claude Code on the Web
container egress. Adding domains there does nothing for `curl` /
Firecrawl / image downloads inside this container.

User did add the following to Capabilities anyway (preserved for
record):

- `*.unsplash.com`
- `*.emirates.com`
- `*.etihad.com`
- `*.flydubai.com`
- `*.marriot.com` ← **typo, should be `*.marriott.com`** (two t's).
- `*.presspage.com`

A second session confirmed those wildcards have zero effect on
container egress: `curl https://content.presspage.com/...` still
returns `HTTP/2 403 / x-deny-reason: host_not_allowed / Host not in
allowlist`. The Anthropic egress proxy presents a valid `*.presspage.com`
cert (TLS handshake succeeds) and then refuses at the application layer.

**The real setting** is the **environment's network policy**, chosen
when the environment was created — see
https://code.claude.com/docs/en/claude-code-on-the-web (Environment
configuration section). Policy is bound at container start and cannot
be changed mid-session.

To unblock the image swap, the user needs to:

1. Open Claude Code on the Web (`code.claude.com` or the Claude Code
   surface in claude.ai — wherever they launch sessions from).
2. Open **Environments** (NOT Capabilities). Sometimes labelled
   "Cloud environments" or "Remote environments".
3. Find the environment attached to `dubaipoints1/property` (current
   policy: GitHub-only — only `*.github.com` and package-manager
   hosts reachable).
4. Edit the environment's **Network policy**. Switch to a policy that
   permits a custom allowlist (e.g. "Standard" / "Extended" /
   "Custom"), then add at minimum:
   - `content.presspage.com` (or `*.presspage.com`)
   - `images.unsplash.com` (or `*.unsplash.com`)
5. Save and start a **fresh session** — the new policy binds at
   container start.

### First thing the next session should do

```bash
curl -si --max-time 10 \
  'https://content.presspage.com/uploads/2431/69849f10-93f2-4cb4-8bc6-e313c3e4c2ed/1920_039a0171.jpg' \
  | head -5
```

Expected: `HTTP/2 200`. If still `HTTP/2 403 / x-deny-reason:
host_not_allowed`, the environment's network policy was not updated
correctly — **do not** waste turns trying to work around it in the
container; tell the user to recheck the Environment settings (NOT
Capabilities) per the steps above.

If 200, the swap is straightforward:

```bash
cd /home/user/Property/src/assets/cards/library
curl -sSL -o emirates-a380-dxb.jpg \
  'https://content.presspage.com/uploads/2431/69849f10-93f2-4cb4-8bc6-e313c3e4c2ed/1920_039a0171.jpg'
curl -sSL -o emirates-cabin-business.jpg \
  'https://content.presspage.com/uploads/2431/bb36ac73-fde9-4318-82c9-e491a0c68749/1920_shot-14-00771-2.2-v12-ar.jpg'
curl -sSL -o dxb-airport-concourse.jpg \
  'https://images.unsplash.com/photo-1459787884955-4ce8aa1ca026?fm=jpg&q=85&w=2400&auto=format&fit=crop'
curl -sSL -o dubai-skyline-burj.jpg \
  'https://images.unsplash.com/photo-1688671525781-d9447cf1abd2?fm=jpg&q=85&w=2400&auto=format&fit=crop'
file *.jpg | head -4   # confirm JPEGs (not 21-byte error responses)
```

Then update LIBRARY.md: flip the four affected rows from
`CLEAR (binary pending)` to `CLEAR`, and remove the "(binary
pending)" paragraph in the Status section. Run `npm run check`
and `npm run build`; the Astro `<Image>` optimiser should produce
responsive sets without complaint. Commit + push.

## What the user is feeling at session close

The user is frustrated that the Council has been making editorial
corrections without ever doing the foundational competitor research
that should inform UX and structure. Verbatim:

> "right now we have no say influence or anything we haven't even
> finalised the structure of the site because of the ux design and
> everyone on the team not working more diligently and research in
> terms of competitor websites to get ideas and inspiration is non
> existent. I have to keep tell you guys."

Concrete references the user has cited repeatedly:
- **thepointsguy.com** (TPG) — for clean text / font / spacing / image
  rhythm.
- **onemileatatime.com** (OMAAT) — homepage style; user asked Head of
  UX to "study analyse it" (delivered partial; needs a full proper
  teardown).
- **upgradedpoints.com** — for body type, navy H2 hierarchy, Jump-to-
  Section sticky nav, Hot Tip callout boxes, Key Takeaways boxes.
- **nerdwallet.com** — for card-finder UX.
- **headforpoints.com** (HfP) — voice / tone reference (already baked
  into the Charter).

**The next thing after the image swap should be a proper competitor
teardown.** Head of Research dossier: 8–12 pages each on TPG, OMAAT,
Upgraded Points, HfP. Specifically: homepage architecture, card-
review template, callout patterns (Hot Tip / Key Takeaways / Pull
Quote / Inline Comparison), affiliate disclosure placement, sticky
chrome (Jump-to-Section / progress bar / share button), image rhythm
(every N paragraphs), and footer architecture. The deliverable lands
at `.council/research/2026-05/competitor-teardown.md` and informs
every subsequent UX brief.

## Strategic context worth remembering

User raised airline / bank partnership strategy ("regionally with the
UAE to start with to reach out to these airlines or banks to have
them partner with my website"). My read: pitch from strength, not
hope — the right time to email Emirates / Etihad / FAB / ENBD
partnership teams is *after* 30–50 published reviews + measurable
traffic. Currently we have 2 finished MDX reference pages (Skywards
Infinite, Skywards Signature). User agreed: "right now we have no say
influence or anything we haven't even finalised the structure".

Park this as a Growth-Analytics-Lead memo at
`.council/strategy/2026-q3-partnership-outreach.md` once content
volume justifies a serious pitch deck.

## Branch / commit state

Branch: `claude/check-firecrawl-status-QqRQp` (pushed)

Recent commits (newest first):

- `a931a2c` css(prose): bump body to 18px ink, H2 to clamp(26,34) navy 700
- `4b096aa` policy: amend §10 + LIBRARY to allow issuer press libraries

(Use `git log --oneline -20` for context.)

## Open phases parked, in rough priority

1. **Image binary swap** (this handoff's primary task).
2. **Competitor teardown dossier** — Head of Research, before any
   more UX briefs ship.
3. **Phase 2a.2.5** — Hot Tips + Jump-to-Section sticky nav (drafted
   verbally with the user, no brief opened yet). Should follow the
   competitor teardown so we copy the right patterns rather than
   guessing.
4. **Phase 2a.2.1** — Propagate the new card-review template to the
   remaining 29 MDX files. Gated on user approving the visual on the
   two reference pages first.
5. **Homepage rebuild** — OMAAT homepage analysis exists in partial
   form; needs the full teardown above to inform it.
6. **Phase 2a per-bank scrape briefs** — Mashreq → ADIB → DIB →
   RAKBank → Emirates Islamic → ADCB, scheduled from 2026-05-27.

End.
