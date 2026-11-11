---
title: Expat Starter mobile stylesheet delivery
tier: T3
technical-status: pending-hosted
chairman-status: pending
---

# Expat Starter mobile stylesheet delivery

On 11 November 2026 the owner directed a separate Expat Starter performance fix, then a full Starting Points retest and protected release only after mobile reaches 95 and Council signs off. The homepage hero is unchanged and Trip.com stays pending.

On the preceding combined Starting Points preview, Expat Starter scored a three-run mobile median of 86 (86/88/86) and 94 (86/94/96) in the paired follow-up; the earlier comparison host had byte-identical HTML and all observed first-party resources. The traces show slower CSS/font completion and an existing first-paint risk; they do not establish a regression caused by the first-card fix.

For `/guides/expat-starter/` only, the postbuild step substitutes each unchanged compiled stylesheet at its original link position. The first hosted candidate removed those requests but scored 94/100/94. Its two slow runs discovered the existing italic face later than the normal ones. The revised head moves the two existing normal-face preload links before the compiled CSS and preloads the unchanged italic face already requested on all three runs. It keeps inline styles, scripts, all body bytes, canonical, CSP policy, tracking, source, fonts and other routes unchanged. The priority change is a hypothesis for hosted verification, not a claim that it caused all delay. Larger HTML can cost more with a warm stylesheet cache.

Release requires the exact route/cascade guards, matched built assets and rendering, hosted mobile median ≥95 and initial transfer ≤200 KiB, exact-head executed CI and Council. Verify the separate deployment before testing the full Starting Points candidate. Record actual sign-off and evidence in the respective PRs.
