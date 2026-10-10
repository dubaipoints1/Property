// Cinematic page stage (6 Oct 2026).
//
// The Chairman asked for every page to open like the homepage hero. Since
// the 7 Oct 2026 UX review only pages that own a licensed photograph (bank
// hubs, programmes, story articles) get the stage: a full-bleed dark band
// over that photograph, static (global.css). Directory and tool pages keep
// the plain paper head.
//
// Only licensed photographs are used as a backdrop. An AI illustration
// must carry its visible "not a photograph" label (2026-07-29 amendment),
// which a CSS background cannot do, so AI entries stay in the page body
// where StockImage labels them and the stage falls back to the default.
import { getStockEntry, isAiGenerated, type StockEntry } from "./stockManifest";

/** Licensed Pexels photograph of Dubai at night: the stage default. */
export const DEFAULT_STAGE_SLUG = "hero-dubai-night";

/** The manifest photo for `slug` if it is a licensed photograph. */
export function stagePhoto(slug?: string | null): StockEntry | undefined {
  const entry = slug ? getStockEntry(slug) : undefined;
  return entry && !isAiGenerated(entry) ? entry : undefined;
}

/** Inline style setting the stage backdrop to `slug`'s photo, or nothing
 *  (the CSS default applies). */
export function stageStyle(slug?: string | null): string | undefined {
  const entry = stagePhoto(slug);
  return entry ? `--dp-stage-img: url(/${entry.file})` : undefined;
}
