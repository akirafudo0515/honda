import { json, requireAuth } from '../_lib/auth.js';

const DEFAULT_TITLE = '活動推廣';

function settingsFrom(row) {
  return {
    title: (row && row.title) || DEFAULT_TITLE,
    desktop_image_url: (row && row.desktop_image_url) || '',
    mobile_image_url: (row && row.mobile_image_url) || '',
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json(settingsFrom(null));
  try {
    const row = await env.DB.prepare(
      'SELECT title, desktop_image_url, mobile_image_url FROM promo_settings WHERE id = 1'
    ).first();
    return json(settingsFrom(row));
  } catch {
    return json(settingsFrom(null));
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

  const current = await env.DB.prepare(
    'SELECT title, desktop_image_url, mobile_image_url FROM promo_settings WHERE id = 1'
  ).first();

  let title = (current && current.title) || DEFAULT_TITLE;
  if (body.title !== undefined) {
    title = String(body.title || '').trim().slice(0, 40) || DEFAULT_TITLE;
  }

  let desktop = (current && current.desktop_image_url) || '';
  if (body.desktop_image_url !== undefined) {
    desktop = String(body.desktop_image_url || '').trim();
  }

  let mobile = (current && current.mobile_image_url) || '';
  if (body.mobile_image_url !== undefined) {
    mobile = String(body.mobile_image_url || '').trim();
  }

  await env.DB.prepare(
    `INSERT INTO promo_settings (id, image_url, desktop_image_url, mobile_image_url, title, updated_at)
     VALUES (1, '', ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       desktop_image_url = excluded.desktop_image_url,
       mobile_image_url = excluded.mobile_image_url,
       title = excluded.title,
       updated_at = datetime('now')`
  )
    .bind(desktop, mobile, title)
    .run();

  return json({ title, desktop_image_url: desktop, mobile_image_url: mobile });
}
