// A single private view over immutable discovery receipts and the editor's
// existing commission queue. No network, writer or publication route.
import { canonicalUrl, plainText } from "../news-monitor/_pipeline.mjs";
import { validateQueue } from "./report.mjs";

const MAX_RECEIPTS = 512;
const MAX_LEADS_PER_RECEIPT = 12_000;
const MAX_WINDOW_LEADS = 100_000;
const MAX_SIGHTINGS_PER_LEAD = 128;
const excluded = /\b(?:syria(?:n)?|damascus|aleppo|latakia|accident|crash|emergenc(?:y|ies)|diversion|diverted|hijack\w*|terror\w*|violence|assault|safety incident|security incident|(?:staff|crew) misconduct)\b|سوري[اة]|دمشق|حلب|اللاذقية|حادث|تحطم|طوارئ|اختطاف|اعتداء|إرهاب/i;
const withdrawn = /\b(?:owner|chairman)(?:-withdrawn|\b[^.]{0,80}\bwithdr(?:ew|awn))\b/i;
const stages = new Set(["triage", "research", "seo", "draft", "factcheck", "tech", "chairman", "ready",
  "published", "held", "passed-over", "seen-by-existing-rss"]);
const dispositions = new Set(["needs-source-review", "scope-review", "reconcile-existing", "excluded"]);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const utc = value => typeof value === "string" && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const id = value => typeof value === "string" && value.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
function descriptor(url) {
  // URL percent-escapes are not necessarily valid UTF-8. Keep the canonical
  // identity even if some unrelated escape cannot be decoded for screening.
  const decoder = new TextDecoder();
  return url.replace(/(?:%[0-9a-f]{2})+/gi,
    block => decoder.decode(Uint8Array.from(block.match(/[0-9a-f]{2}/gi), hex => Number.parseInt(hex, 16))));
}

function safeObservation(value, title, receipt) {
  assert(object(value) && id(value.sourceId) && utc(value.observedAt) && value.observedAt <= receipt.finishedAt &&
    id(value.kind) && id(value.beat) && ["official", "discovery"].includes(value.sourceRole) &&
    object(value.evaluation) && dispositions.has(value.evaluation.disposition), "Invalid discovery sighting.");
  const evaluation = {};
  for (const field of ["disposition", "scope", "priority", "next", "question", "formatHint"]) {
    if (value.evaluation[field] != null) {
      assert(typeof value.evaluation[field] === "string", "Invalid discovery evaluation.");
      evaluation[field] = plainText(value.evaluation[field], 600);
    }
  }
  const sourceMethod = value.sourceMethod;
  const observation = { sourceId: value.sourceId, beat: value.beat, sourceRole: value.sourceRole,
    observedAt: value.observedAt, kind: value.kind,
    reportedAt: value.reportedAt == null ? null : plainText(value.reportedAt, 120), title,
    evaluation, receiptStartedAt: receipt.startedAt };
  if (sourceMethod !== undefined) {
    assert(["rss", "manual", "page", "official-page"].includes(sourceMethod), "Invalid discovery source method.");
    observation.sourceMethod = sourceMethod;
  }
  return observation;
}

function withdrawnByOwner(commission) {
  return ["held", "passed-over"].includes(commission.stage) &&
    [commission.disposition.reason, commission.nextAction, ...commission.holds].some(text => withdrawn.test(text));
}

function sourceRefs(existing) {
  assert(Array.isArray(existing) && existing.length <= 512 && existing.every(ref => object(ref) &&
    stages.has(ref.stage) && (ref.id === null ? ref.stage === "seen-by-existing-rss" : id(ref.id))),
  "Invalid prior queue references.");
  return existing;
}

/** The result is a private view, not an editable queue file or verified news. */
export function buildIntakeQueue({ editorialQueue, receipts, verifiedReleaseMarkers = [] } = {}) {
  validateQueue(editorialQueue);
  assert(Array.isArray(receipts) && receipts.length <= MAX_RECEIPTS, "Invalid discovery receipt list.");
  assert(receipts.every(row => object(row) && row.publicationReady === false && utc(row.startedAt) &&
    utc(row.finishedAt) && row.startedAt <= row.finishedAt && Array.isArray(row.leads) &&
    row.leads.length <= MAX_LEADS_PER_RECEIPT), "Invalid discovery receipt.");
  const ordered = [...receipts].sort((a, b) => compare(a.startedAt, b.startedAt));
  assert(new Set(ordered.map(row => row.startedAt)).size === ordered.length, "Duplicate discovery receipt.");
  const commissions = structuredClone(editorialQueue.items);
  const commissionsById = new Map(commissions.map(item => [item.id, item]));
  // The only accepted overlay is a desk-reviewed exact slug, canonical,
  // merge commit and fresh live observation. It never rewrites an older
  // queue stage or acts as authority for another release.
  assert(Array.isArray(verifiedReleaseMarkers) && verifiedReleaseMarkers.length <= commissions.length,
    "Invalid release marker list.");
  const releases = new Map();
  for (const marker of verifiedReleaseMarkers) {
    assert(object(marker) && id(marker.id) && commissionsById.has(marker.id) && !releases.has(marker.id)
      && ["news", "guides"].some(family => marker.canonical === `https://dubaipoints.ae/${family}/${marker.id}/`)
      && typeof marker.mergeCommit === "string" && /^[a-f0-9]{40}$/.test(marker.mergeCommit)
      && utc(marker.liveCheckedAt), "Invalid release marker.");
    releases.set(marker.id, { id: marker.id, canonical: marker.canonical, mergeCommit: marker.mergeCommit,
      liveCheckedAt: marker.liveCheckedAt, priorQueueStage: commissionsById.get(marker.id).stage });
  }
  const commissionsByUrl = new Map();
  for (const commission of commissions) {
    for (const source of commission.sources) {
      const key = canonicalUrl(source.url);
      if (!key) continue;
      const ids = commissionsByUrl.get(key) ?? new Set();
      ids.add(commission.id);
      commissionsByUrl.set(key, ids);
    }
  }
  const deduped = new Map();
  const suppressed = new Set();
  let leadRows = 0;
  for (const receipt of ordered) {
    for (const lead of receipt.leads) {
      leadRows++;
      assert(leadRows <= MAX_WINDOW_LEADS, "Discovery receipt window exceeds the bounded queue view.");
      const url = canonicalUrl(lead?.url);
      const title = typeof lead?.title === "string" && plainText(lead.title);
      assert(object(lead) && lead.verified === false && url && title &&
        Array.isArray(lead.sightings) && lead.sightings.length > 0 &&
        lead.sightings.length <= MAX_SIGHTINGS_PER_LEAD, "Invalid unverified discovery lead.");
      const refs = sourceRefs(lead.existing);
      const matched = new Set([...(commissionsByUrl.get(url) ?? []), ...refs.map(ref => ref.id).filter(Boolean)]);
      const policyText = title + " " + descriptor(url);
      const sightings = lead.sightings.map(value => safeObservation(value, title, receipt));
      if (excluded.test(policyText) || [...matched].some(key => {
        const commission = commissionsById.get(key);
        return commission && withdrawnByOwner(commission);
      }) || sightings.some(sighting => sighting.evaluation.disposition === "excluded")) {
        // Withhold this entire URL, including an apparently innocuous rename.
        suppressed.add(url);
        continue;
      }
      const group = deduped.get(url) ?? { url, references: new Map(), sightings: new Map() };
      for (const ref of refs) group.references.set(ref.id, ref.stage);
      for (const key of matched) {
        if (commissionsById.has(key)) group.references.set(key, commissionsById.get(key).stage);
      }
      for (const sighting of sightings) {
        const key = JSON.stringify([sighting.sourceId, sighting.observedAt, sighting.kind,
          sighting.title, sighting.reportedAt, sighting.evaluation.disposition]);
        if (!group.sightings.has(key)) group.sightings.set(key, sighting);
      }
      deduped.set(url, group);
    }
  }
  const intake = [], reconcile = [];
  for (const [url, group] of deduped) {
    if (suppressed.has(url)) continue;
    const orderedSightings = [...group.sightings.values()].sort((a, b) =>
      compare(a.observedAt, b.observedAt) || compare(a.receiptStartedAt, b.receiptStartedAt) ||
      compare(a.sourceId, b.sourceId) || compare(a.title, b.title));
    const first = orderedSightings[0], last = orderedSightings.at(-1);
    const references = [...group.references].map(([key, stage]) => ({ id: key, stage }));
    const released = references.map(ref => releases.get(ref.id)).filter(Boolean);
    const existing = references.length > 0 || orderedSightings.some(s => s.evaluation.disposition === "reconcile-existing");
    const scopeReview = orderedSightings.some(s => s.evaluation.disposition === "scope-review");
    const row = { url, title: last.title, verified: false,
      disposition: existing ? "reconcile-existing" : scopeReview ? "scope-review" : "needs-source-review",
      firstObservedAt: first.observedAt, lastObservedAt: last.observedAt, references,
      sightings: orderedSightings.slice(-MAX_SIGHTINGS_PER_LEAD), sightingCount: orderedSightings.length,
      omittedSightings: Math.max(0, orderedSightings.length - MAX_SIGHTINGS_PER_LEAD),
      ...(released.length ? { verifiedPriorReleases: released } : {}),
      next: released.length ? "Already live per a verified prior release. Do not recommission or change the historical stage automatically."
        : existing ? "Reconcile against the existing commission; do not reopen or change its status automatically."
        : scopeReview ? "Establish UAE relevance and rule out excluded coverage before commissioning."
          : "Read the full sources, verify the change and UAE applicability; no commission has been opened." };
    (existing ? reconcile : intake).push(row);
  }
  for (const group of [intake, reconcile]) group.sort((a, b) =>
    compare(b.lastObservedAt, a.lastObservedAt) || compare(a.url, b.url));
  return {
    schemaVersion: 1, mode: "private-editorial-intake-view", publicationAuthority: false, publicationReady: false,
    window: { oldestReceiptAt: ordered[0]?.startedAt ?? null, latestReceiptAt: ordered.at(-1)?.startedAt ?? null },
    counts: { receipts: ordered.length, commissions: commissions.length, leadRows,
      uniqueUnverified: intake.length + reconcile.length, intake: intake.length, reconcile: reconcile.length,
      suppressed: suppressed.size },
    releaseReconciliation: [...releases.values()],
    commissions, intake, reconcile,
  };
}
