#!/usr/bin/env python3
"""Regenerate the shared, weight-variable Latin delivery subsets, proof first.

Offline developer tool, NOT a build/runtime dependency. Requires FontTools
4.68.0, Brotli 1.2.1 and hb-shape 14.2.1 in a private environment. It never
instantiates a variable axis, changes a family name or writes to dist/.
An existing production build supplies the site-wide text corpus. Original
Fontsource CSS remains the fallback for codepoints outside each precise cmap.
"""

import argparse
import hashlib
import itertools
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from html.parser import HTMLParser

import brotli
import fontTools
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont


ROOT = pathlib.Path(__file__).resolve().parents[2]
FLAGS = [
    "--flavor=woff2", "--layout-features=*", "--layout-scripts=*",
    "--hinting", "--glyph-names", "--name-IDs=*", "--name-languages=*",
    "--name-legacy", "--notdef-glyph", "--notdef-outline",
    "--recommended-glyphs", "--legacy-cmap", "--symbol-cmap",
    "--passthrough-tables", "--drop-tables=", "--legacy-kern",
    "--no-recalc-timestamp", "--no-recalc-bounds", "--no-harfbuzz-repacker",
]
FACES = [
    ("newsreader", "Newsreader Variable", "normal", [200, 300, 400, 450, 500, 600, 700, 800]),
    ("newsreader", "Newsreader Variable", "italic", [200, 300, 400, 450, 500, 600, 700, 800]),
    ("geist", "Geist Variable", "normal", [100, 200, 300, 400, 450, 500, 600, 700, 800, 900]),
]
FEATURE_CASES = [
    ("default", None),
    ("kern-ligatures-off", "kern=0,liga=0,clig=0,calt=0"),
    ("layout-on-tabular", "kern=1,liga=1,clig=1,calt=1,tnum=1"),
    ("proportional-oldstyle", "pnum=1,onum=1"),
]
FIXTURES = [
    "AV VA WA AW To Ta Te Ty Yo LT FA PA ff fi fl ffi ffl office affinity efficient",
    "DubaiPoints — Fly further. Pay less. Cards · Salary tracker · Points & miles",
    "AED 1,234.56 / 7,800 monthly; 0.5% + 2.99%; 2026–2027 (incl. VAT)",
    "0123456789 1111111111 8888888888 00.00 11.11 88.88 +−= × ÷ < > ≤ ≥",
    "‘Quoted’ “double quoted” apostrophe’s ellipsis… non-breaking\u00a0space & / |",
    "Café naïve façade coöperate Ångström Æther Œuvre café e\u0301 A\u0308 n\u0303",
    "© ® ™ † ‡ • → ← ↑ ↓ ‑ – — − ′ ″ € £ ¥ ¢ $ # @ % _ {} [] ()",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def serialise(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()


def normalise_space(text):
    return re.sub(r"\s+", " ", text).strip()


class BodyText(HTMLParser):
    """Include hidden/menu text and UI attributes; exclude executable content."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.body = False
        self.excluded = []
        self.texts = []

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.body = True
        if tag in ("script", "style", "template"):
            self.excluded.append(tag)
        if self.body and not self.excluded:
            for key, value in attrs:
                if value and key in ("aria-label", "aria-valuetext", "alt", "title", "placeholder", "value"):
                    self.add(value)

    def handle_endtag(self, tag):
        if self.excluded and self.excluded[-1] == tag:
            self.excluded.pop()
        if tag == "body":
            self.body = False

    def handle_data(self, data):
        if self.body and not self.excluded:
            self.add(data)

    def add(self, data):
        text = normalise_space(data)
        if text:
            self.texts.append(text)


def collect_corpus(dist):
    pages = sorted(dist.rglob("*.html"))
    if not pages or not (dist / "index.html").is_file():
        raise ValueError("An existing production dist/index.html and HTML corpus are required")
    texts, html_texts, representatives, page_records = set(FIXTURES), set(), set(FIXTURES), []
    for page in pages:
        parser = BodyText()
        parser.feed(page.read_text())
        html_texts.update(parser.texts)
        texts.update(parser.texts)
        # Every page contributes three deterministic body-text windows, not
        # just the homepage or an English alphabet specimen.
        joined = " ".join(parser.texts)
        for offset in (0, len(joined) // 2, max(0, len(joined) - 280)):
            representatives.add(joined[offset:offset + 280])
        page_records.append({"path": page.relative_to(dist).as_posix(), "textSha256": sha(joined.encode())})
    # Source is a safe codepoint superset of real UI strings, including island
    # labels and error states absent from initial static HTML. We do not claim
    # that source code/comments themselves are rendered prose.
    sources = []
    for directory in ("components", "layouts", "pages", "scripts"):
        for file in sorted((ROOT / "src" / directory).rglob("*")):
            if file.is_file() and file.suffix in (".astro", ".tsx", ".ts", ".mjs"):
                text = file.read_text()
                sources.append({"path": file.relative_to(ROOT).as_posix(), "sha256": sha(text.encode())})
                texts.update(re.findall(r"[^\x00-\x7f]", text))
    codepoints = set(range(32, 127))
    for text in texts:
        codepoints.update(ord(character) for character in text if ord(character) >= 32)
    all_text = sorted(texts)
    reps = sorted(representatives - {""})
    return all_text, reps, sorted(codepoints), {
        "definition": "Printable ASCII + parsed body text/UI attributes from every production HTML page + non-ASCII source UI character superset; script/style/template bodies excluded",
        "htmlPages": len(pages), "htmlTextNodesDeduplicated": len(html_texts),
        "htmlCorpusCharacters": sum(map(len, html_texts)),
        "proofStringsDeduplicated": len(all_text), "proofCorpusCharacters": sum(map(len, all_text)),
        "htmlTextSha256": sha("\n".join(all_text).encode()),
        "representativeStrings": len(reps),
        "representativePageCoverage": len(pages),
        "representativeWindowsCollected": len(pages) * 3,
        "representativeSelection": "Three 280-character windows from every page (start, midpoint, end), then deduplicated, plus explicit layout fixtures",
        "representativeTextSha256": sha("\n".join(reps).encode()),
        "pageTextRecordsSha256": sha(serialise(page_records)),
        "sourceUiFiles": len(sources), "sourceUiRecordsSha256": sha(serialise(sources)),
        "codepoints": sorted(codepoints),
    }


def ranges(codepoints):
    groups = []
    for _, group in itertools.groupby(enumerate(sorted(codepoints)), lambda pair: pair[1] - pair[0]):
        sequence = [pair[1] for pair in group]
        groups.append(f"U+{sequence[0]:04X}" + (f"-{sequence[-1]:04X}" if len(sequence) > 1 else ""))
    return ",".join(groups)


def canonical_closure(codepoints, source_cmap):
    """Keep supported NFC alternatives for all selected decomposition inputs.

    HarfBuzz normalises before GSUB. Merely retaining combining-mark outlines
    is insufficient: removing a precomposed cmap entry can change the glyph
    sequence for a supported base+mark string. Closure uses Unicode's canonical
    decomposition only (not compatibility substitutions or invented glyphs).
    """
    selected = set(codepoints) & set(source_cmap)
    while True:
        composed = {
            codepoint for codepoint in source_cmap
            if len(unicodedata.normalize("NFD", chr(codepoint))) > 1
            and all(ord(character) in selected for character in unicodedata.normalize("NFD", chr(codepoint)))
        }
        expanded = selected | composed
        if expanded == selected:
            return sorted(selected)
        selected = expanded


def axes(font):
    return [(axis.axisTag, axis.minValue, axis.defaultValue, axis.maxValue, axis.flags, axis.axisNameID) for axis in font["fvar"].axes]


def names(font):
    return sorted((item.nameID, item.platformID, item.platEncID, item.langID, item.toUnicode()) for item in font["name"].names)


def equivalent(left, right):
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        return abs(left - right) < 0.00001
    if isinstance(left, (tuple, list)) and isinstance(right, (tuple, list)):
        return len(left) == len(right) and all(equivalent(a, b) for a, b in zip(left, right))
    return left == right


def inspect_tables(source, output, codepoints, weights):
    before, after = TTFont(source), TTFont(output)
    wanted = set(codepoints) & set(before.getBestCmap())
    actual = set(after.getBestCmap())
    # FontTools' default bidi closure may add the mirrored counterpart of a
    # requested character. Preserve it, verify it, and declare the ACTUAL cmap
    # in CSS instead of silently dropping shaping closure or overstating ranges.
    if not wanted <= actual or not actual <= set(before.getBestCmap()):
        raise ValueError("Output cmap loses a requested/source glyph or invents an unsupported codepoint")
    if any(before.getBestCmap()[cp] != after.getBestCmap()[cp] for cp in actual):
        raise ValueError("cmap glyph mapping changed")
    checks = {
        "axesEqual": axes(before) == axes(after),
        "nameRecordsEqual": names(before) == names(after),
        "namedInstancesEqual": serialise([vars(item) for item in before["fvar"].instances]) == serialise([vars(item) for item in after["fvar"].instances]),
        "horizontalMetricsEqual": all(before["hmtx"].metrics[g] == after["hmtx"].metrics[g] for g in after.getGlyphOrder()),
        "lineMetricsEqual": all(getattr(before[table], key) == getattr(after[table], key) for table, keys in {
            "head": ["unitsPerEm", "flags"],
            "hhea": ["ascent", "descent", "lineGap"],
            "OS/2": ["sTypoAscender", "sTypoDescender", "sTypoLineGap", "usWinAscent", "usWinDescent", "fsSelection"],
        }.items() for key in keys),
        "hintingBytecodeEqual": all(
            getattr(getattr(before["glyf"][g], "program", None), "getBytecode", lambda: b"")()
            == getattr(getattr(after["glyf"][g], "program", None), "getBytecode", lambda: b"")()
            for g in after.getGlyphOrder()
        ),
        "globalHintingTablesEqual": all((tag in before) == (tag in after) and (tag not in before or before.getTableData(tag) == after.getTableData(tag)) for tag in ("fpgm", "prep", "cvt ", "gasp")),
    }
    for check, passed in checks.items():
        if not passed:
            raise ValueError(f"Font invariant failed: {check}")
    for weight in weights:
        old_set, new_set = before.getGlyphSet(location={"wght": weight}), after.getGlyphSet(location={"wght": weight})
        for glyph in after.getGlyphOrder():
            old_pen, new_pen = DecomposingRecordingPen(old_set), DecomposingRecordingPen(new_set)
            old_set[glyph].draw(old_pen)
            new_set[glyph].draw(new_pen)
            if not equivalent(old_pen.value, new_pen.value) or not equivalent(old_set[glyph].width, new_set[glyph].width):
                raise ValueError(f"Outline/variable advance changed at wght={weight}, {glyph}")
    return before, after, {
        **checks, "cmapEqual": True, "sourceAxes": axes(before), "outputAxes": axes(after),
        "sourceGlyphs": len(before.getGlyphOrder()), "outputGlyphs": len(after.getGlyphOrder()),
        "codepoints": sorted(actual), "unicodeRange": ranges(actual),
        "closureAddedCodepoints": sorted(actual - wanted),
        "outlineWeights": weights, "outlineGlyphWeightPairs": len(after.getGlyphOrder()) * len(weights),
        "outlinesAndVariableAdvancesEqual": True,
        "layoutTablesRetained": {tag: tag in after for tag in ("GSUB", "GPOS", "GDEF")},
    }


def supported_runs(texts, allowed):
    # The original Latin face cannot shape Arabic/emoji/etc. Those runs retain
    # the existing font fallback chain and are not falsely included as .notdef
    # "proof". Split rather than erase unsupported characters across a boundary.
    runs = set()
    for text in texts:
        run = []
        for character in text:
            if ord(character) in allowed:
                run.append(character)
            else:
                if run:
                    runs.add("".join(run))
                run = []
        if run:
            runs.add("".join(run))
    return sorted(run for run in runs if run.strip())


def shape_pair(hb, before, after, source_ttf, subset_ttf, text_file, weight, features):
    common = ["--shapers=ot", "--font-funcs=ot", "--direction=ltr", "--script=Latn", "--language=en", "--verify", "--no-glyph-names", "--show-extents", "--output-format=json", f"--variations=wght={weight}", f"--text-file={text_file}"]
    if features:
        common.append(f"--features={features}")
    processes = [subprocess.Popen([hb, str(file), *common], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for file in (source_ttf, subset_ttf)]
    glyph_orders = [before.getGlyphOrder(), after.getGlyphOrder()]
    lines, glyphs = 0, 0
    try:
        for left, right in itertools.zip_longest(processes[0].stdout, processes[1].stdout):
            if left is None or right is None:
                raise ValueError("HarfBuzz result line count differs")
            pair = [json.loads(left), json.loads(right)]
            for records, order in zip(pair, glyph_orders):
                for glyph in records:
                    glyph["g"] = order[int(glyph["g"])]
            if pair[0] != pair[1]:
                sample = text_file.read_text().splitlines()[lines]
                mismatch = next(((a, b) for a, b in itertools.zip_longest(*pair) if a != b), None)
                raise ValueError(f"HarfBuzz shaping differs at wght={weight}, features={features or 'default'}, corpus line {lines + 1}: {sample!r}; first difference={mismatch}")
            lines += 1
            glyphs += len(pair[0])
        for process in processes:
            error = process.stderr.read()
            if process.wait() != 0:
                raise ValueError(f"HarfBuzz failed: {error[:500]}")
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()
                process.wait()
    return {"strings": lines, "glyphs": glyphs}


def prove_shaping(hb, before, after, folder, all_text, representatives, weights):
    before.flavor = after.flavor = None
    original_ttf, subset_ttf = folder / "original.ttf", folder / "subset.ttf"
    before.save(original_ttf)
    after.save(subset_ttf)
    allowed = set(after.getBestCmap())
    cmap_probe = " ".join(chr(codepoint) for codepoint in sorted(allowed))
    full_runs = supported_runs([*all_text, cmap_probe], allowed)
    representative_runs = supported_runs([*representatives, cmap_probe], allowed)
    full_file, representative_file = folder / "full.txt", folder / "representative.txt"
    full_file.write_text("\n".join(full_runs) + "\n")
    representative_file.write_text("\n".join(representative_runs) + "\n")
    cases = []
    print(f"  full corpus: {len(full_runs)} strings at wght=400", flush=True)
    cases.append({"corpus": "all-supported-body-ui", "weight": 400, "features": "default", **shape_pair(hb, before, after, original_ttf, subset_ttf, full_file, 400, None)})
    for weight in weights:
        for name, features in FEATURE_CASES:
            cases.append({"corpus": "every-page-representatives-and-layout-fixtures", "weight": weight, "features": name, **shape_pair(hb, before, after, original_ttf, subset_ttf, representative_file, weight, features)})
    return {
        "engine": "HarfBuzz OpenType shaper/font funcs, Latin/en, UPEM units",
        "compared": "Glyph identity (GID normalised by name), clusters, x/y advances, x/y offsets and glyph extents; source and subset SFNT converted losslessly from delivery WOFF2",
        "cases": cases, "allEqual": True,
        "stringsCompared": sum(case["strings"] for case in cases),
        "glyphsCompared": sum(case["glyphs"] for case in cases),
        "limits": "Complete supported deduplicated text corpus at wght=400; representative strings from every page at listed weights/features. Not proof for every possible string/feature/continuous weight or browser rasteriser. Original faces remain fallback for all other codepoints.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=pathlib.Path, default=ROOT / "dist")
    parser.add_argument("--out-dir", type=pathlib.Path, default=ROOT / "src/assets/fonts")
    parser.add_argument("--hb-shape", default=shutil.which("hb-shape"))
    parser.add_argument("--check", action="store_true", help="Regenerate privately, prove parity and require output files to match; do not write")
    args = parser.parse_args()
    if fontTools.version != "4.68.0" or brotli.__version__ != "1.2.1":
        raise ValueError("Use the documented private FontTools 4.68.0 / Brotli 1.2.1 environment")
    if not args.hb_shape:
        raise ValueError("Installed hb-shape is required for actual shaping proof")
    hb_version = subprocess.run([args.hb_shape, "--version"], check=True, capture_output=True, text=True).stdout.splitlines()[0]
    if "14.2.1" not in hb_version:
        raise ValueError(f"Re-review shaping-tool drift before regeneration: {hb_version}")
    all_text, representatives, codepoints, corpus = collect_corpus(args.dist.resolve())
    manifest = {"version": 1, "purpose": "Shared same-axis variable Latin delivery subsets; original Fontsource faces retained as Unicode fallback", "tools": {"fontTools": fontTools.version, "brotli": brotli.__version__, "harfBuzz": hb_version}, "subsetFlags": FLAGS, "corpus": corpus, "faces": []}
    pending = {}
    with tempfile.TemporaryDirectory(prefix="dubaipoints-font-proof-") as temporary:
        temporary = pathlib.Path(temporary)
        for family, css_family, style, weights in FACES:
            package_dir = ROOT / "node_modules/@fontsource-variable" / family
            package = json.loads((package_dir / "package.json").read_text())
            if package["version"] != "5.3.0" or package["license"] != "OFL-1.1":
                raise ValueError("Fontsource version/licence drift requires a fresh source/licence review")
            licence = (package_dir / "LICENSE").read_bytes()
            notice = licence.decode().split("This Font Software is licensed", 1)[0]
            if re.search(r"reserved\s+font\s+name", notice, re.I):
                raise ValueError("A reserved font name declaration requires review before retaining family names")
            source = package_dir / "files" / f"{family}-latin-wght-{style}.woff2"
            filename = f"{family}-latin-wght-{style}-site.woff2"
            folder = temporary / f"{family}-{style}"
            folder.mkdir()
            source_cmap = TTFont(source).getBestCmap()
            closure = canonical_closure(codepoints, source_cmap)
            unicode_file = folder / "unicodes.txt"
            unicode_file.write_text(",".join(f"{code:X}" for code in closure) + "\n")
            output = folder / filename
            print(f"Checking {family} {style} variable subset", flush=True)
            subprocess.run([sys.executable, "-m", "fontTools.subset", str(source), f"--unicodes-file={unicode_file}", f"--output-file={output}", *FLAGS], check=True, capture_output=True, text=True)
            before, after, invariants = inspect_tables(source, output, codepoints, weights)
            invariants["canonicalClosureAddedCodepoints"] = sorted(set(closure) - set(codepoints))
            shaping = prove_shaping(args.hb_shape, before, after, folder, all_text, representatives, weights)
            source_bytes, output_bytes = source.read_bytes(), output.read_bytes()
            pending[filename] = output_bytes
            pending[f"{family}-OFL.txt"] = licence
            manifest["faces"].append({
                "family": css_family, "style": style,
                "source": source.relative_to(ROOT).as_posix(), "sourcePackage": package["name"], "sourceVersion": package["version"],
                "sourceUrl": f"https://cdn.jsdelivr.net/npm/{package['name']}@{package['version']}/files/{source.name}",
                "sourceSha256": sha(source_bytes), "sourceBytes": len(source_bytes),
                "file": filename, "sha256": sha(output_bytes), "bytes": len(output_bytes),
                "licence": {"spdx": "OFL-1.1", "file": f"{family}-OFL.txt", "sha256": sha(licence), "source": (package_dir / "LICENSE").relative_to(ROOT).as_posix(), "reservedFontNamesDeclaredInSuppliedNotice": False},
                "invariants": invariants, "shaping": shaping,
            })
            print(f"  PASS {len(source_bytes)} -> {len(output_bytes)} bytes; {shaping['stringsCompared']} strings / {shaping['glyphsCompared']} glyphs", flush=True)
    manifest["summary"] = {"sourceBytes": sum(face["sourceBytes"] for face in manifest["faces"]), "subsetBytes": sum(face["bytes"] for face in manifest["faces"]), "allShapingEqual": all(face["shaping"]["allEqual"] for face in manifest["faces"])}
    manifest["summary"]["savingBytes"] = manifest["summary"]["sourceBytes"] - manifest["summary"]["subsetBytes"]
    pending["font-subsets.manifest.json"] = serialise(manifest)
    # No integration artefact is written until every face passes every check.
    if args.check:
        for filename, data in pending.items():
            if (args.out_dir / filename).read_bytes() != data:
                raise ValueError(f"Regenerated output differs: {filename}")
    else:
        args.out_dir.mkdir(parents=True, exist_ok=True)
        for filename, data in pending.items():
            (args.out_dir / filename).write_bytes(data)
    print(json.dumps(manifest["summary"]), flush=True)


if __name__ == "__main__":
    main()
