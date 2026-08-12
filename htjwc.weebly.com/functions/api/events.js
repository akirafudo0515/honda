import { json, requireAuth } from '../_lib/auth.js';
import { nextEventSortOrder, prepareEventData, rowToEvent } from '../_lib/events.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: '資料庫尚未設定' }, { status: 503 });

  const url = new URL(request.url);
  const all = url.searchParams.get('all') === '1';

  if (all) {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
  }

  let sql = 'SELECT * FROM events';
  if (!all) sql += ' WHERE visible = 1';
  sql += ' ORDER BY sort_order ASC, id ASC';

  try {
    const { results } = await env.DB.prepare(sql).all();
    return json({ events: (results || []).map(rowToEvent) });
  } catch (err) {
    // Table may not exist yet before migration
    return json({ events: [], error: 'events 資料表尚未建立' }, { status: 200 });
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

  const data = prepareEventData(body, { partial: false });
  if (!data.title) return json({ error: '活動標題為必填' }, { status: 400 });

  if (data.sort_order === undefined) {
    data.sort_order = await nextEventSortOrder(env.DB);
  }

  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map((c) => data[c]);

  const result = await env.DB.prepare(
    `INSERT INTO events (${cols.join(', ')}) VALUES (${placeholders})`
  )
    .bind(...values)
    .run();

  const id = result.meta.last_row_id;
  const row = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  return json({ event: rowToEvent(row) }, { status: 201 });
}
