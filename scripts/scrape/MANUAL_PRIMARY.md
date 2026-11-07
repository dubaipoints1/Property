# Manual primary-source card maintenance

New profiles may use `manual-primary.registry.json` instead of an active paid bank
URL configuration. A slug must occur exactly once across those two routes. This
registry is **not** read by bank scraper CLIs, the monitor target builder or a paid
scheduled sweep. Adding a profile here does not provision or activate a monitor.

Each entry records its bank, HTTPS product/KFS sources, parser module/export and
content hash, and pinned fixture paths/hashes. An editor requests a new free
public-source capture when a profile needs review, verifies bytes/representation,
runs the deterministic parser offline and reconciles the resulting field diff.
Protected editor values still require an explicit source-backed correction review.

There is no automatic freshness promise. The profile discloses manual maintenance,
the actual source-record date and pending fields. An attempted read, a successful
HTTP response or a newly opened review does not reset a verification date. Failed,
partial, shell and unreadable sources stay unresolved. Rendered browser evidence
names its DOM/snapshot representation and must never claim HTTP-body bytes.

The normal Council/QA/release gates still apply. No LLM numeric extraction,
invented zeros, blind current-date stamps, paid source calls or monitor activation
are part of this manual route.
