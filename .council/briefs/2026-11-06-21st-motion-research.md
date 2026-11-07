# 21st motion and editorial-flow exploration

Date: 2026-11-06. Coordinator: Codex. State: researched and being prototyped
for owner review; not a production selection or release approval.

## Owner direction and the observed defect

Mostafa requested a deeper examination of 21st's own homepage, animations,
flows and wider resources. He supplied an iPhone Safari screenshot of the
News index's **Latest reporting** rows: small photographs, a larger Liv
card container and inconsistent alignment. The reported device is an
iPhone 18 Pro Max; the screenshot is evidence of the visual defect, not
independent device identification or a complete Safari test.

The shared `NewsListingVisual` source confirms two different compact width
contracts: photos/previews at `clamp(68px, 12vw, 128px)`, versus Liv at
`clamp(88px, 14vw, 128px)` with an 88px total height and its credit inside
that height. This is a frame/credit-layout defect, not missing card art.
The correction belongs in the shared component, not a page-specific patch.

The previous 21st pass concentrated on conservative native controls and
reading patterns. It did not exhaust the catalogue or establish the quality
of the homepage's motion. Protecting the existing homepage hero/reel was
reasonable; treating that as a reason to stop investigating lower-page
motion would be too restrictive. The owner has not yet selected a new
homepage direction.

## Research method and limits

One agent was assigned solely to fresh resource research, separately from
implementation. This pass inspected public primary listings and available
usage descriptions: ten ranked component references, six challengers,
four template listings, one app listing and five deliberate non-selections.
No paid retrieval, generation, installation or new dependency was used.
No stored or previously pasted credential was read or used.

The catalogue CLI's credential-free attempt required sign-in. Public
listing/usage evidence was therefore used instead. Access to an installed
plugin is not evidence of unrestricted access to all code or paid templates.
Licence labels below describe the listing only; copied source and bundled
asset rights would need a separate check. No catalogue source was copied.

The Chrome tool connection failed before a page could be observed during
this turn. Rendered animation, touch, keyboard, Safari and reduced-motion
behaviour are **not verified by the text descriptions**. They remain
acceptance gates, not presumed passes.

## What 21st's homepage contributes

Primary sources: [homepage](https://21st.dev/) and
[changelog](https://21st.dev/changelog).

The useful structural lesson is a browse-and-preview rhythm: a concise
lead, distinct topical shelves, visible demonstrations, whole-template
discovery and a clear next action. Its 7 August changelog describes loading
lower shelves as readers approach them and delivering images at the size
shown. That is publisher evidence of delivery intent, not a current network
trace. It complements DubaiPoints' existing scroll-gated reel; it does not
justify loading another video at first paint.

The exact **Hover Preview** resource appears in 21st's homepage example.
Catalogue photographs, counters, testimonials and marketing metrics are
not DubaiPoints facts and do not transfer with the pattern.

## Ranked component references

| Priority | Primary reference | Proposed use | Important boundary |
|---|---|---|---|
| 1 | [Scroll 01](https://21st.dev/@felipemenezes098/components/scroll-01) | Sticky companion imagery for short programme chapters | MIT displayed; Motion listed. Native ordinary-scroll adaptation; phone inline sequence. |
| 2 | [Progressive Carousel](https://21st.dev/@uilayout.contact/components/progressive-carousel) | Named, reader-selected travel-discovery chapters | No licence shown. Public usage does not establish autoplay. Our prototype has no timer. |
| 3 | [Shared Element Gallery](https://21st.dev/@jahed/components/shared-element-gallery) | Expand genuine editorial photographs and return to the same place | No licence shown; Framer/Lucide listed. Close, Escape, focus return and credits required. |
| 4 | [Animated Tabs](https://21st.dev/@ibelick/components/animated-tabs) | Selection continuity in existing tool controls | MIT displayed. Keep correct native filter/radio/link semantics and touch targets. |
| 5 | [Hover Preview](https://21st.dev/@minhxthanh/components/hover-preview) | Optional secondary-link photograph previews | No licence shown. Never the only phone image or information available only on hover. |
| 6 | [Scroll media expansion](https://21st.dev/@arunachalam/components/scroll-expansion-hero) | Bounded still-image entrance for an editorial feature | MIT displayed. Reject demo scroll-to-top behaviour and any extra first-paint video. |
| 7 | [Picture](https://21st.dev/@shoota/components/picture) | Better photograph/caption framing | No licence shown. Real issuer art stays unmodified; touch image remains full colour. |
| 8 | [Vertical Cut Reveal](https://21st.dev/@danielpetho/components/vertical-cut-reveal) | One short editorial section-heading entrance | MIT displayed. No delayed financial values or paragraph-by-paragraph waiting. |
| 9 | [Dynamic Island TOC](https://21st.dev/@digitalzone0707/components/dynamic-island-toc) | Alternative compact mobile contents control | No licence shown. Prototype only; replace, do not duplicate, existing contents. |
| 10 | [Scroll Progress](https://21st.dev/@ibelick/components/scroll-progress) | Refine existing reading-location feedback | MIT displayed. Reuse current controller; no second progress bar or nested scroller. |

These are potential applications inferred from public descriptions, not
claims that the original components are suitable without adaptation.

## Challengers and wider resources

| Reference | Why inspect it | Why not import it wholesale |
|---|---|---|
| [Interactive Scrolling Story](https://21st.dev/@minhxthanh/components/interactive-scrolling-story-component) | More theatrical chapter transitions | Full interaction, dependencies and licence not established. |
| [Interactive Image Accordion](https://21st.dev/@minhxthanh/components/interactive-image-accordion) | Reader-chosen picture/copy chapters | Public usage is too thin to establish touch/keyboard behaviour. |
| [Sticky Scroll Reveal](https://21st.dev/@manuarora700/components/sticky-scroll-reveal) | Alternative chapter composition; MIT displayed | Check internal-scroll assumptions; choose one chapter language, not several. |
| [Hotel Showcase](https://21st.dev/@kedhareswer/components/hotel-showcase) | Travel-specific gallery hierarchy | GSAP described; demo availability, reviews and photographs do not transfer. |
| [Registration Stepper](https://21st.dev/@ravikatiyar162/components/registration-stepper) | Clear current/completed/editable task state | A forced wizard may add friction; no registration or email gate. |
| [Story scroll](https://21st.dev/@boudjadjasamira/components/story-scroll) | About/editorial-special chapter rhythm | Do not copy huge full-screen manifesto pacing or introduce global GSAP. |
| [Samuel Kraft Portfolio](https://21st.dev/@samuelkraft/templates/samuelkraft-portfolio-blog) | Writing, case-study and interaction-playground continuity | 21st download requires a paid plan; personal branding is not a publication system. |
| [Blog Starter Kit](https://21st.dev/@larsen66/templates/vercel-blog-starter-kit) | Calm reading-layout control for comparison | No migration to Next.js or loss of the site's factual templates. |
| [Forma Pilates](https://21st.dev/@larsen66/templates/forma-pilates-studio) | Photo → offer/conditions → next-task hierarchy | Paid-plan download; no fitness ratings, booking machinery or demo copy. |
| [Qronos](https://21st.dev/@monolythdev/templates/qronos-ai-agent-scheduler-template) | Progressive demonstration and static mobile simplification | Paid template; no invented live dashboards or SaaS visual takeover. |
| [God's Eye View](https://21st.dev/community/apps/gods-eye-view) | A separate future route-map research lead | A whole Cesium app is not a drop-in animation. New data/licensing/performance brief required. |

## Three comparable directions

All three retain Newsreader/Geist, current house tokens, real licensed
images and visible credits. They differ in composition and interaction,
not just colour. The actual homepage hero/reel is outside this exploration.

1. **Runway Chapters.** Sequential editorial hierarchy: a concise opener,
   three copy chapters and a changing sticky companion image on wide
   screens. Phone uses ordinary interleaved pictures/copy. Best trial:
   Skywards. Risk: cinematic pacing becoming a toll gate before useful
   information. Anchors, short chapters and ordinary scroll are mandatory.
2. **Dispatch Gallery.** Browsable magazine hierarchy: one lead image,
   supporting stories and manual named discovery chapters. Best trial:
   News/Guides/Hotels and one lower-homepage module. Risk: pictures
   obscuring utility. Titles, dates, conditions and next actions stay
   outside the image. No autoplay or anonymous dots.
3. **Decision Studio.** Task-led hierarchy: reader-selected goals,
   visible context and direct tool destinations. Best trial: Finder and
   Tracker, compared against existing controls. Risk: extra clicks or
   hidden filters. This is not approval to build a forced wizard or
   change eligibility/calculation semantics.

**Recommendation:** Dispatch Gallery is the strongest publication-wide
direction to preview first; use Runway Chapters selectively on programme
explainers. Decision Studio needs a task test before any tool redesign.
Do not layer all three motion systems onto every page.

## Non-selections and acceptance gates

Zoom parallax, word-by-word text reveal and hover-curtain cards can be
useful experiments for a short special or About surprise. They are not
the default for fees, offer conditions or ordinary article paragraphs.
Global smooth-scroll replacement, forced scroll resets and hover-only
essential information remain rejected. This is a fitness decision, not
an assertion that all animation is unsuitable.

Before selection: compare actual light/dark concepts, keyboard/touch and
back-scroll; test 320px, phone landscape and Safari browser-chrome changes;
verify complete no-JavaScript/reduced-motion states; keep one navigation
system; measure added image/script work and layout shift. Owner direction
is required before applying a new homepage composition. A green CI check
does not provide that direction or authorise deployment.
