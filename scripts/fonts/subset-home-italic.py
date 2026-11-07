#!/usr/bin/env python3
"""Homepage-only same-axis italic delivery; shared/original faces remain fallback.

Offline proof tool, not a build dependency. Uses the same reviewed FontTools,
Brotli and HarfBuzz contract as subset-variable-fonts.py. No static instances.
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
from html.parser import HTMLParser

import brotli
import fontTools
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("shared_font_proof", pathlib.Path(__file__).with_name("subset-variable-fonts.py"))
PROOF = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PROOF)
WEIGHTS = [200, 300, 400, 450, 500, 600, 700, 800]
FILENAME = "newsreader-latin-wght-italic-home.woff2"


class ItalicText(HTMLParser):
    """Explicit semantic italic uses in the homepage, including below the fold.

    Not generic CSS pruning. New italic selectors require a deliberate update;
    unseen characters continue to use the unchanged shared/original fonts.
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.texts = [], []

    def handle_starttag(self, tag, attrs):
        if tag in ("meta", "link", "img", "input", "br", "hr", "source", "wbr", "area", "base", "col", "embed", "param", "track"):
            return
        classes = set((dict(attrs).get("class") or "").split())
        ancestors = set().union(*(row["classes"] for row in self.stack)) if self.stack else set()
        excluded = tag in ("script", "style", "template") or bool(self.stack and self.stack[-1]["excluded"])
        italic = bool(self.stack and self.stack[-1]["italic"]) or tag in ("em", "i")
        italic |= "n" in classes and "hp-tools" in ancestors
        italic |= tag == "h2" and "hp-close" in ancestors
        italic |= tag == "dd" and "is-word" in classes and "hp-stats" in ancestors
        self.stack.append(dict(tag=tag, classes=classes, italic=italic, excluded=excluded))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        if self.stack and self.stack[-1]["italic"] and not self.stack[-1]["excluded"]:
            text = re.sub(r"\s+", " ", data).strip()
            if text:
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
    html = (args.dist / "index.html").read_text()
    corpus = ItalicText()
    corpus.feed(html)
    if not corpus.texts or "Pay less." not in corpus.texts:
        raise ValueError("Expected complete homepage italic corpus missing")
    texts = sorted(set(corpus.texts + ["0123456789", "0 1 2 3 4 5 6 7 8 9", "00 01 02 03 04 05 06 07 08 09", "1,234.56"]))
    codepoints = sorted({ord(ch) for text in texts for ch in text} | {32})
    source = package_dir / "files/newsreader-latin-wght-italic.woff2"
    with tempfile.TemporaryDirectory(prefix="dp-home-italic-proof-") as temporary:
        folder = pathlib.Path(temporary)
        closure = PROOF.canonical_closure(codepoints, TTFont(source).getBestCmap())
        unicodes = folder / "unicodes.txt"
        unicodes.write_text(",".join(f"{cp:X}" for cp in closure) + "\n")
        output = folder / FILENAME
        subprocess.run([sys.executable, "-m", "fontTools.subset", str(source), f"--unicodes-file={unicodes}", f"--output-file={output}", *PROOF.FLAGS], check=True, capture_output=True, text=True)
        before, after, invariants = PROOF.inspect_tables(source, output, codepoints, WEIGHTS)
        shaping = PROOF.prove_shaping(args.hb_shape, before, after, folder, texts, [*texts, *PROOF.FIXTURES], WEIGHTS)
        binary = output.read_bytes()
    manifest = dict(version=1, purpose="Homepage-only semantic italic subset; shared and original variable faces retained as Unicode fallback",
        family="Newsreader Variable", style="italic", source=source.relative_to(ROOT).as_posix(), sourceVersion=package["version"],
        sourceSha256=PROOF.sha(source.read_bytes()), sourceBytes=source.stat().st_size,
        file=FILENAME, sha256=PROOF.sha(binary), bytes=len(binary),
        licence=dict(spdx="OFL-1.1", file="newsreader-OFL.txt", sha256=PROOF.sha(licence), reservedFontNamesDeclaredInSuppliedNotice=False),
        tools=dict(fontTools=fontTools.version, brotli=brotli.__version__, harfBuzz=hb_version), subsetFlags=PROOF.FLAGS,
        corpus=dict(texts=texts, textSha256=PROOF.sha(PROOF.serialise(texts)), inputCodepoints=codepoints),
        invariants=invariants, shaping=shaping)
    pending = {FILENAME: binary, "home-italic.manifest.json": PROOF.serialise(manifest)}
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
