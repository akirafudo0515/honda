import { json, requireAuth } from '../_lib/auth.js';
import { PROMO_CATEGORIES, nextSortOrder, prepareStoreData, rowToStore } from '../_lib/stores.js';

function validCategory(category) {
  return PROMO_CATEGORIES.has(category);
}

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
  if (category && !validCategory(category)) {
    return json({ error: '活動推廣沒有這個分類' }, { status: 400 });
  }

  let sql = 'SELECT * FROM promo_stores';
  const binds = [];
  const where = [];
  if (category) {
    where.push('category = ?');
    binds.push(category);
  }
  if (!all) where.push('visible = 1');
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY sort_order ASC, id ASC';

  try {
    const stmt = env.DB.prepare(sql);
    const { results } = await (binds.length ? stmt.bind(...binds) : stmt).all();
    return json({ stores: (results || []).map(rowToStore) });
  } catch {
    return json({ stores: [], error: '活動推廣資料表尚未建立' });
  }
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
  if (!data.name || !validCategory(data.category)) {
    return json({ error: '請填店名，並選擇餐飲、咖啡、旅館或伴手禮' }, { status: 400 });
  }

  if (data.sort_order === undefined) {
    data.sort_order = await nextSortOrder(env.DB, data.category, 'promo_stores');
  }

  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map((c) => data[c]);

  const result = await env.DB.prepare(
    `INSERT INTO promo_stores (${cols.join(', ')}) VALUES (${placeholders})`
  )
    .bind(...values)
    .run();

  const id = result.meta.last_row_id;
  const row = await env.DB.prepare('SELECT * FROM promo_stores WHERE id = ?').bind(id).first();
  return json({ store: rowToStore(row) }, { status: 201 });
}
