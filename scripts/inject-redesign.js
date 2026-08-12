/**
 * Inject redesign assets into all public HTML pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'htjwc.weebly.com');
const LINK =
  '<link rel="stylesheet" href="files/site-redesign.css" />\n<script defer src="files/site-redesign.js"></script>\n';

const files = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(ROOT, f));

let updated = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('files/site-redesign.css')) continue;

  if (html.includes('</head>')) {
    html = html.replace('</head>', LINK + '</head>');
  } else {
    console.warn('No </head> in', path.basename(file));
    continue;
  }
  fs.writeFileSync(file, html, 'utf8');
  updated++;
  console.log('injected', path.basename(file));
}
console.log('Updated', updated, 'files');
