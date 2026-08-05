export async function onRequestGet(context) {
  const { env, params } = context;
  if (!env.FILES) {
    return new Response('檔案儲存尚未設定', { status: 503 });
  }

  const key = decodeURIComponent(params.key || '');
  if (!key || key.includes('..') || key.includes('/')) {
    return new Response('無效的檔案', { status: 400 });
  }

  const obj = await env.FILES.get(key);
  if (!obj) return new Response('找不到檔案', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  const type = obj.httpMetadata?.contentType || 'application/octet-stream';
  headers.set('Content-Type', type);

  return new Response(obj.body, { headers });
}
