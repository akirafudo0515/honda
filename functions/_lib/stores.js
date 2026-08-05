const FIELDS = [
  'category',
  'name',
  'address',
  'phone',
  'hours',
  'transport',
  'services',
  'description',
  'discount',
  'notes',
  'website',
  'image_url',
  'image_urls',
  'pdf_url',
  'pdf_name',
  'sort_order',
  'visible',
];

function parseImages(row) {
  const urls = [];
  if (row && row.image_urls) {
    try {
      const parsed = JSON.parse(row.image_urls);
      if (Array.isArray(parsed)) {
        parsed.forEach((u) => {
          if (typeof u === 'string' && u.trim()) urls.push(u.trim());
        });
      }
    } catch {
      // ignore
    }
  }
  if (!urls.length && row && row.image_url) urls.push(row.image_url);
  return urls;
}

function normalizeImagesInput(body) {
  let images = [];
  if (Array.isArray(body.images)) images = body.images;
  else if (Array.isArray(body.image_urls)) images = body.image_urls;
  else if (typeof body.image_urls === 'string') {
    try {
      const parsed = JSON.parse(body.image_urls);
      if (Array.isArray(parsed)) images = parsed;
    } catch {
      if (body.image_urls.trim()) images = [body.image_urls.trim()];
    }
  } else if (body.image_url) {
    images = [body.image_url];
  }
  return images
    .map((u) => String(u || '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function rowToStore(row) {
  if (!row) return null;
  const images = parseImages(row);
  return {
    ...row,
    visible: !!row.visible,
    images,
    image_url: images[0] || '',
    image_urls: JSON.stringify(images),
  };
}

export function prepareStoreData(body, { partial = false } = {}) {
  const data = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const hasImageInput =
    body.images !== undefined ||
    body.image_urls !== undefined ||
    body.image_url !== undefined;

  if (hasImageInput || !partial) {
    const images = normalizeImagesInput(body);
    data.image_urls = JSON.stringify(images);
    data.image_url = images[0] || '';
  }

  if (data.visible !== undefined) {
    data.visible = data.visible === false || data.visible === 0 ? 0 : 1;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'sort_order')) {
    const raw = data.sort_order;
    if (raw === '' || raw === null || raw === undefined) {
      delete data.sort_order;
    } else {
      const n = Number(raw);
      data.sort_order = Number.isFinite(n) ? n : undefined;
      if (data.sort_order === undefined) delete data.sort_order;
    }
  }
  if (data.name !== undefined) data.name = String(data.name || '').trim();
  if (data.category !== undefined) data.category = String(data.category || '').trim();

  return data;
}

export async function nextSortOrder(db, category) {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM stores WHERE category = ?')
    .bind(category)
    .first();
  return (row && Number.isFinite(Number(row.max_sort)) ? Number(row.max_sort) : -1) + 1;
}
