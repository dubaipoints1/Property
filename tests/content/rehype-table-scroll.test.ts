import assert from "node:assert/strict";
import { test } from "node:test";
import rehypeTableScroll from "../../src/lib/rehypeTableScroll.mjs";

test("wraps Markdown tables in a focusable scroll region and preserves the native table", () => {
  const table = { type: "element", tagName: "table", properties: {}, children: [
    { type: "element", tagName: "thead", children: [] },
  ] };
  const paragraph = { type: "element", tagName: "p", children: [] };
  const root = { type: "root", children: [paragraph, table] };
  rehypeTableScroll()(root);
  assert.equal(root.children[0], paragraph);
  const wrapper = root.children[1];
  assert.deepEqual(wrapper.properties, {
    className: ["dp-prose-table-scroll"], role: "region", ariaLabel: "Data table", tabIndex: 0,
  });
  assert.equal(wrapper.children[0], table);
  rehypeTableScroll()(root);
  assert.equal(root.children[1], wrapper);
});
