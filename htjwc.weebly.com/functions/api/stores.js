import { json, requireAuth } from '../_lib/auth.js';
import { nextSortOrder, prepareStoreData, rowToStore } from '../_lib/stores.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const all = url.searchParams.get('all') === '1';

  if (all) {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
  }

  let sql = 'SELECT * FROM stores';
  const binds = [];
  const where = [];
  if (category) {
    where.push('category = ?');
    binds.push(category);
  }
  if (!all) where.push('visible = 1');
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY sort_order ASC, id ASC';

  const stmt = env.DB.prepare(sql);
  const { results } = await (binds.length ? stmt.bind(...binds) : stmt).all();
  return json({ stores: (results || []).map(rowToStore) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '無效的請求' }, { status: 400 });
  }

  const data = prepareStoreData(body, { partial: false });
  if (!data.name || !data.category) {
    return json({ error: '店名與分類為必填' }, { status: 400 });
  }

  // No sort_order provided → append to end of that category
  if (data.sort_order === undefined) {
    data.sort_order = await nextSortOrder(env.DB, data.category);
  }

  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map((c) => data[c]);

  const result = await env.DB.prepare(
    `INSERT INTO stores (${cols.join(', ')}) VALUES (${placeholders})`
  )
    .bind(...values)
    .run();

  const id = result.meta.last_row_id;
  const row = await env.DB.prepare('SELECT * FROM stores WHERE id = ?').bind(id).first();
  return json({ store: rowToStore(row) }, { status: 201 });
}
