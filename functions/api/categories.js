import { json, requireAuth } from '../_lib/auth.js';

const BUILTIN = [
  { slug: 'dining', name: '餐飲相關特約店家', sort_order: 0 },
  { slug: 'cafe', name: '咖啡 · 點心 · 甜品類', sort_order: 1 },
  { slug: 'hotel', name: '旅館民宿特約店家', sort_order: 2 },
  { slug: 'souvenir', name: '伴手禮/觀光工廠特約店家', sort_order: 3 },
  { slug: 'leisure', name: '生活休閒類特約店家', sort_order: 4 },
  { slug: 'shopping', name: '生活服務及購物', sort_order: 5 },
];

function rowToCategory(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sort_order: row.sort_order,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ categories: BUILTIN });

  const url = new URL(request.url);
  const all = url.searchParams.get('all') === '1';
  const promo = url.searchParams.get('promo') === '1';
  const visible = url.searchParams.get('visible') === '1';

  if (all) {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
  }

  try {
    let sql = 'SELECT * FROM categories';
    if (promo) {
      sql +=
        ' WHERE EXISTS (SELECT 1 FROM stores s WHERE s.category = categories.slug AND s.promo_visible = 1)';
    } else if (visible) {
      sql +=
        ' WHERE EXISTS (SELECT 1 FROM stores s WHERE s.category = categories.slug AND s.visible = 1)';
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const { results } = await env.DB.prepare(sql).all();
    const categories = (results || []).map(rowToCategory);
    if (!promo && !visible && !categories.length) return json({ categories: BUILTIN });
    return json({ categories });
  } catch {
    return json({ categories: BUILTIN });
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

  const name = String(body.name || '').trim();
  if (!name || name.length > 40) {
    return json({ error: '請填分類名稱，40 字以內' }, { status: 400 });
  }

  const dup = await env.DB.prepare('SELECT id FROM categories WHERE name = ?').bind(name).first();
  if (dup) return json({ error: '這個分類已經有了' }, { status: 400 });

  const max = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM categories').first();
  const sort_order = (max && Number.isFinite(Number(max.max_sort)) ? Number(max.max_sort) : -1) + 1;
  const slug = 'c' + Date.now().toString(36);

  const result = await env.DB.prepare(
    'INSERT INTO categories (slug, name, sort_order) VALUES (?, ?, ?)'
  )
    .bind(slug, name, sort_order)
    .run();

  const row = await env.DB.prepare('SELECT * FROM categories WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();
  return json({ category: rowToCategory(row) }, { status: 201 });
}
