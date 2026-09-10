/**
 * Single source of truth for whether the Friday brief accepts sign-ups.
 *
 * The Buttondown form, the newsletter page copy, the homepage band and the
 * header/footer chrome all gated on `PUBLIC_BUTTONDOWN_USERNAME`
 * independently, and not with the same rule: the page and the form required
 * the value to match `/^[a-zA-Z0-9_-]+$/`, the homepage only required it to
 * be non-empty. A value with a space in it therefore made the homepage
 * announce a live list while the form stayed disabled.
 *
 * The strict rule wins here, because it is the one that decides whether a
 * reader can actually subscribe.
 *
 * Chairman ruling R3 (10 September 2026, audit F-012 / F-042 / F-043):
 * demote the chrome CTA until the list exists. Setting the environment
 * variable restores every label below without a code change.
 */
const username = (import.meta.env.PUBLIC_BUTTONDOWN_USERNAME as string | undefined)?.trim();

export const newsletterLive = Boolean(username && /^[a-zA-Z0-9_-]+$/.test(username));

export const buttondownUsername = newsletterLive ? (username as string) : null;

/** Chrome labels. Nav row first, then the footer's call to action. */
export const newsletterNavLabel = newsletterLive ? "Join brief" : "Friday brief";
export const newsletterCtaLabel = newsletterLive
  ? "Join the Friday brief"
  : "Join the launch list";
