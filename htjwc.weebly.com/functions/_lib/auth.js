const COOKIE_NAME = 'honda_admin';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function getSecret(env) {
  return env.SESSION_SECRET || 'dev-session-secret-change-me';
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cookieFlags(request) {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `Path=/; HttpOnly${secure}; SameSite=Lax`;
}

export async function createSessionCookie(env, request) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `admin:${exp}`;
  const sig = await hmacSign(getSecret(env), payload);
  const value = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${value}; ${cookieFlags(request)}; Max-Age=${MAX_AGE_SEC}`;
}

export function clearSessionCookie(request) {
  return `${COOKIE_NAME}=; ${cookieFlags(request || { url: 'http://localhost' })}; Max-Age=0`;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    out[k] = v;
  });
  return out;
}

export async function isAuthenticated(request, env) {
  const cookies = parseCookies(request);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return false;
  const lastDot = raw.lastIndexOf('.');
  if (lastDot === -1) return false;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = await hmacSign(getSecret(env), payload);
  if (sig.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < sig.length; i++) ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (ok !== 0) return false;
  const parts = payload.split(':');
  if (parts.length !== 2 || parts[0] !== 'admin') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function unauthorized() {
  return json({ error: '未登入或登入已過期' }, { status: 401 });
}

export async function requireAuth(request, env) {
  if (!(await isAuthenticated(request, env))) return unauthorized();
  return null;
}
