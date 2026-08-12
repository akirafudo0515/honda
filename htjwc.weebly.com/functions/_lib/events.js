export function rowToEvent(row) {
  if (!row) return null;
  return {
    ...row,
    visible: !!row.visible,
    title: row.title || '',
    body: row.body || '',
    image_url: row.image_url || '',
    link_url: row.link_url || '',
    sort_order: Number(row.sort_order) || 0,
  };
}

export function prepareEventData(body, { partial = false } = {}) {
  const data = {};
  const fields = ['title', 'body', 'image_url', 'link_url', 'sort_order', 'visible'];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  if (data.title !== undefined) data.title = String(data.title || '').trim();
  if (data.body !== undefined) data.body = String(data.body || '');
  if (data.image_url !== undefined) data.image_url = String(data.image_url || '').trim();
  if (data.link_url !== undefined) data.link_url = String(data.link_url || '').trim();

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

  if (!partial) {
    if (!data.title) data.title = '';
    if (data.body === undefined) data.body = '';
    if (data.image_url === undefined) data.image_url = '';
    if (data.link_url === undefined) data.link_url = '';
    if (data.visible === undefined) data.visible = 1;
  }

  return data;
}

export async function nextEventSortOrder(db) {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM events')
    .first();
  return (row && Number.isFinite(Number(row.max_sort)) ? Number(row.max_sort) : -1) + 1;
}
