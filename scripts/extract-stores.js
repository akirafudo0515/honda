/**
 * Extract store entries from Weebly category HTML pages into seed.sql / seed.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'htjwc.weebly.com');

const CATEGORIES = [
  {
    id: 'dining',
    label: '餐飲相關特約店家',
    file: '39184391543900629305320042421523478.html',
  },
  {
    id: 'cafe',
    label: '咖啡 · 點心 · 甜品類',
    file: '2165421857-middot-4067024515-middot-299802169739006.html',
  },
  {
    id: 'hotel',
    label: '旅館民宿特約店家',
    file: '260533920827665234873900629305320042183024215.html',
  },
  {
    id: 'souvenir',
    label: '伴手禮/觀光工廠特約店家',
    file: '202762516331150352642080924037242883678633674.html',
  },
  {
    id: 'leisure',
    label: '生活休閒類特約店家',
    file: '299832796320241382903900629305320042421523478.html',
  },
  {
    id: 'shopping',
    label: '生活服務及購物',
    file: '29983279632638121209214503609229289.html',
  },
];

function decodeEntities(html) {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8203;/g, '');
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fieldAfter(text, label) {
  const re = new RegExp(
    label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:：]\\s*([^\\n]*)',
    'i'
  );
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function extractName(text) {
  let m = text.match(/特約商家店名\s*[:：]\s*([^\n]+)/);
  if (m) return m[1].replace(/\s+/g, ' ').trim();
  m = text.match(/店名\s*[:：]\s*([^\n]+)/);
  if (m) return m[1].replace(/\s+/g, ' ').trim();
  // fallback: first non-empty line
  const line = text.split('\n').map((s) => s.trim()).find(Boolean);
  return line || '未命名店家';
}

function extractDiscount(text) {
  const m = text.match(/優惠內容\s*[:：]\s*([\s\S]*?)(?=\n(?:地址|電話|營業|交通|服務|備註|下載)|$)/);
  if (m) return m[1].replace(/\n+/g, ' ').trim();
  // sometimes bold purple text only has 優惠內容：
  const idx = text.indexOf('優惠內容');
  if (idx >= 0) {
    return text
      .slice(idx)
      .replace(/^優惠內容\s*[:：]\s*/, '')
      .split('\n')[0]
      .trim();
  }
  return '';
}

function extractDescription(text, knownFields) {
  let lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // drop lines that are pure field labels we already captured
  const dropPrefixes = [
    '特約商家店名',
    '店名',
    '地址',
    '電話',
    '營業時間',
    '交通',
    '服務項目',
    '優惠內容',
    '備註',
    'Download File',
    'File Size',
    'File Type',
  ];
  lines = lines.filter((l) => !dropPrefixes.some((p) => l.startsWith(p)));
  // also drop lines that equal captured field values if short
  return lines.join('\n').trim();
}

function extractStoresFromHtml(html, categoryId) {
  const stores = [];
  // Each store block is a wsite-multicol table
  const blockRe =
    /<div class="wsite-multicol">([\s\S]*?)<\/table>\s*<\/div>\s*<\/div>\s*<\/div>/gi;
  let match;
  let order = 0;
  while ((match = blockRe.exec(html)) !== null) {
    const block = match[1];
    // Need left paragraph and right image
    const paraMatch = block.match(/<div class="paragraph">([\s\S]*?)<\/div>/i);
    if (!paraMatch) continue;
    const text = stripTags(paraMatch[1]);
    if (!/特約商家店名|店名\s*[:：]/.test(text) && !text.includes('地址')) {
      // skip non-store multicol blocks
      if (!/電話|營業時間|優惠內容/.test(text)) continue;
    }

    const name = extractName(text);
    if (!name || name.length < 2) continue;

    const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
    let imageUrl = imgMatch ? imgMatch[1] : '';
    if (imageUrl.startsWith('../')) imageUrl = '';

    let website = '';
    const linkMatch = block.match(
      /<div class="wsite-image[\s\S]*?<a\s+href=['"]([^'"]+)['"]/i
    );
    if (linkMatch) {
      website = linkMatch[1];
      if (website.startsWith('../') || website.includes('weebly.com/weebly')) website = '';
    }

    let pdfUrl = '';
    let pdfName = '';
    const pdfMatch = block.match(
      /href=["']([^"']+\.pdf)["'][^>]*(?:title=["']([^"']*)["'])?/i
    );
    if (pdfMatch) {
      pdfUrl = pdfMatch[1];
      pdfName = decodeEntities(pdfMatch[2] || path.basename(pdfUrl));
      pdfName = pdfName.replace(/^下載檔案：/, '');
      try {
        if (/%[0-9a-fA-F]{2}/.test(pdfName)) {
          pdfName = decodeURIComponent(pdfName.replace(/\+/g, ' '));
        }
      } catch {
        // keep raw
      }
    }

    const address = fieldAfter(text, '地址');
    const phone = fieldAfter(text, '電話');
    const hours = fieldAfter(text, '營業時間');
    const transport = fieldAfter(text, '交通');
    const services = fieldAfter(text, '服務項目');
    const notes = fieldAfter(text, '備註');
    const discount = extractDiscount(text);

    // description = remaining narrative (exclude fields)
    let description = text;
    [
      ['特約商家店名', name],
      ['地址', address],
      ['電話', phone],
      ['營業時間', hours],
      ['交通', transport],
      ['服務項目', services],
      ['備註', notes],
      ['優惠內容', discount],
    ].forEach(([label, val]) => {
      if (!val) return;
      description = description.replace(
        new RegExp(label + '\\s*[:：]\\s*' + val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        ''
      );
    });
    description = description
      .replace(/特約商家店名\s*[:：]\s*[^\n]*/g, '')
      .replace(/優惠內容\s*[:：]\s*/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim();

    // If description is basically the discount leftover, clear
    if (description === discount) description = '';

    stores.push({
      category: categoryId,
      name,
      address,
      phone,
      hours,
      transport,
      services,
      description,
      discount,
      notes,
      website,
      image_url: imageUrl,
      image_urls: imageUrl ? [imageUrl] : [],
      pdf_url: pdfUrl,
      pdf_name: pdfName,
      sort_order: order++,
      visible: 1,
    });
  }
  return stores;
}

function sqlEscape(s) {
  return String(s == null ? '' : s).replace(/'/g, "''");
}

function main() {
  const all = [];
  for (const cat of CATEGORIES) {
    const filePath = path.join(ROOT, cat.file);
    if (!fs.existsSync(filePath)) {
      console.warn('Missing:', cat.file);
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    const stores = extractStoresFromHtml(html, cat.id);
    console.log(`${cat.id}: ${stores.length} stores from ${cat.file}`);
    all.push(...stores);
  }

  const outJson = path.join(__dirname, '..', 'seed.json');
  fs.writeFileSync(outJson, JSON.stringify({ categories: CATEGORIES, stores: all }, null, 2), 'utf8');

  const lines = [
    'DELETE FROM stores;',
    ...all.map((s) => {
      return (
        'INSERT INTO stores (category, name, address, phone, hours, transport, services, description, discount, notes, website, image_url, image_urls, pdf_url, pdf_name, sort_order, visible) VALUES (' +
        [
          s.category,
          s.name,
          s.address,
          s.phone,
          s.hours,
          s.transport,
          s.services,
          s.description,
          s.discount,
          s.notes,
          s.website,
          s.image_url,
          JSON.stringify(s.image_urls || (s.image_url ? [s.image_url] : [])),
          s.pdf_url,
          s.pdf_name,
          s.sort_order,
          s.visible,
        ]
          .map((v) => (typeof v === 'number' ? String(v) : `'${sqlEscape(v)}'`))
          .join(', ') +
        ');'
      );
    }),
  ];
  const outSql = path.join(__dirname, '..', 'seed.sql');
  fs.writeFileSync(outSql, lines.join('\n') + '\n', 'utf8');

  console.log(`Wrote ${all.length} stores -> seed.json, seed.sql`);
}

main();
