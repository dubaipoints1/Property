#!/usr/bin/env python3
"""Homepage-only same-axis normal delivery; shared/original faces stay fallback.

Offline proof tool, not a build dependency. No CSS pruning, static instances,
font-family/axis changes, network access or writes to dist.
"""
import argparse
import importlib.util
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import brotli
import fontTools
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("shared_font_proof", pathlib.Path(__file__).with_name("subset-variable-fonts.py"))
PROOF = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PROOF)
WEIGHTS = [200, 300, 400, 450, 500, 600, 700, 800]
FILENAME = "newsreader-latin-wght-normal-home.woff2"


class HomeText(PROOF.BodyText):
    """Conservative normal-face corpus: every homepage body/UI text node.

    Hidden navigation, all goal panels and below-the-fold text are included,
    even when they use another face. Do not normalise Unicode whitespace:
    NBSP/narrow spaces in source text must not fall through to a second file.
    Only HTML control whitespace is flattened for HarfBuzz's line input.
    """
    def add(self, data):
        text = re.sub(r"[\r\n\t\f]+", " ", data)
        if text.strip(" "):
            self.texts.append(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=pathlib.Path, default=ROOT / "dist")
    parser.add_argument("--out-dir", type=pathlib.Path, default=ROOT / "src/assets/fonts")
    parser.add_argument("--hb-shape", default=shutil.which("hb-shape"))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if fontTools.version != "4.68.0" or brotli.__version__ != "1.2.1" or not args.hb_shape:
        raise ValueError("Use reviewed FontTools4.68.0/Brotli1.2.1 and hb-shape14.2.1")
    hb_version = subprocess.run([args.hb_shape, "--version"], check=True, capture_output=True, text=True).stdout.splitlines()[0]
    if "14.2.1" not in hb_version:
        raise ValueError("HarfBuzz version drift requires review")
    package_dir = ROOT / "node_modules/@fontsource-variable/newsreader"
    package = json.loads((package_dir / "package.json").read_text())
    licence = (package_dir / "LICENSE").read_bytes()
    notice = licence.decode().split("This Font Software is licensed", 1)[0]
    if package["version"] != "5.3.0" or package["license"] != "OFL-1.1" or re.search(r"reserved\s+font\s+name", notice, re.I):
        raise ValueError("Source/licence drift requires review")
    html = (args.dist / "index.html").read_bytes()
    corpus = HomeText()
    corpus.feed(html.decode("utf8"))
    if corpus.body or not corpus.texts or not any(text.strip(" ") == "Fly further." for text in corpus.texts):
        raise ValueError("Expected complete homepage body and heading corpus missing")
    # Retain printable ASCII for changing names/counts/controls. Every other
    # requested codepoint is observed in the actual built homepage, not an
    # assumed Latin block or a CSS coverage guess. Shared/original fallbacks
    # retain all other characters; future content requires a fresh proof.
    texts = sorted(set(corpus.texts + ["0123456789", "0 1 2 3 4 5 6 7 8 9", "1,234.56"]))
    codepoints = sorted(set(range(32, 127)) | {ord(ch) for text in texts for ch in text if ord(ch) >= 32})
    source = package_dir / "files/newsreader-latin-wght-normal.woff2"
    with tempfile.TemporaryDirectory(prefix="dp-home-normal-proof-") as temporary:
        folder = pathlib.Path(temporary)
        closure = PROOF.canonical_closure(codepoints, TTFont(source).getBestCmap())
        unicodes = folder / "unicodes.txt"
        unicodes.write_text(",".join(f"{cp:X}" for cp in closure) + "\n")
        output = folder / FILENAME
        subprocess.run([sys.executable, "-m", "fontTools.subset", str(source), f"--unicodes-file={unicodes}", f"--output-file={output}", *PROOF.FLAGS], check=True, capture_output=True, text=True)
        before, after, invariants = PROOF.inspect_tables(source, output, codepoints, WEIGHTS)
        invariants["canonicalClosureAddedCodepoints"] = sorted(set(closure) - set(codepoints))
        shaping = PROOF.prove_shaping(args.hb_shape, before, after, folder, texts, [*texts, *PROOF.FIXTURES], WEIGHTS)
        # The shared engine's labels describe a site-wide proof. This invocation
        # has exactly one homepage, so record its narrower evidence honestly.
        for case in shaping["cases"]:
            if case["corpus"] == "every-page-representatives-and-layout-fixtures":
                case["corpus"] = "homepage-body-ui-and-layout-fixtures"
        shaping["limits"] = "Complete supported deduplicated homepage body/UI text at wght=400; the same full homepage text, supported cmap and layout fixtures at listed weights/features. Not proof for every possible string/feature/continuous weight or browser rasteriser. Shared/original faces remain fallback for all other codepoints, including unseen diacritics."
        binary = output.read_bytes()
    manifest = dict(version=1, purpose="Homepage-only conservative body/UI normal subset; shared and original variable faces retained as Unicode fallback",
        family="Newsreader Variable", style="normal", source=source.relative_to(ROOT).as_posix(), sourceVersion=package["version"],
        sourceUrl=f"https://cdn.jsdelivr.net/npm/{package['name']}@{package['version']}/files/{source.name}",
        sourceSha256=PROOF.sha(source.read_bytes()), sourceBytes=source.stat().st_size,
        file=FILENAME, sha256=PROOF.sha(binary), bytes=len(binary),
        licence=dict(spdx="OFL-1.1", file="newsreader-OFL.txt", source=(package_dir / "LICENSE").relative_to(ROOT).as_posix(),
            sha256=PROOF.sha(licence), reservedFontNamesDeclaredInSuppliedNotice=False),
        tools=dict(fontTools=fontTools.version, brotli=brotli.__version__, harfBuzz=hb_version), subsetFlags=PROOF.FLAGS,
        corpus=dict(definition="All built homepage body/UI text (including hidden navigation, goal panels and lower sections), excluding script/style/template; Unicode spaces preserved; complete printable ASCII retained",
            htmlFile="index.html", htmlSha256=PROOF.sha(html), htmlBytes=len(html),
            texts=texts, textSha256=PROOF.sha(PROOF.serialise(texts)), inputCodepoints=codepoints,
            unicodeWhitespacePreserved=True, nbSpaceCount=sum(text.count("\u00a0") for text in texts)),
        invariants=invariants, shaping=shaping)
    pending = {FILENAME: binary, "home-normal.manifest.json": PROOF.serialise(manifest)}
    if args.check:
        for filename, data in pending.items():
            if (args.out_dir / filename).read_bytes() != data:
                raise ValueError(f"Regenerated output differs: {filename}")
    else:
        args.out_dir.mkdir(parents=True, exist_ok=True)
        for filename, data in pending.items():
            (args.out_dir / filename).write_bytes(data)
    print(json.dumps(dict(bytes=len(binary), unicodeRange=invariants["unicodeRange"], strings=shaping["stringsCompared"], glyphs=shaping["glyphsCompared"], allEqual=shaping["allEqual"])), flush=True)


if __name__ == "__main__":
    main()
