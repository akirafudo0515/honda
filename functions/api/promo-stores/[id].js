import { json, requireAuth } from '../../_lib/auth.js';
import { PROMO_CATEGORIES, prepareStoreData, rowToStore } from '../../_lib/stores.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: '無效的 ID' }, { status: 400 });
  const row = await env.DB.prepare('SELECT * FROM promo_stores WHERE id = ?').bind(id).first();
  if (!row || !row.visible) return json({ error: '找不到店家' }, { status: 404 });
  return json({ store: rowToStore(row) });
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: '無效的 ID' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '無效的請求' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM promo_stores WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: '找不到店家' }, { status: 404 });

  const data = prepareStoreData(body, { partial: true });
  if (data.name !== undefined && !data.name) {
    return json({ error: '店名為必填' }, { status: 400 });
  }
  if (data.category !== undefined && !PROMO_CATEGORIES.has(data.category)) {
    return json({ error: '活動推廣只開放餐飲、咖啡、旅館、伴手禮' }, { status: 400 });
  }

  const sets = [];
  const values = [];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`${k} = ?`);
    values.push(v);
  }
  if (!sets.length) return json({ error: '沒有可更新的欄位' }, { status: 400 });

  sets.push(`updated_at = datetime('now')`);
  values.push(id);

  await env.DB.prepare(`UPDATE promo_stores SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM promo_stores WHERE id = ?').bind(id).first();
  return json({ store: rowToStore(row) });
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: '無效的 ID' }, { status: 400 });

  const existing = await env.DB.prepare('SELECT id FROM promo_stores WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: '找不到店家' }, { status: 404 });

  await env.DB.prepare('DELETE FROM promo_stores WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
