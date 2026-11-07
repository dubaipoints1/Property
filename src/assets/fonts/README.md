# Shared variable-font delivery subsets

Prepared 2026-11-06 from the already-installed Fontsource 5.3.0 packages.
Corpus proof refreshed 2026-11-07 against the latest frozen 339-page build,
including comparison-artwork/copy, guide, cost/benefit, held-data consumer,
metadata and public trust-copy corrections; the
five shared/home delivery binaries and their exact character ranges are
unchanged. This records a local proof, not a hosted release or visual sign-off.
The final6 renewal covers 339 pages and 17,269 deduplicated HTML text nodes;
the homepage-normal corpus has 308 strings. Its 86,586-byte compiled homepage
has SHA-256 `d0076eb1dcfe4e601b7a644254ebc9b95324e6a52c528474b5844ca6058b9ef6`.
All three generators reproduce the integrated files exactly with `--check`.
Newsreader normal/italic retain the complete **wght 200–800** axis; Geist normal
retains **wght 100–900**. These are subsets, not static instances or new fonts.
The original Fontsource stylesheets remain the fallback for other characters.
The manifest-derived CSS declares the actual output cmap, including canonical and
FontTools bidi/layout closure; it never advertises a whole Unicode block that
the smaller file cannot render. Families and `font-display: swap` are unchanged.

## Source and licence

- `@fontsource-variable/newsreader@5.3.0`, original project:
  https://github.com/productiontype/Newsreader
- `@fontsource-variable/geist@5.3.0`, original project:
  https://github.com/vercel/geist-font
- Both supplied notices license modification/embedding/redistribution under
  SIL Open Font License 1.1. Neither supplied copyright notice declares a
  Reserved Font Name. Exact notices are copied as `newsreader-OFL.txt` and
  `geist-OFL.txt`; the font name/copyright/licence records are preserved too.
- `font-subsets.manifest.json` records exact package/source URLs, source/output
  SHA-256 and byte sizes, licence hashes, flags, character ranges and proof.
  Package, licence or tool drift requires review before regeneration.

The complete notices already ship from the existing public directory at
https://dubaipoints.ae/licenses/fonts/newsreader-OFL.txt and
https://dubaipoints.ae/licenses/fonts/geist-OFL.txt. Those public files and their
build copies must remain byte-identical to the supplied notices. The new
`src/assets/fonts/` copies are provenance records, not a claim that Vite emits
unreferenced text assets. Upstream binary copyright/licence-URL metadata is
preserved; a full OFL text entry is not invented inside the font binaries.

These files remain OFL-1.1, not the repository's general code licence. They
are bundled for the website, not sold separately or endorsed by their authors.

## Regeneration (offline; not a build/runtime dependency)

Use a **private** Python environment with FontTools 4.68.0 and Brotli 1.2.1,
and an installed `hb-shape` 14.2.1. Do not install these into the application
or add a dependency merely to run the site. After a normal production build:

```sh
/path/to/private/venv/bin/python scripts/fonts/subset-variable-fonts.py --hb-shape /path/to/hb-shape
```

`--dist` accepts an existing build directory; `--out-dir` can keep an experiment
private. `--check` regenerates privately, repeats the proof and requires exact
existing WOFF2, notice and JSON-manifest bytes without writing. It also compares corpus metadata, so
an intervening page/source edit may require an explicit regeneration/review.
The utility never writes to `dist/` or installs dependencies.

The utility emits three WOFF2 files, two source notices and the JSON manifest;
it does not emit the CSS or URL module. The CSS's manifest-derived ranges and
the module/preload integration are checked separately by the Node guards.

The repertoire is shared across the whole site: printable ASCII, every parsed
production-page text/UI attribute, a source-UI non-ASCII superset, and explicit
layout fixtures. It is not a homepage-only subset. An unseen character still
uses the original faces; new content does not silently become a missing glyph.

## Bounded parity proof

Every requested supported cmap entry and every output entry is checked against
the original. Canonical-composition closure is essential: without a retained
precomposed cmap entry HarfBuzz can shape a supported base+mark sequence
otherwise. All variable axes/names/instances, retained hinting/advances, line
metrics and retained-glyph outlines at the recorded weights are compared.

Installed HarfBuzz performs a real OpenType shaping comparison on lossless
private SFNT conversions of source/output WOFF2: the complete deduplicated
supported 339-page body/UI corpus at weight 400, plus windows from every page,
all output cmap entries and kerning/ligature/mark/numeric fixtures at the listed
endpoints/intermediate weights. Default, disabled kerning/ligatures, enabled
layout/tabular and proportional/oldstyle feature cases are compared. Glyph
identity (not renumbered GIDs), clusters, advances, offsets and extents must
match **exactly**. Nothing is emitted until every face passes.

This is evidence for the recorded corpus/weights/features, not a claim about
every possible string or weight, all scripts, browser rasterisation or a
Lighthouse score. Actual rendered before/after and hosted mobile performance
checks remain separate release gates. CI's Node guards check the recorded
source/output/licence hashes and integration contract without requiring a
Python/font tool installation on every build.

## Homepage-only italic delivery

`home-italic.manifest.json` and `newsreader-latin-wght-italic-home.woff2` add
a route-specific semantic italic repertoire without changing the above shared
faces. `scripts/fonts/subset-home-italic.py` uses the same reviewed toolchain,
flags, source notice, complete wght200–800 axis and real table/shaping proof.
It parses all explicit homepage italic uses, including lower headings, the
whole closing heading, tool numbers and word statistics; digits are retained
for changing counts. Regenerate/check it after the final homepage build:

```sh
/path/to/private/venv/bin/python scripts/fonts/subset-home-italic.py --hb-shape /path/to/hb-shape
/path/to/private/venv/bin/python scripts/fonts/subset-home-italic.py --hb-shape /path/to/hb-shape --check
```

The generated exact cmap is declared only by the homepage's route stylesheet,
after the shared faces, and its matching URL alone is preloaded on `/`.
Interiors still use the shared italic on demand; unseen characters fall back
to shared/original fonts. The semantic selector list is explicit, not a CSS
coverage optimiser: a new italic selector requires review. This proof is
bounded by its recorded corpus/weights/features, not universal raster parity.

## Homepage-only normal delivery

`home-normal.manifest.json` and `newsreader-latin-wght-normal-home.woff2`
retain the same Newsreader normal source, names, complete wght200–800 axis,
metrics, hinting, layout and supplied OFL notice. The route stylesheet adds
the exact generated cmap after the shared declarations. On `/`, its URL
**replaces**, rather than supplements, the shared normal preload. Home still
has three font preloads (home normal, existing home italic, shared Geist);
interiors retain their two shared normal preloads and on-demand italic.

`scripts/fonts/subset-home-normal.py` conservatively collects every built
homepage body/UI text node and supported UI attribute, including hidden
navigation, all goal panels and lower sections. Printable ASCII is retained
for changing names, counts and controls. Only HTML control whitespace is
flattened for the line-based proof: ordinary spaces, NBSP and other Unicode
spaces remain intact. The requested repertoire comes from this recorded
corpus, not a guessed Latin block or a CSS coverage optimiser. Canonical
composition closure uses the source font's actual cmap. Shared and original
faces remain available for unseen diacritics and every other character;
unsupported source-font symbols retain the existing fallback chain.

After the final content build, regenerate and check it with the same private
toolchain (no application dependency or network retrieval):

```sh
/path/to/private/venv/bin/python scripts/fonts/subset-home-normal.py --hb-shape /path/to/hb-shape
/path/to/private/venv/bin/python scripts/fonts/subset-home-normal.py --hb-shape /path/to/hb-shape --check
```

The manifest records the input HTML hash, exact raw-space-preserving text
corpus, source/output/licence hashes, table/outline invariants and real
HarfBuzz comparisons. All retained glyph outlines are compared at eight
weights, including 450. The complete supported homepage corpus is shaped at
400; that same corpus, cmap and layout fixtures are also compared at all
eight weights and four feature settings. Glyph identities, clusters,
advances, offsets and extents must match exactly. Unsupported characters are
split into fallback runs, never erased across a shaping boundary or counted
as a successful missing-glyph comparison.

The initial 2026-11-07 proof against the existing, **interim** build produces
35,584 bytes rather than the shared normal file's 47,308: 11,724 bytes
(11.45 KiB) smaller locally. Final content changes require regeneration and
review; these raw file sizes are not measured network savings, a Lighthouse
result, browser rasterisation proof or release approval.

The latest frozen 339-page proof on 2026-11-07 retains those same bytes
and ranges. Its homepage corpus includes four NBSPs and is bound to the
exact built HTML hash in the manifest. Regeneration and exact `--check` are
separate checks; a later rebuild that changes HTML bytes requires the
home-normal corpus identity to be regenerated and checked again even when
the font binary, text repertoire and CSS remain unchanged. All three proof
families require renewal if the built content or source UI repertoire changes.
