/** Review data only. This module installs no SDK, stores no state and sends nothing. */
export const ANALYTICS_REVIEW_ORIGIN = "https://dubaipoints.ae";

// A finite demonstration set, not an arbitrary path/personalisation collector.
export const ANALYTICS_REVIEW_PATHS = [
  "/",
  "/cards/finder/",
  "/cards/compare/",
  "/salary-transfer/",
  "/salary-transfer/calculator/",
  "/airlines/skywards/",
  "/guides/uae-credit-card-eligibility-2026/",
] as const;
const publicPaths = new Set<string>(ANALYTICS_REVIEW_PATHS);

export type AnalyticsReviewConsent = "undecided" | "accepted" | "rejected" | "withdrawn";
export type AnalyticsReviewIssue = "invalid_consent_choice" | "invalid_measurement_id" | "unsupported_page_url";

export interface AnalyticsReviewInput {
  simulatedConsent: unknown;
  pageUrl?: unknown;
  measurementId?: unknown;
}

interface SafePageParameters {
  page_location: string;
  page_referrer: "";
  page_title: "DubaiPoints";
}

export type ProposedMeasurementCommand =
  | {
    operation: "config";
    measurementId: string;
    parameters: SafePageParameters & {
      send_page_view: false;
      allow_google_signals: false;
      allow_ad_personalization_signals: false;
    };
  }
  | { operation: "event"; eventName: "page_view"; parameters: SafePageParameters };

export interface AnalyticsReviewPlan {
  reviewOnly: true;
  integrationInstalled: false;
  googleRequestsEnabled: false;
  choicesStored: false;
  simulatedConsent: AnalyticsReviewConsent;
  proposedConsentParameters: {
    analytics_storage: "denied" | "granted";
    ad_storage: "denied";
    ad_user_data: "denied";
    ad_personalization: "denied";
  };
  proposedMeasurementCommands: ProposedMeasurementCommand[];
  issues: AnalyticsReviewIssue[];
  status: "no_measurement_commands" | "input_not_allowed" | "sanitised_example_only";
}

/** Return a canonical allowlisted page only. Never return the unsafe input. */
export function sanitiseAnalyticsReviewPage(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 4096 || !value.length) return undefined;
  if (/[\u0000-\u001f\u007f\\]/.test(value) || /(?:^|\/)\.{1,2}(?:\/|$|[?#])/.test(value)) return undefined;
  if (value.split(/[?#]/, 1)[0].includes("%")) return undefined;
  // Absolute HTTPS canonical URLs or root-relative paths only.
  if (!value.startsWith("/") && !value.startsWith(`${ANALYTICS_REVIEW_ORIGIN}/`)) return undefined;
  if (value.startsWith("//")) return undefined;
  try {
    const url = new URL(value, ANALYTICS_REVIEW_ORIGIN);
    if (url.origin !== ANALYTICS_REVIEW_ORIGIN || url.username || url.password || !publicPaths.has(url.pathname)) return undefined;
    // Reconstruct from fixed origin + fixed allowlist; discard ALL query/hash.
    return ANALYTICS_REVIEW_ORIGIN + url.pathname;
  } catch {
    return undefined;
  }
}

function safeMeasurementId(value: unknown): string | undefined {
  return typeof value === "string" && /^G-[A-Z0-9]{10}$/.test(value) ? value : undefined;
}

/** Build an inspectable proposal. Nothing in this function executes a command. */
export function buildAnalyticsReviewPlan(input: AnalyticsReviewInput): AnalyticsReviewPlan {
  const choices: readonly unknown[] = ["undecided", "accepted", "rejected", "withdrawn"];
  const validChoice = choices.includes(input.simulatedConsent);
  const simulatedConsent = validChoice ? input.simulatedConsent as AnalyticsReviewConsent : "undecided";
  const plan: AnalyticsReviewPlan = {
    reviewOnly: true,
    integrationInstalled: false,
    googleRequestsEnabled: false,
    choicesStored: false,
    simulatedConsent,
    proposedConsentParameters: {
      analytics_storage: simulatedConsent === "accepted" ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
    proposedMeasurementCommands: [],
    issues: validChoice ? [] : ["invalid_consent_choice"],
    status: "no_measurement_commands",
  };
  if (simulatedConsent !== "accepted") return plan;

  const measurementId = safeMeasurementId(input.measurementId);
  const page = sanitiseAnalyticsReviewPage(input.pageUrl);
  if (!measurementId) plan.issues.push("invalid_measurement_id");
  if (!page) plan.issues.push("unsupported_page_url");
  if (!measurementId || !page) {
    plan.status = "input_not_allowed";
    return plan;
  }
  const parameters: SafePageParameters = { page_location: page, page_referrer: "", page_title: "DubaiPoints" };
  plan.proposedMeasurementCommands = [
    {
      operation: "config",
      measurementId,
      parameters: { ...parameters, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false },
    },
    { operation: "event", eventName: "page_view", parameters: { ...parameters } },
  ];
  plan.status = "sanitised_example_only";
  return plan;
}
