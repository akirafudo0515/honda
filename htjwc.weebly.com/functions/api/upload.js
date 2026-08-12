import { json, requireAuth } from '../_lib/auth.js';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export async function onRequestPost(context) {
  const { request, env } = context;
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (!env.FILES) return json({ error: '檔案儲存尚未設定' }, { status: 503 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: '無效的上傳內容' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return json({ error: '請選擇檔案' }, { status: 400 });
  }

  const type = file.type || 'application/octet-stream';
  if (!ALLOWED.has(type)) {
    return json({ error: '僅支援圖片 (jpg/png/webp/gif) 或 PDF' }, { status: 400 });
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return json({ error: '檔案不可超過 8MB' }, { status: 400 });
  }

  const extMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
  };
  const ext = extMap[type] || 'bin';
  const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  await env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: type },
    customMetadata: { originalName: file.name || key },
  });

  return json({
    key,
    url: `/api/file/${encodeURIComponent(key)}`,
    name: file.name || key,
    contentType: type,
  });
}
