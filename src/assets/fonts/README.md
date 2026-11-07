# Shared variable-font delivery subsets

Prepared 2026-11-06 from the already-installed Fontsource 5.3.0 packages.
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
supported 322-page body/UI corpus at weight 400, plus windows from every page,
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
