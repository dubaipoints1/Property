import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ANALYTICS_REVIEW_ORIGIN,
  ANALYTICS_REVIEW_PATHS,
  buildAnalyticsReviewPlan,
  sanitiseAnalyticsReviewPage,
} from "../../src/lib/analyticsReview";

const id = "G-DPREVIEW01"; // Fictional format example; never executed.
const sensitive = "/cards/finder/?salary=17500&cv_spend=12345&email=private@example.test&gclid=ad-secret#private-note";

test("every state is uninstalled, disabled and review-only, including simulated acceptance", () => {
  for (const simulatedConsent of ["undecided", "rejected", "withdrawn", "accepted", "untrusted"] as const) {
    const result = buildAnalyticsReviewPlan({ simulatedConsent, measurementId: id, pageUrl: sensitive });
    assert.equal(result.reviewOnly, true);
    assert.equal(result.integrationInstalled, false);
    assert.equal(result.googleRequestsEnabled, false);
    assert.equal(result.choicesStored, false);
    assert.equal(result.proposedConsentParameters.ad_storage, "denied");
    assert.equal(result.proposedConsentParameters.ad_user_data, "denied");
    assert.equal(result.proposedConsentParameters.ad_personalization, "denied");
  }
});

test("undecided, rejected and withdrawn states contain no proposed measurement commands", () => {
  for (const simulatedConsent of ["undecided", "rejected", "withdrawn"]) {
    const result = buildAnalyticsReviewPlan({ simulatedConsent, measurementId: id, pageUrl: sensitive });
    assert.deepEqual(result.proposedMeasurementCommands, []);
    assert.equal(result.proposedConsentParameters.analytics_storage, "denied");
    assert.equal(result.status, "no_measurement_commands");
    assert.doesNotMatch(JSON.stringify(result), /private|17500|12345|ad-secret/);
  }
});

test("simulated acceptance creates only sanitised config and manual page-view examples", () => {
  const result = buildAnalyticsReviewPlan({ simulatedConsent: "accepted", measurementId: id, pageUrl: sensitive });
  assert.equal(result.status, "sanitised_example_only");
  assert.equal(result.proposedConsentParameters.analytics_storage, "granted");
  assert.equal(result.proposedMeasurementCommands.length, 2);
  const [config, event] = result.proposedMeasurementCommands;
  assert.equal(config.operation, "config");
  if (config.operation !== "config") assert.fail("Expected configuration example");
  assert.equal(config.parameters.send_page_view, false);
  assert.equal(config.parameters.allow_google_signals, false);
  assert.equal(config.parameters.allow_ad_personalization_signals, false);
  assert.equal(config.measurementId, id);
  assert.equal(event.operation, "event");
  if (event.operation !== "event") assert.fail("Expected page-view example");
  assert.equal(event.eventName, "page_view");
  assert.equal(event.parameters.page_location, ANALYTICS_REVIEW_ORIGIN + "/cards/finder/");
  assert.equal(event.parameters.page_referrer, "");
  assert.equal(event.parameters.page_title, "DubaiPoints");
  assert.doesNotMatch(JSON.stringify(result), /private|17500|12345|ad-secret|gclid|user_id|user_properties/);
});

test("all allowlisted public demonstration routes discard arbitrary query and fragment data", () => {
  for (const path of ANALYTICS_REVIEW_PATHS) {
    assert.equal(sanitiseAnalyticsReviewPage(path + "?st_salary=25000&unknown=secret#fragment"), ANALYTICS_REVIEW_ORIGIN + path);
    assert.equal(sanitiseAnalyticsReviewPage(ANALYTICS_REVIEW_ORIGIN + path), ANALYTICS_REVIEW_ORIGIN + path);
  }
});

test("external, credential-bearing, non-HTTPS, private and ambiguous paths fail closed without echo", () => {
  for (const pageUrl of [
    "https://evil.test/cards/finder/?email=private@example.test",
    "//evil.test/cards/finder/", "javascript:private-secret", "data:text/html,secret",
    "http://dubaipoints.ae/cards/finder/", "https://dubaipoints.ae.evil.test/cards/finder/",
    "https://user:private-secret@dubaipoints.ae/cards/finder/",
    "/account/private-secret/", "/search/", "/dev/analytics-consent-review/",
    "/cards/../cards/finder/", "/cards/%2e%2e/cards/finder/", "/cards/%66inder/", "/cards/finder", "cards/finder/",
    "/cards/\\finder/", "/cards/finder/\n", " ", "x".repeat(5000), null, undefined, 123,
  ]) {
    const result = buildAnalyticsReviewPlan({ simulatedConsent: "accepted", measurementId: id, pageUrl });
    assert.equal(sanitiseAnalyticsReviewPage(pageUrl), undefined);
    assert.deepEqual(result.proposedMeasurementCommands, []);
    assert.deepEqual(result.issues, ["unsupported_page_url"]);
    assert.doesNotMatch(JSON.stringify(result), /private-secret|private@example|evil\.test|javascript|data:text/);
  }
});

test("invalid IDs never become command fields or error text", () => {
  for (const measurementId of ["", "G-<script>", "G-private@example.test", "UA-123", "G-DPREVIEW01&email=x", null, 123]) {
    const result = buildAnalyticsReviewPlan({ simulatedConsent: "accepted", measurementId, pageUrl: "/" });
    assert.deepEqual(result.issues, ["invalid_measurement_id"]);
    assert.deepEqual(result.proposedMeasurementCommands, []);
    assert.doesNotMatch(JSON.stringify(result), /script|@|email|UA-/);
  }
});

test("unknown consent values are refused; withdrawal does not reuse an accepted plan", () => {
  const accepted = buildAnalyticsReviewPlan({ simulatedConsent: "accepted", measurementId: id, pageUrl: "/" });
  const withdrawn = buildAnalyticsReviewPlan({ simulatedConsent: "withdrawn", measurementId: id, pageUrl: "/" });
  const invalid = buildAnalyticsReviewPlan({ simulatedConsent: "private@example.test", measurementId: id, pageUrl: "/" });
  assert.equal(accepted.proposedMeasurementCommands.length, 2);
  assert.equal(withdrawn.proposedMeasurementCommands.length, 0);
  assert.equal(invalid.simulatedConsent, "undecided");
  assert.deepEqual(invalid.issues, ["invalid_consent_choice"]);
  assert.doesNotMatch(JSON.stringify(invalid), /private@example/);
});

test("unrecognised input properties cannot add referrers, identities, ad IDs or event names", () => {
  const input = {
    simulatedConsent: "accepted", measurementId: id, pageUrl: "/",
    pageTitle: "private-secret", referrer: "https://evil.test/private-secret",
    user_id: "private-secret", salary: 17500, spend: 12345, gclid: "ad-secret", eventName: "purchase",
  };
  const before = JSON.stringify(input);
  const result = buildAnalyticsReviewPlan(input);
  assert.equal(JSON.stringify(input), before);
  assert.doesNotMatch(JSON.stringify(result), /private-secret|ad-secret|17500|12345|purchase|user_id/);
});

test("the planner and private review page contain no integration, request or storage calls", () => {
  for (const file of ["src/lib/analyticsReview.ts", "src/pages/dev/analytics-consent-review.astro"]) {
    const source = readFileSync(new URL("../../" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\b(?:fetch|gtag|sendBeacon|XMLHttpRequest)\s*\(|\b(?:localStorage|sessionStorage)\b|document\.cookie|googletagmanager\.com|google-analytics\.com/);
  }
  const page = readFileSync(new URL("../../src/pages/dev/analytics-consent-review.astro", import.meta.url), "utf8");
  assert.match(page, /name="robots" content="noindex,nofollow"/);
  assert.match(page, /data-pagefind-ignore/);
  assert.doesNotMatch(page, /BaseLayout|Footer|Header/);
  const prune = readFileSync(new URL("../../scripts/build/prune-internal-pages.mjs", import.meta.url), "utf8");
  assert.match(prune, /\["dev", "design-spike", "style-guide"\]/);
});
