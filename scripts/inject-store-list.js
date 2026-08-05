const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "..", "htjwc.weebly.com");
const files = [
  ["39184391543900629305320042421523478.html", "dining"],
  ["2165421857-middot-4067024515-middot-299802169739006.html", "cafe"],
  ["260533920827665234873900629305320042183024215.html", "hotel"],
  ["202762516331150352642080924037242883678633674.html", "souvenir"],
  ["299832796320241382903900629305320042421523478.html", "leisure"],
  ["29983279632638121209214503609229289.html", "shopping"],
];

const OPEN = '<div class="wsite-section-elements">';

for (const [file, category] of files) {
  const fp = path.join(base, file);
  let html = fs.readFileSync(fp, "utf8");

  const mcIdx = html.indexOf('class="wsite-multicol"');
  if (mcIdx === -1) {
    console.log("SKIP (no wsite-multicol): " + file);
    continue;
  }

  const openIdx = html.lastIndexOf(OPEN, mcIdx);
  if (openIdx === -1) {
    console.log("FAIL (no parent section-elements): " + file);
    continue;
  }

  // Walk forward from end of open tag, counting div depth, to find matching close.
  const start = openIdx + OPEN.length;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 1;
  let closeIdx = -1;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0] === "</div>") {
      depth--;
      if (depth === 0) { closeIdx = m.index; break; }
    } else {
      depth++;
    }
  }
  if (closeIdx === -1) {
    console.log("FAIL (no matching close tag): " + file);
    continue;
  }

  const replacement =
    "\n\t\t\t\t<div id=\"store-list\" data-category=\"" + category + "\"></div>\n" +
    "\t\t\t\t<script src=\"files/store-list.js\"></script>\n\t\t\t";
  html = html.slice(0, start) + replacement + html.slice(closeIdx);
  fs.writeFileSync(fp, html, "utf8");
  console.log("OK: " + category + " -> " + file);
}
