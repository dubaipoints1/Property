import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { cardComparisonRows, type CardForComparison } from "../../src/lib/cardsDataFormat";

const compare = readFileSync("src/pages/cards/compare.astro", "utf8");
const tracker = readFileSync("src/components/islands/SalaryTransferTracker.tsx", "utf8");

function comparePicker(search = "") {
  const changeHandlers = new Map<string, () => void>();
  const boxes = ["a", "b", "c", "d", "e"].map(value => ({
    value, checked: false, disabled: false,
    addEventListener(_event: string, handler: () => void) { changeHandlers.set(value, handler); },
  }));
  const cols = boxes.map(box => ({
    slug: box.value, hidden: false,
    getAttribute() { return this.slug; },
    querySelector() { return null; },
  }));
  const grid = {
    hidden: false, dataset: { visibleCount: "" },
    querySelectorAll() { return [...cols]; },
    prepend(...nodes: typeof cols) { cols.splice(0, cols.length, ...nodes, ...cols.filter(col => !nodes.includes(col))); },
  };
  const selection = { textContent: "" };
  const count = { textContent: "" };
  const elements: Record<string, object> = {
    "dp-compare-grid": grid,
    "dp-compare-empty": { hidden: true },
    "dp-compare-count": count,
    "dp-compare-mode": { textContent: "" },
    "dp-compare-selection": selection,
  };
  const script = compare.match(/<script is:inline define:vars=\{\{ MAX_CARDS, defaultSlugs \}\}>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  runInNewContext(script, {
    MAX_CARDS: 4, defaultSlugs: ["a", "b", "c"], URLSearchParams,
    window: { location: { search } },
    document: {
      getElementById: (id: string) => elements[id],
      querySelectorAll: () => boxes,
      querySelector: () => ({ querySelectorAll: () => boxes }),
    },
  });
  return { boxes, cols, grid, count, selection, changeHandlers };
}

test("comparison picker keeps URL order, distinct cards and the existing four-card limit", () => {
  const result = comparePicker("?cards=d,b,d,unknown,a,c,e");
  assert.deepEqual(result.cols.filter(col => !col.hidden).map(col => col.slug), ["d", "b", "a", "c"]);
  assert.equal(result.grid.dataset.visibleCount, "4");
  assert.equal(result.count.textContent, "4");
  assert.equal(result.boxes.find(box => box.value === "e")?.disabled, true);
  assert.match(result.selection.textContent, /4 of 4 selected.*Deselect a card/);
});

test("comparison checkboxes remain multi-select and re-enable choices after deselection", () => {
  const result = comparePicker();
  assert.equal(result.boxes.filter(box => box.checked).length, 3);
  const fourth = result.boxes[3];
  fourth.checked = true;
  result.changeHandlers.get("d")!();
  assert.equal(result.boxes[4].disabled, true);
  assert.equal(result.boxes.filter(box => box.checked).length, 4);
  result.boxes[0].checked = false;
  result.changeHandlers.get("a")!();
  assert.equal(result.boxes[4].disabled, false);
  assert.equal(result.boxes.filter(box => box.checked).length, 3);
  for (const box of result.boxes) box.checked = false;
  result.changeHandlers.get("b")!();
  assert.match(result.selection.textContent, /0 of 4 selected.*restore the defaults/);
  assert.ok(result.boxes.every(box => !box.disabled));
});

test("unknown comparison links retain the readable default comparison", () => {
  const result = comparePicker("?cards=unknown");
  assert.deepEqual(result.cols.filter(col => !col.hidden).map(col => col.slug), ["a", "b", "c"]);
});

test("tracker uses native independent checkboxes but retains its single-band toggle and salary warning", () => {
  for (const [state, setter] of [["cash", "Cash"], ["noCard", "NoCard"], ["sharia", "Sharia"]]) {
    assert.ok(tracker.includes(`type="checkbox" checked={${state}} onChange={() => set${setter}(!${state})}`));
  }
  assert.match(tracker, /const \[band, setBand\] = useState<number \| null>\(null\)/);
  assert.match(tracker, /setBand\(band === i \? null : i\)/);
  assert.match(tracker, /a band is not an exact salary/);
  assert.match(tracker, /Choose any combination/);
  assert.match(tracker, /<table class="dpst-table">\s*<caption class="sr-only">/);
});

test("larger card art stays real, contained, lazy and deferred for unchosen comparison cards", () => {
  const art = readFileSync("src/components/cards/CompareCardArt.astro", "utf8");
  const finder = readFileSync("src/components/cards/FinderCard.astro", "utf8");
  assert.match(art, /size\?: "compact" \| "identity"/);
  assert.match(art, /<template data-compare-art-template><img/);
  assert.match(art, /loading: "lazy"/);
  assert.match(art, /object-fit: contain/);
  assert.match(art, /max-inline-size: 100%/);
  assert.match(art, /const creditUrl = art \? art.page \?\? art.url : undefined/);
  assert.match(art, /new URL\(creditUrl\).hostname/);
  assert.match(art, /size === "identity" && creditUrl/);
  assert.match(art, /Card image: <a href=\{creditUrl\}>\{creditLabel\}/);
  assert.match(finder, /CompareCardArt slug=\{card.slug\} size="identity"/);
  assert.match(compare, /CompareCardArt slug=\{card.slug\} deferred size="identity"/);
});

test("two-card comparison groups canonical rows without replacing their values or winners", () => {
  const source = readFileSync("src/components/cards/CardComparison.astro", "utf8");
  for (const label of ["Fees", "Eligibility", "Earn", "Benefits"]) assert.ok(source.includes(`label: "${label}"`));
  assert.match(source, /const rows = cardComparisonRows\(left, right\)/);
  assert.match(source, /rows: rows.filter\(\(row\) => group.keys.includes\(row.key\)\)/);
  assert.match(source, /scope="rowgroup"/);
  assert.match(source, /\{row.leftValue\}/);
  assert.match(source, /\{row.rightValue\}/);
  assert.match(source, /row.winner === "left"/);
});

test("comparison groups cover every canonical row exactly once in canonical order", () => {
  const source = readFileSync("src/components/cards/CardComparison.astro", "utf8");
  const groupKeys = [...source.matchAll(/keys: (\[[^\]]*\])/g)].flatMap(match => JSON.parse(match[1]) as string[]);
  const cards = JSON.parse(readFileSync("src/data/cards.json", "utf8")) as Record<string, CardForComparison>;
  const canonicalKeys = new Set<string>();
  for (const left of Object.values(cards)) for (const right of Object.values(cards)) {
    const keys = cardComparisonRows(left, right).map(row => row.key);
    keys.forEach(key => canonicalKeys.add(key));
    assert.deepEqual(groupKeys.filter(key => keys.includes(key)), keys, "New canonical measures need an explicit presentation group; do not silently drop or reorder them");
  }
  assert.deepEqual([...groupKeys].sort(), [...canonicalKeys].sort());
  assert.equal(new Set(groupKeys).size, groupKeys.length);
});
