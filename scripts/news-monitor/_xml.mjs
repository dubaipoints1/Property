// One bounded, structure-aware RSS/Atom metadata scan. No external entity
// reads, DOM, recovery, HTML execution, dependency or raw regex reparse.
const SPACE = /[ \t\r\n]/;
const NAME = /[A-Za-z_][\w:.-]*/y;
const validEntities = (text) => !/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(text);
const INVALID = () => ({ status: "invalid", count: 0, items: [] });

export function xmlText(value = "") {
  // Metadata is bounded before this call. Strip literal HTML in a single
  // forward pass; an unmatched '<' cannot cause quadratic regex scanning.
  let stripped = "", index = 0;
  while (index < value.length) {
    const start = value.indexOf("<", index);
    if (start < 0) { stripped += value.slice(index); break; }
    stripped += value.slice(index, start);
    const end = value.indexOf(">", start + 1);
    if (end < 0) { stripped += value.slice(start); break; }
    index = end + 1;
  }
  return stripped.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name) => {
    const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (!name.startsWith("#")) return named[name.toLowerCase()] ?? entity;
    const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
  }).trim();
}

function openingTag(text) {
  NAME.lastIndex = 0;
  const match = NAME.exec(text);
  if (!match) return null;
  const name = match[0], attrs = {}, names = new Set();
  let index = NAME.lastIndex;
  while (index < text.length) {
    const beforeSpace = index;
    while (SPACE.test(text[index] ?? "")) index++;
    if (index === text.length) break;
    if (text[index] === "/" && index === text.length - 1) return { name, attrs, self: true };
    if (index === beforeSpace || names.size >= 128) return null;
    NAME.lastIndex = index;
    const attribute = NAME.exec(text);
    if (!attribute || names.has(attribute[0])) return null;
    const key = attribute[0];
    names.add(key);
    index = NAME.lastIndex;
    while (SPACE.test(text[index] ?? "")) index++;
    if (text[index++] !== "=") return null;
    while (SPACE.test(text[index] ?? "")) index++;
    const quote = text[index++];
    if (quote !== '"' && quote !== "'") return null;
    const end = text.indexOf(quote, index);
    if (end < 0) return null;
    const value = text.slice(index, end);
    if (value.includes("<") || !validEntities(value)) return null;
    if (key === "rel" || key === "href") attrs[key] = value.length <= 8192 ? xmlText(value) : "";
    index = end + 1;
  }
  return { name, attrs, self: false };
}

export function scanMetadata(xml, { maxBytes = 4 * 1024 * 1024, maxItems = 25 } = {}) {
  if (typeof xml !== "string" || Buffer.byteLength(xml, "utf8") > maxBytes) return INVALID();
  const stack = [], items = [];
  let index = xml.charCodeAt(0) === 0xfeff ? 1 : 0, root, roots = 0, count = 0, record = null, capture = null;
  const append = (text) => {
    if (!capture) return;
    if (capture.text.length + text.length > 8192) capture.overlong = true;
    else if (!capture.overlong) capture.text += text;
  };
  const close = (name) => {
    const depth = stack.length;
    if (stack.pop() !== name) return false;
    if (capture?.depth === depth) {
      if (record && record.fields[capture.name] === undefined) record.fields[capture.name] = capture.overlong ? "" : xmlText(capture.text);
      capture = null;
    }
    if (record?.depth === depth) {
      count++;
      if (record.collect) items.push({ title: record.fields.title ?? "", link: record.atom ? record.alternate ?? "" : record.fields.link ?? "",
        date: record.fields.published ?? record.fields.pubDate ?? record.fields["dc:date"] ?? record.fields.updated ?? "" });
      record = null;
    }
    return true;
  };
  while (index < xml.length) {
    if (xml.startsWith("<!--", index)) {
      const end = xml.indexOf("-->", index + 4);
      if (end < 0 || xml.slice(index + 4, end).includes("--")) return INVALID();
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", index)) {
      const end = xml.indexOf("]]>", index + 9);
      if (end < 0 || !stack.length) return INVALID();
      append(xml.slice(index + 9, end));
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<?", index)) {
      const end = xml.indexOf("?>", index + 2);
      if (end < 0) return INVALID();
      index = end + 2;
      continue;
    }
    if (xml[index] !== "<") {
      const next = xml.indexOf("<", index), end = next < 0 ? xml.length : next;
      const text = xml.slice(index, end);
      if ((!stack.length && text.trim()) || !validEntities(text) || text.includes("]]>")) return INVALID();
      append(text);
      index = end;
      continue;
    }
    // Declarations/DTDs are unsupported, with no entity expansion route.
    if (xml.startsWith("<!", index)) return INVALID();
    let end = index + 1, quote = null;
    for (; end < xml.length; end++) {
      const char = xml[end];
      if (char === "<") return INVALID();
      if (quote) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === ">") break;
    }
    if (end === xml.length || quote) return INVALID();
    const text = xml.slice(index + 1, end);
    const closing = text.match(/^\/([A-Za-z_][\w:.-]*)\s*$/);
    if (closing) { if (!close(closing[1])) return INVALID(); }
    else {
      const tag = openingTag(text);
      if (!tag || stack.length >= 64) return INVALID();
      if (!stack.length) {
        if (++roots !== 1 || !["rss", "feed", "rdf:RDF"].includes(tag.name)) return INVALID();
        root = tag.name;
      }
      const depth = stack.length + 1;
      const isRecord = !record && ((root === "feed" && depth === 2 && tag.name === "entry") ||
        (root === "rss" && depth === 3 && stack[1] === "channel" && tag.name === "item") ||
        (root === "rdf:RDF" && depth === 2 && tag.name === "item"));
      if (isRecord) record = { depth, atom: tag.name === "entry", collect: items.length < maxItems, fields: {} };
      else if (record?.collect && depth === record.depth + 1) {
        if (["title", "link", "pubDate", "dc:date", "published", "updated"].includes(tag.name)) capture = { name: tag.name, depth, text: "", overlong: false };
        if (record.atom && tag.name === "link" && (tag.attrs.rel ?? "alternate") === "alternate" && record.alternate === undefined) record.alternate = tag.attrs.href ?? "";
      }
      stack.push(tag.name);
      if (tag.self && !close(tag.name)) return INVALID();
    }
    index = end + 1;
  }
  return roots === 1 && stack.length === 0 ? { status: count ? "items" : "empty", count, items } : INVALID();
}
