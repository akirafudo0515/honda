import { json, requireAuth } from '../../_lib/auth.js';

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  const slug = String(params.slug || '').trim();
  if (!slug) return json({ error: '無效的分類' }, { status: 400 });

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

  const existing = await env.DB.prepare('SELECT id FROM categories WHERE slug = ?').bind(slug).first();
  if (!existing) return json({ error: '找不到分類' }, { status: 404 });

  const dup = await env.DB.prepare('SELECT id FROM categories WHERE name = ? AND slug != ?')
    .bind(name, slug)
    .first();
  if (dup) return json({ error: '這個分類名稱已經有了' }, { status: 400 });

  await env.DB.prepare('UPDATE categories SET name = ? WHERE slug = ?').bind(name, slug).run();
  const row = await env.DB.prepare('SELECT * FROM categories WHERE slug = ?').bind(slug).first();
  return json({
    category: { id: row.id, slug: row.slug, name: row.name, sort_order: row.sort_order },
  });
}
