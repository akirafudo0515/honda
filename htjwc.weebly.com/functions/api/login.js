import { createSessionCookie, isAuthenticated, json } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const ok = await isAuthenticated(context.request, context.env);
  return json({ authenticated: ok });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '無效的請求' }, { status: 400 });
  }
  const password = (body && body.password) || '';
  const expected = env.ADMIN_PASSWORD || 'change-me-please';
  if (!password || password !== expected) {
    return json({ error: '密碼錯誤' }, { status: 401 });
  }
  const cookie = await createSessionCookie(env, request);
  return json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': cookie,
      },
    }
  );
}
