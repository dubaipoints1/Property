// A wide data table may scroll, but it must not widen its article. Wrap
// generated Markdown tables without changing their native table semantics.
export default function rehypeTableScroll() {
  function visit(parent) {
    if (!Array.isArray(parent.children)) return;
    for (const [index, node] of parent.children.entries()) {
      if (node.type === "element" && node.tagName === "table") {
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["dp-prose-table-scroll"],
            role: "region",
            ariaLabel: "Data table",
            tabIndex: 0,
          },
          children: [node],
        };
      } else if (!node.properties?.className?.includes?.("dp-prose-table-scroll")) {
        visit(node);
      }
    }
  }
  return visit;
}
