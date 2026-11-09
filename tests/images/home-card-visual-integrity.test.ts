import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@astrojs/compiler";
import sharp from "sharp";
import { getCardArt } from "../../src/lib/cardArt.ts";

// These are Astro-source/asset contracts, not a claim that either conditional
// branch has rendered in a browser. A separate disposable missing-art build
// and viewport inspection remain part of release QA. Source URL/dimensions do
// not replace visual acceptance of the issuer pixels. No issuer/network fetch.
const home = readFileSync("src/pages/index.astro", "utf8");
const livePlus = "hsbc-live-plus";
const acceptedImage = "https://www.hsbc.ae/content/dam/hsbc/en/images/16-9/14248-hsbc-live-plus-visa-signature-vertical-card-face-800x450.jpg";
const acceptedPage = "https://www.hsbc.ae/credit-cards/compare/live-plus-credit-card/";
const rejectedImage = "https://www.hsbc.ae/content/dam/hsbc/en/images/16-9/13903-live-plus-card-01-signature-red-1-generic-2000x1125.jpg";

type Attribute = { name: string; kind: string; value: string };
type Node = { type: string; name?: string; value?: string; attributes?: Attribute[]; children?: Node[] };
type Located = { node: Node; ancestors: Node[] };

function locate(root: Node, predicate: (node: Node) => boolean, ancestors: Node[] = []): Located[] {
  return [
    ...(predicate(root) ? [{ node: root, ancestors }] : []),
    ...(root.children ?? []).flatMap(child => locate(child, predicate, [...ancestors, root])),
  ];
}

function attribute(node: Node, name: string): Attribute | undefined {
  const matches = (node.attributes ?? []).filter(item => item.name === name);
  assert.ok(matches.length <= 1, `duplicate ${name} attribute`);
  return matches[0];
}

function classNames(node: Node): string[] {
  const value = attribute(node, "class");
  return value?.kind === "quoted" ? value.value.split(/\s+/).filter(Boolean) : [];
}

function text(node: Node): string {
  return node.type === "text" ? node.value ?? "" : (node.children ?? []).map(text).join("");
}

async function tree(source: string): Promise<Node> {
  return (await parse(source)).ast as unknown as Node;
}

function missingArtContract(root: Node): Located {
  const panels = locate(root, node => attribute(node, "data-home-card-image")?.value === "unavailable");
  assert.equal(panels.length, 1, "the no-art branch must have one explicit unavailable panel");
  const panel = panels[0];
  assert.equal(panel.node.name, "span");
  assert.deepEqual(classNames(panel.node), ["hp-tile", "is-missing"]);
  assert.equal(attribute(panel.node, "data-home-card-image")?.kind, "quoted");

  // A hidden ancestor would make the honest disclosure inaccessible too.
  for (const node of [...panel.ancestors, ...locate(panel.node, () => true).map(item => item.node)]) {
    for (const name of ["aria-hidden", "hidden", "inert"]) {
      assert.equal(attribute(node, name), undefined, `unavailable disclosure must not have ${name}`);
    }
  }
  const contents = locate(panel.node, node => node.type !== "text").map(item => item.node);
  assert.deepEqual(contents.map(node => node.name), ["span", "span", "span"], "no drawn chip, network mark, image, SVG or canvas in the missing-art branch");
  assert.deepEqual(contents.slice(1).map(classNames), [["hp-missing-label"], ["hp-missing-hint"]]);
  assert.deepEqual(contents.slice(1).map(node => text(node).trim().replace(/\s+/g, " ")), ["Issuer card image unavailable", "Read the card review →"]);
  for (const node of contents) {
    const allowed = node === panel.node ? ["class", "data-home-card-image"] : ["class"];
    assert.deepEqual((node.attributes ?? []).map(item => item.name).sort(), allowed.sort(), "no style/tone/network/generated-card attributes");
  }
  assert.equal(locate(panel.node, node => node.type === "expression").length, 0, "missing art is a static disclosure, not a plausible product face");

  const condition = [...panel.ancestors].reverse().find(node => node.type === "expression");
  assert.ok(condition, "missing art must belong to the actual artwork conditional");
  const conditionText = (condition.children ?? []).filter(node => node.type === "text").map(node => node.value ?? "").join("");
  assert.match(conditionText, /^c\.art\s*\?\s*\([\s\S]*\)\s*:\s*\([\s\S]*\)$/);
  const branches = (condition.children ?? []).filter(node => node.type === "element");
  assert.equal(branches.length, 2);
  assert.deepEqual(classNames(branches[0]), ["hp-tile", "is-art"]);
  assert.equal(branches[1], panel.node, "the unavailable panel must be the no-art branch, not detached decorative copy");
  return panel;
}

function rules(source: string, selector: string): string[] {
  const styles = source.match(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/)?.[1]
    .replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(styles, "homepage style block missing");
  return [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].trim().split(",").some(item => item.trim() === selector))
    .map(match => match[2]);
}

function declaration(source: string, selector: string, property: string): string {
  const values = rules(source, selector).flatMap(block => block.split(";")
    .map(item => item.trim()).filter(item => item.startsWith(`${property}:`))
    .map(item => item.slice(property.length + 1).trim()));
  assert.ok(values.length, `${selector}: missing ${property}`);
  return values.at(-1)!;
}

function ratio(value: string): number {
  assert.match(value, /^\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?$/);
  const [width, height = "1"] = value.split("/");
  return Number(width) / Number(height);
}

function containedSlotContract(source: string): void {
  const slotRatio = ratio(declaration(source, ".hp-tile", "aspect-ratio"));
  assert.ok(slotRatio >= 1.4 && slotRatio <= 1.8, "uniform landscape slots, not a landscape-shaped crop of portrait art");
  assert.equal(ratio(declaration(source, ".hp-tile.is-art", "aspect-ratio")), slotRatio);
  assert.equal(declaration(source, ".hp-tile", "width"), "100%");
  const maximum = declaration(source, ".hp-tile", "max-width");
  assert.match(maximum, /^\d+px$/);
  assert.ok(parseFloat(maximum) >= 320 && parseFloat(maximum) <= 480, "art slot remains bounded on wide displays");
  assert.equal(declaration(source, ".hp-tile", "min-width"), "0");
  assert.equal(declaration(source, ".hp-tile", "box-sizing"), "border-box");
  for (const property of ["width", "height", "max-width", "max-height"]) {
    assert.equal(declaration(source, ".hp-tile.is-art img", property), "100%");
  }
  assert.equal(declaration(source, ".hp-tile.is-art img", "object-fit"), "contain");
  assert.equal(declaration(source, ".hp-tile.is-art img", "min-height"), "0");
  assert.equal(declaration(source, ".hp-tile.is-art img", "min-width"), "0");
  assert.equal(declaration(source, ".hp-tile.is-missing", "display"), "flex");
  assert.equal(declaration(source, ".hp-tile.is-missing", "background"), "var(--shade-1)");
  assert.equal(declaration(source, ".hp-tile.is-missing::after", "display"), "none");
  assert.equal(declaration(source, ".hp-verified", "display"), "block");
  for (const selector of [".hp-tile.is-missing", ".hp-missing-label", ".hp-missing-hint", ".hp-verified"]) {
    assert.doesNotMatch(rules(source, selector).join(";"), /(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:[;\s]|$)|font-size\s*:\s*0(?:[;\s]|$)|color\s*:\s*transparent|clip-path\s*:\s*inset\((?:50|100)%)/);
  }
  assert.doesNotMatch(source, /\.hp-(?:chip|network)\b|\.hp-tile\.(?:gold|navy|green)\b/, "retired fake-face styling must not return");
}

test("homepage no-art source branch is visible, explicit and contains no synthetic card face", async () => {
  missingArtContract(await tree(home));
});

test("unresolved slugs remain unresolved independently of today's homepage card selection", () => {
  const sentinel = "regression-deliberately-no-issuer-card-art";
  const manifest = JSON.parse(readFileSync("data/card-art/manifest.json", "utf8"));
  assert.equal(Object.hasOwn(manifest, sentinel), false);
  assert.equal(getCardArt(sentinel), undefined, "the resolver must not invent or borrow another product's image");
  assert.match(home, /art:\s*getCardArt\(c\.slug\)/);
});

test("missing-art source guard rejects hidden disclosure and reintroduced chip/network/tone faces", async () => {
  const opening = '<span class="hp-tile is-missing" data-home-card-image="unavailable">';
  assert.ok(home.includes(opening), "sentinels must actually alter the checked branch");
  const mutations = [
    home.replace(opening, opening.replace(">", ' aria-hidden="true">')),
    home.replace(opening, opening + '<span class="hp-chip">Chip</span>'),
    home.replace(opening, opening + '<span class="hp-network">VISA</span>'),
    home.replace(opening, '<span class={`hp-tile ${c.tone}`} data-home-card-image="unavailable">'),
    home.replace("Issuer card image unavailable", "HSBC Live+"),
  ];
  for (const source of mutations) {
    assert.notEqual(source, home);
    await assert.rejects(async () => missingArtContract(await tree(source)));
  }
});

test("real-art source uses resolver path, intrinsic dimensions, descriptive alt and visible issuer credit", async () => {
  const root = await tree(home);
  const art = locate(root, node => classNames(node).includes("is-art") && classNames(node).includes("hp-tile"));
  assert.equal(art.length, 1);
  const images = locate(art[0].node, node => node.name === "img");
  assert.equal(images.length, 1);
  const image = images[0].node;
  for (const [name, value] of [["src", "`/${c.art.file}`"], ["width", "c.art.width"], ["height", "c.art.height"], ["alt", "`${c.name} card, as shown by ${c.bankName}`"]]) {
    assert.equal(attribute(image, name)?.kind, "expression", name);
    assert.equal(attribute(image, name)?.value, value, name);
  }
  assert.equal(attribute(image, "aria-hidden"), undefined);
  const credit = locate(root, node => classNames(node).includes("hp-verified"));
  assert.equal(credit.length, 1);
  assert.match(text(credit[0].node), /c\.art\s*\?\s*` · card image: \$\{c\.bankName\}`\s*:\s*""/);
  assert.equal(attribute(credit[0].node, "aria-hidden"), undefined);
  assert.match(home, /verified:\s*new Date\(c\.lastVerified\)/);
  assert.doesNotMatch(home, /verified:\s*[^\n]*(?:fetchedAt|c\.art)/, "image sourcing must not promote financial-verification dates");
});

test("portrait and landscape artwork share bounded slots and retain contain geometry in source CSS", () => {
  containedSlotContract(home);
  for (const source of [
    home.replace("object-fit: contain", "object-fit: cover"),
    home.replace("max-width: 420px", "max-width: 100vw"),
    home.replace("aspect-ratio: 1.586", "aspect-ratio: 0.63"),
  ]) {
    assert.notEqual(source, home);
    assert.throws(() => containedSlotContract(source));
  }
});

test("accepted Live+ art is the exact HSBC face, with pipeline file and truthful portrait dimensions", async () => {
  const sources = JSON.parse(readFileSync("data/card-art/sources.json", "utf8"));
  const manifest = JSON.parse(readFileSync("data/card-art/manifest.json", "utf8"));
  const source = sources[livePlus], art = manifest[livePlus];
  assert.ok(source, "Live+ issuer source record required");
  assert.equal(source.url, acceptedImage);
  assert.equal(source.page, acceptedPage);
  assert.equal(source.rejectedUrl, rejectedImage, "the rejected lifestyle hero remains rejected");
  assert.equal(source.crop, undefined, "only the accepted pipeline trim/resize, no unreviewed crop");
  assert.ok(art, "Live+ must be fetched by the existing pipeline before this release can pass");
  assert.equal(art.url, acceptedImage);
  assert.equal(art.page, acceptedPage);
  assert.equal(art.alt, source.alt);
  assert.notEqual(art.url, rejectedImage);
  assert.equal(new URL(art.url).hostname, "www.hsbc.ae");
  assert.equal(new URL(art.page).hostname, "www.hsbc.ae");
  assert.equal(art.file, `images/cards/${livePlus}.webp`);
  assert.deepEqual(getCardArt(livePlus), art);
  assert.match(art.fetchedAt, /^\d{4}-\d{2}-\d{2}$/, "image date is provenance only, not card-terms verification");
  const image = await sharp(`public/${art.file}`, { failOn: "error" }).metadata();
  assert.equal(image.format, "webp");
  assert.equal(image.width, art.width);
  assert.equal(image.height, art.height);
  assert.ok(art.width >= 200 && art.width <= 900);
  assert.ok(art.height > art.width, "the accepted face stays portrait; do not stretch it to landscape");
});
