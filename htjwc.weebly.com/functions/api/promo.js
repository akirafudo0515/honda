import { json, requireAuth } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });
  try {
    const row = await env.DB.prepare('SELECT image_url FROM promo_settings WHERE id = 1').first();
    return json({ image_url: (row && row.image_url) || '' });
  } catch {
    return json({ image_url: '' });
  }
}

export async function onRequestPut(context) {
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

  const image_url = String(body.image_url || '').trim();
  await env.DB.prepare(
    `INSERT INTO promo_settings (id, image_url, updated_at)
     VALUES (1, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET image_url = excluded.image_url, updated_at = datetime('now')`
  )
    .bind(image_url)
    .run();

  return json({ image_url });
}
