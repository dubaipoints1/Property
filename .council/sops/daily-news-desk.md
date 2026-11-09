# Daily news desk — local commissioning and hand-off

Prepared 2026-11-09. Candidate operating procedure, not an activated worker,
new source, paid collection, publication schedule or guaranteed turnaround.
Authority remains CLAUDE.md (including the 27 September sourcing and
7 November no-ceiling amendments), `.council/02_workflow.md` and the existing
airline/hotel desk mandates. The Managing Editor owns the shift; agent role
files do not run themselves.

## Before each staffed shift

Run `node scripts/newsroom/report.mjs` from the repository root. Optional
`--as-of YYYY-MM-DD` makes a dated comparison reproducible; `--json` prints
the same records as JSON. The command only reads local files and prints to
stdout. It does not fetch feeds, spend credits, edit a queue or article,
start agents, open issues, trigger workflows or approve publication.

The seven/thirty-day counts use UTC-inclusive `publishedAt` dates in
`src/content/news/**/*.md{,x}`, grouped by the explicit `beat`. Missing beats
are unclassified; future dates are excluded. These are repository-dated
entries, not independently verified live-publication, audience or quality
metrics. An empty commissioning queue is not an empty discovery backlog.

Separately inspect the latest actual RSS health and rolling news issue on
GitHub. Verify when the sweep ran, per-feed outcome and whether the digest
was delivered. RSS discovery is free metadata intake, not a full-source
read. Paid press-room/programme checks are a different channel: a successful
poll does not prove a fresh collection. Preserve known credit-skipped holds.
This tool does not make those external checks or declare their recovery.

## Triage and commission

1. Managing Editor gives each considered lead one exact disposition with a
   reason: **commissioned**, **held** or **passed-over**. Record the discovered
   source/date, owning desk, actual owner and next action. A UK-only card offer
   may be passed over from sufficient metadata; that is not verification of
   its full terms. Do not mark every feed lead researched.
2. State the actionable UAE question: what should the reader book, earn,
   hold, burn or check? Distinguish a fresh change from evergreen explanation,
   duplicate reporting and a claim with no established UAE applicability.
   Incident/safety/security stories and their associated disruptions remain
   excluded. Escalate uncertain scope; no volume quota or numerical ceiling.
3. Commission a **quick hit (120–250 words)**, **standard (300–550 words)** or
   **analysis (600–900 words)** according to the question. Short does not mean
   unverified. Analysis needs Travel & Experiences countersign before factual
   review. Do not turn every timely lead into a large comparison project or
   silently rescope a held quantitative commission.
4. Open the real dated brief, assign its editor and task Research through an
   actual staffed session. Discovery alone does not start any agent. Use the
   existing brief/research/SEO/draft/Fact-Check/technical/Chairman stages; no
   automatic next-stage promotion. Target dates are planning, not publication.

## Evidence and independent hand-offs

Research reads the full relevant sources and records access time, exact URL,
source role, supported claims, eligibility, deadlines, exclusions and open
questions in a dossier. A feed title/snippet, HTTP 200, price calculator,
marketing headline or successful job is not that source evidence. Paid work
requires separately authorised exact configuration/cost; do not retry or
activate collection because a shift has started.

For **news**, a named secondary outlet may support attributed reporting after
full reading under the 27 September ruling; primary first when readable.
Do not reject every story merely because its primary page is unavailable.
State what is unconfirmed and distinguish reported claims from our own checks.
This does not relax deterministic source-bound financial extraction, permit
copying a competitor's analysis/wording/images, or certify a global offer's
UAE eligibility. Cards, guides and canonical data retain their stronger rules.

Research hands evidence to SEO and the section editor; the author drafts from
that evidence. Fact-Checker independently checks every material claim and
derived figure, attribution, scope and originality, then records the actual
review. Never infer a no-conflict declaration: collect the contributor's
holdings, benefits/hosted experience, commercial relationships and required
above-fold disclosure or an explicit declaration, with its dated record.
Technical review checks the actual draft, links, imagery, schema and release
checks. Chairman clearance is article-specific, not the commissioning
queue's `ready` label or an unrelated maintenance approval.

## The explicit local queue

`.council/newsroom/queue.json` records the first shift's two draft commissions,
one held candidate and one passed-over lead. The earlier held quantitative
commissions retain their own briefs; they are not silently rescoped here.
Human-reviewed edits are deliberate, not ingestion. Its version-1 shape is
`{ "schemaVersion": 1, "items": [...] }`.
Each item uses these fields; unsupported fields/stages fail the preflight:

| Field | Meaning |
|---|---|
| `id`, `topic` | Unique kebab-case brief slug and working question |
| `desk`, `format` | `airline`/`hotel`/`banking`; `quick-hit`/`standard`/`analysis` |
| `owner`, `nextAction` | Actual assigned editor/role and concrete next action |
| `stage` | `triage`, `research`, `seo`, `draft`, `factcheck`, `tech`, `chairman`, `ready`, `published`, `held` or `passed-over` |
| `brief` | Actual `.council/briefs/*.md` path, or `null` before commissioning |
| `draft` | Optional/null before drafting; actual `.council/drafts/*.md{,x}` or `src/content/news/*.md{,x}` hand-off path, including dated subdirectories |
| `discoveredAt` | Actual ISO UTC date/timestamp; not a fresh verification claim |
| `disposition` | `{ "status": "commissioned" / "held" / "passed-over", "reason": "..." }`; held/passed-over must match the stage |
| `sources` | Array of `{ "url": "https://...", "role": "primary" / "secondary", "readStatus": "unread" / "read", "claimsStatus": "unverified" / "checked", "evidencePath": ".council/research/...md" / null }` |
| `holds` | Explicit unresolved questions; empty does not prove correctness |
| `coi` | `{ "status": "pending" / "declared", "record": ".council/...md" / null }`; never invent no conflict |
| `review` | Optional until reviewed: `{ "reviewer": "...", "record": ".council/...md" }`; factual/source-check record, reviewer distinct from author |
| `travelSignoff` | Same shape; required for an analysis candidate |
| `publicSlug` | Optional kebab-case news route slug; for a `published` repository claim it must equal `id` and resolve to a non-future news entry |

`read` means the full relevant source was actually read; `checked` means the
material claims used were actually checked, not merely that a URL exists.
Evidence records must describe the checks, source capture time and limitations;
retain only necessary public excerpts/receipts in the repo and keep full
captures private under the existing capture-hygiene rules.

For a release candidate the preflight inspects the **real brief**: matching
slug/editor, research/SEO/draft/Fact-Check/technical/UX/Standards cells all
`complete`, Chairman `approved`,
an actual draft with matching slug, title/description and narrative body,
read/checked sources with non-empty local evidence, independent review/COI
records, analysis countersign and no holds. Its best result is
**recorded-gates-complete**, never approval. It cannot prove the records true,
reviewer independence, source currentness/adequacy or actual publication.
Different role names must not disguise one author approving their own work.
The draft check is structural only, not MDX compilation, full factual review
or acceptance. No stage, declaration or source fact is changed by running the report.

## End of shift and publication

Record each hand-off/blocker and its next owner. Link a commissioned lead to
its brief; preserve held/passed-over reasons rather than deleting history.
The rolling discovery issue may be closed only after its leads have explicit
dispositions. Avoid repeatedly rediscovering an already handled lead or
silently losing it when latest-triage.json is overwritten.

Publish only through the existing article Council review, genuine successful
exact-head checks and protected release. A source/headline rewrite, generic
replacement for missing quotations, queue status or green discovery run is
not enough. Verify the live article and record that evidence separately;
repository `publishedAt` and `publicSlug` alone do not prove deployment.
Review expired offers through the existing expiry process. Review output mix,
distinct publishing dates, useful leads, blocked reasons and time spent at
each real stage; do not reward padding, fabricated experience or volume.
