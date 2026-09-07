import { chromium } from "playwright";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
const DIST = "/home/user/Property/dist";
const OUT = process.argv[2];
const exe = process.env.DP_CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("file://" + path.join(DIST, "index.html"), { waitUntil: "domcontentloaded" });
const data = await page.evaluate(() => {
  const txt = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
  const link = (a) => ({ label: txt(a.querySelector(".lbl") || a).replace(/\s*→\s*$/, ""), sub: txt(a.querySelector(".sub")) || null, href: a.getAttribute("href") });
  const out = { surfaces: [] };
  const push = (surface, rows, note) => out.surfaces.push({ surface, rows, note });
  // Header wordmark + desktop nav
  const nav = document.querySelector(".dp-header-nav");
  const topRows = [];
  const wm = document.querySelector(".dp-header .dp-wordmark"); if (wm) topRows.push({ ...link(wm), label: "Wordmark (" + txt(wm) + ")" });
  nav?.querySelectorAll(":scope > a, :scope > .dp-nav-mega-wrap > a, :scope > .dp-nav-mega-wrap > button, :scope > .dp-nav-mega-wrap > span").forEach(a => topRows.push({ ...link(a), href: a.getAttribute("href") || null, hasMega: !!a.closest(".dp-nav-mega-wrap") }));
  push("Header — desktop primary nav", topRows);
  // Mega panels
  document.querySelectorAll(".dp-megapanel").forEach((p, i) => {
    const rows = [];
    p.querySelectorAll(".dp-mega-grp").forEach(g => { const t = txt(g.querySelector(".dp-mega-grp-t")); g.querySelectorAll("a").forEach(a => rows.push({ group: t, ...link(a) })); });
    const trigger = p.closest(".dp-nav-mega-wrap")?.querySelector("a,button,span");
    push(`Header — mega-menu ${i + 1} (${txt(trigger?.querySelector(".lbl") || trigger) || "?"})`, rows);
  });
  // Header actions + quicklinks + tracker strip
  const act = [];
  document.querySelectorAll(".dp-header-actions a, .dp-header-actions button").forEach(a => act.push({ ...link(a), label: txt(a) || a.getAttribute("aria-label") || a.className, ariaLabel: a.getAttribute("aria-label"), tag: a.tagName.toLowerCase() }));
  document.querySelectorAll(".dp-header-inner > a, .dp-header-inner > button, .dp-header-inner > label").forEach(a => act.push({ label: txt(a) || a.getAttribute("aria-label") || a.className, ariaLabel: a.getAttribute("aria-label"), href: a.getAttribute("href"), tag: a.tagName.toLowerCase() }));
  push("Header — actions (search, subscribe, theme, hamburger)", act);
  const ql = []; document.querySelectorAll(".dp-quicklink").forEach(a => ql.push(link(a))); push("Header — quick links row", ql);
  const ts = []; document.querySelectorAll(".dp-tracker-strip a").forEach(a => ts.push({ ...link(a), label: txt(a) })); push("Header — tracker strip", ts, txt(document.querySelector(".dp-tracker-strip")));
  // Mobile overlay
  const ov = document.querySelector(".dp-nav-overlay");
  const mob = [];
  ov?.querySelectorAll(":scope .dp-nav-overlay-body > a.dp-nav-row, :scope .dp-nav-overlay-body > .dp-nav-row").forEach(a => mob.push({ section: "flat rows", ...link(a), label: txt(a) }));
  ov?.querySelectorAll(".dp-nav-panel").forEach(x => { const lab = x.previousElementSibling?.classList?.contains("dp-nav-expand-label") ? x.previousElementSibling : x.parentElement?.querySelector(".dp-nav-expand-label"); const t = txt(lab?.querySelector(".lbl") || lab); x.querySelectorAll(".dp-nav-grp").forEach(g => { const gt = txt(g.querySelector(".dp-nav-grp-t")); g.querySelectorAll("a").forEach(a => mob.push({ section: `expand: ${t}`, group: gt, ...link(a) })); }); });
  ov?.querySelectorAll(".dp-nav-expand").forEach(x => { const lab = x.querySelector(".dp-nav-expand-label"); mob.push({ section: "expandable label", label: txt(lab?.querySelector(".lbl") || lab), href: null, control: lab?.tagName.toLowerCase(), tabindex: lab?.getAttribute("tabindex"), ariaExpanded: lab?.getAttribute("aria-expanded") }); });
  ov?.querySelectorAll(".dp-nav-tools-block a").forEach(a => mob.push({ section: "tools block", ...link(a) }));
  ov?.querySelectorAll(".dp-nav-pub-block a").forEach(a => mob.push({ section: "publication block", ...link(a) }));
  ov?.querySelectorAll(".dp-nav-foot a, .dp-nav-foot span, .dp-nav-live-strip a").forEach(a => mob.push({ section: "overlay foot / live strip", label: txt(a), href: a.getAttribute("href") }));
  push("Header — mobile overlay", mob, txt(ov?.querySelector(".dp-nav-live-strip")));
  // Footer
  document.querySelectorAll(".dp-footer-col").forEach(col => { const h = txt(col.querySelector(".dp-footer-heading")); const rows = []; col.querySelectorAll("a").forEach(a => rows.push({ ...link(a), label: txt(a) || a.getAttribute("aria-label") })); push(`Footer — ${h}`, rows); });
  const fb = []; document.querySelectorAll(".dp-footer-brand a, .dp-footer-bottom a").forEach(a => fb.push({ label: txt(a) || a.getAttribute("aria-label"), href: a.getAttribute("href") })); push("Footer — brand + bottom bar", fb, txt(document.querySelector(".dp-footer-disclaimer")));
  // Homepage chrome
  const hp = [];
  document.querySelectorAll("main a").forEach(a => { const sec = a.closest("section"); const secT = txt(sec?.querySelector("h2, .dp-eyebrow, .hp-hero-kicker")) || sec?.className || "main"; hp.push({ section: secT.slice(0, 60), label: txt(a).slice(0, 80) || a.getAttribute("aria-label"), href: a.getAttribute("href") }); });
  push("Homepage chrome (all main links)", hp);
  return out;
});
await browser.close();
// target metrics from dist
const redirects = existsSync("/home/user/Property/public/_redirects") ? readFileSync("/home/user/Property/public/_redirects", "utf8").split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.trim().split(/\s+/)[0]) : [];
const cache = new Map();
function target(href) {
  if (!href) return { state: "no-href" };
  if (!href.startsWith("/")) return { state: href.startsWith("#") ? "fragment" : "external" };
  const clean = href.split("#")[0].split("?")[0];
  if (cache.has(clean)) return cache.get(clean);
  let file = path.join(DIST, clean);
  if (existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  let res;
  if (!existsSync(file) || !file.endsWith(".html")) res = { state: redirects.includes(clean) || redirects.includes(clean.replace(/\/$/, "")) ? "redirect" : "missing" };
  else {
    const html = readFileSync(file, "utf8");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const text = main.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean).length;
    const hrefs = new Set([...main.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1]));
    const base = clean.endsWith("/") ? clean : clean + "/";
    const children = [...hrefs].filter(h => h.startsWith(base) && h.length > base.length).length;
    const placeholderCopy = /coming (soon|next quarter)|preparing for launch|in preparation/i.test(text);
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    res = { state: words >= 250 || children >= 4 ? "live" : "thin", words, children, placeholderCopy, title: title.replace(/&amp;/g, "&") };
  }
  cache.set(clean, res); return res;
}
for (const s of data.surfaces) for (const r of s.rows) r.target = target(r.href);
writeFileSync(OUT, JSON.stringify(data, null, 1));
const total = data.surfaces.reduce((n, s) => n + s.rows.length, 0);
console.log(`surfaces ${data.surfaces.length}, rows ${total}`);
for (const s of data.surfaces) console.log(` ${s.rows.length}\t${s.surface}`);
