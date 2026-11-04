// A wide data table may scroll, but it must not widen its article. Wrap
// generated Markdown tables without changing their native table semantics.
export default function rehypeTableScroll() {
  function visit(parent, regions) {
    if (!Array.isArray(parent.children)) return;
    for (const [index, node] of parent.children.entries()) {
      if (node.type === "element" && node.tagName === "table") {
        const region = {
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
        parent.children[index] = region;
        regions.push(region);
      } else if (node.properties?.className?.includes?.("dp-prose-table-scroll")) {
        regions.push(node);
      } else {
        visit(node, regions);
      }
    }
  }
  return function transform(root) {
    const regions = [];
    visit(root, regions);
    if (regions.length > 1) {
      regions.forEach((region, index) => {
        region.properties.ariaLabel = `Data table ${index + 1} of ${regions.length}`;
      });
    }
  };
}
