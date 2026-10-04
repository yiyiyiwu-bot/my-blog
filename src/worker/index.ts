/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  MODERATE_PASSWORD: string;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MIN_SECONDS_BETWEEN_COMMENTS = 20;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function checkModerateToken(token: string, env: Env): boolean {
  return !!env.MODERATE_PASSWORD && token === env.MODERATE_PASSWORD;
}

async function handleListComments(env: Env, url: URL): Promise<Response> {
  const postId = url.searchParams.get('postId');
  if (!postId) return json({ error: 'missing postId' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT id, name, body, created_at FROM comments WHERE post_id = ? AND hidden = 0 ORDER BY created_at ASC'
  )
    .bind(postId)
    .all();

  return json({ comments: results });
}

async function handlePostComment(request: Request, env: Env): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const postId = String(data.postId || '').trim();
  const name = String(data.name || '').trim().slice(0, 50);
  const body = String(data.body || '').trim().slice(0, 2000);
  const honeypot = String(data.website || '').trim();

  if (!postId || !name || !body) {
    return json({ error: '請填寫名字跟留言內容' }, 400);
  }

  if (honeypot) {
    // Likely a bot filling the hidden field — pretend success without saving.
    return json({ ok: true });
  }

  const ip = request.headers.get('cf-connecting-ip') || '';
  const now = Date.now();

  if (ip) {
    const recent = await env.DB.prepare('SELECT created_at FROM comments WHERE ip = ? ORDER BY created_at DESC LIMIT 1')
      .bind(ip)
      .first<{ created_at: number }>();
    if (recent && now - recent.created_at < MIN_SECONDS_BETWEEN_COMMENTS * 1000) {
      return json({ error: '留言太頻繁，請稍等再試' }, 429);
    }
  }

  await env.DB.prepare('INSERT INTO comments (post_id, name, body, ip, created_at, hidden) VALUES (?, ?, ?, ?, ?, 0)')
    .bind(postId, name, body, ip, now)
    .run();

  return json({ ok: true, comment: { name, body, created_at: now } });
}

async function handleModerateList(env: Env, url: URL): Promise<Response> {
  if (!checkModerateToken(url.searchParams.get('token') || '', env)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const { results } = await env.DB.prepare(
    'SELECT id, post_id, name, body, created_at FROM comments ORDER BY created_at DESC LIMIT 200'
  ).all();

  return json({ comments: results });
}

async function handleModerateDelete(request: Request, env: Env): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  if (!checkModerateToken(String(data.token || ''), env)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const id = Number(data.id);
  if (!id) return json({ error: 'missing id' }, 400);

  await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/comments' && request.method === 'GET') {
      return handleListComments(env, url);
    }

    if (url.pathname === '/api/comments' && request.method === 'POST') {
      return handlePostComment(request, env);
    }

    if (url.pathname === '/api/moderate/comments' && request.method === 'GET') {
      return handleModerateList(env, url);
    }

    if (url.pathname === '/api/moderate/delete' && request.method === 'POST') {
      return handleModerateDelete(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
