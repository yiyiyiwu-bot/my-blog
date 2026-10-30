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

/* ---------- 祝福樹（人生小島的公園）：事件只有管理者能新增，大家可以按愛心、留言 ---------- */
const BLESS_MIN_SECONDS_BETWEEN_COMMENTS = 20;
let blessTablesReady: Promise<unknown> | null = null;

// 第一次用到時自動建好資料表（已經有就不動）
function ensureBlessTables(env: Env): Promise<unknown> {
  blessTablesReady ||= env.DB.batch([
    env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS bless_events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT \'\', created_at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0)'
    ),
    env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS bless_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, name TEXT NOT NULL, body TEXT NOT NULL, ip TEXT, created_at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0)'
    ),
    env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS bless_likes (event_id INTEGER NOT NULL, visitor TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (event_id, visitor))'
    ),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_bless_comments_event ON bless_comments(event_id)'),
  ]).catch((err) => {
    blessTablesReady = null;
    throw err;
  });
  return blessTablesReady;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const cleanVisitor = (v: unknown) => String(v || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);

async function blessEvents(env: Env, visitor: string, withHidden = false) {
  const { results: events } = await env.DB.prepare(
    `SELECT e.id, e.title, e.body, e.created_at, e.hidden,
       (SELECT COUNT(*) FROM bless_likes l WHERE l.event_id = e.id) AS likes,
       (SELECT COUNT(*) FROM bless_likes l WHERE l.event_id = e.id AND l.visitor = ?) AS liked
     FROM bless_events e ${withHidden ? '' : 'WHERE e.hidden = 0'} ORDER BY e.created_at DESC LIMIT 50`
  )
    .bind(visitor)
    .all<{ id: number }>();
  const { results: comments } = await env.DB.prepare(
    `SELECT id, event_id, name, body, created_at, hidden FROM bless_comments ${withHidden ? '' : 'WHERE hidden = 0'} ORDER BY created_at ASC LIMIT 2000`
  ).all<{ event_id: number }>();
  return events.map((e) => ({ ...e, comments: comments.filter((c) => c.event_id === e.id) }));
}

async function handleBlessList(env: Env, url: URL): Promise<Response> {
  await ensureBlessTables(env);
  return json({ events: await blessEvents(env, cleanVisitor(url.searchParams.get('visitor'))) });
}

async function handleBlessLike(request: Request, env: Env): Promise<Response> {
  await ensureBlessTables(env);
  const data = await readJson(request);
  if (!data) return json({ error: 'invalid json' }, 400);
  const eventId = Number(data.eventId);
  const visitor = cleanVisitor(data.visitor);
  if (!eventId || visitor.length < 8) return json({ error: 'missing eventId or visitor' }, 400);

  const event = await env.DB.prepare('SELECT id FROM bless_events WHERE id = ? AND hidden = 0').bind(eventId).first();
  if (!event) return json({ error: 'not found' }, 404);

  // 按一下送愛心，再按一下收回
  const had = await env.DB.prepare('SELECT 1 FROM bless_likes WHERE event_id = ? AND visitor = ?').bind(eventId, visitor).first();
  if (had) await env.DB.prepare('DELETE FROM bless_likes WHERE event_id = ? AND visitor = ?').bind(eventId, visitor).run();
  else await env.DB.prepare('INSERT INTO bless_likes (event_id, visitor, created_at) VALUES (?, ?, ?)').bind(eventId, visitor, Date.now()).run();

  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM bless_likes WHERE event_id = ?').bind(eventId).first<{ n: number }>();
  return json({ ok: true, liked: !had, likes: count?.n || 0 });
}

async function handleBlessComment(request: Request, env: Env): Promise<Response> {
  await ensureBlessTables(env);
  const data = await readJson(request);
  if (!data) return json({ error: 'invalid json' }, 400);
  const eventId = Number(data.eventId);
  const name = String(data.name || '').trim().slice(0, 30);
  const body = String(data.body || '').trim().slice(0, 500);
  if (!eventId || !name || !body) return json({ error: '請填寫名字跟祝福的話' }, 400);
  if (String(data.website || '').trim()) return json({ ok: true }); // 機器人填了隱藏欄位，假裝成功

  const event = await env.DB.prepare('SELECT id FROM bless_events WHERE id = ? AND hidden = 0').bind(eventId).first();
  if (!event) return json({ error: 'not found' }, 404);

  const ip = request.headers.get('cf-connecting-ip') || '';
  const now = Date.now();
  if (ip) {
    const recent = await env.DB.prepare('SELECT created_at FROM bless_comments WHERE ip = ? ORDER BY created_at DESC LIMIT 1')
      .bind(ip)
      .first<{ created_at: number }>();
    if (recent && now - recent.created_at < BLESS_MIN_SECONDS_BETWEEN_COMMENTS * 1000) {
      return json({ error: '留言太頻繁，請稍等再試' }, 429);
    }
  }

  const res = await env.DB.prepare('INSERT INTO bless_comments (event_id, name, body, ip, created_at, hidden) VALUES (?, ?, ?, ?, ?, 0)')
    .bind(eventId, name, body, ip, now)
    .run();
  return json({ ok: true, comment: { id: res.meta.last_row_id, event_id: eventId, name, body, created_at: now } });
}

// 管理：用審核密碼；list 看全部、create 新增事件、update 修改、hide 隱藏/顯示、delete 刪除事件、deleteComment 刪除留言
async function handleBlessAdmin(request: Request, env: Env): Promise<Response> {
  await ensureBlessTables(env);
  const data = await readJson(request);
  if (!data) return json({ error: 'invalid json' }, 400);
  if (!checkModerateToken(String(data.token || ''), env)) return json({ error: 'unauthorized' }, 401);

  const action = String(data.action || '');
  const id = Number(data.id);
  const title = String(data.title || '').trim().slice(0, 80);
  const body = String(data.body || '').trim().slice(0, 1000);

  if (action === 'create') {
    if (!title) return json({ error: '請填寫事件標題' }, 400);
    await env.DB.prepare('INSERT INTO bless_events (title, body, created_at, hidden) VALUES (?, ?, ?, 0)').bind(title, body, Date.now()).run();
  } else if (action === 'update') {
    if (!id || !title) return json({ error: '請填寫事件標題' }, 400);
    await env.DB.prepare('UPDATE bless_events SET title = ?, body = ? WHERE id = ?').bind(title, body, id).run();
  } else if (action === 'hide') {
    if (!id) return json({ error: 'missing id' }, 400);
    await env.DB.prepare('UPDATE bless_events SET hidden = ? WHERE id = ?').bind(data.hidden ? 1 : 0, id).run();
  } else if (action === 'delete') {
    if (!id) return json({ error: 'missing id' }, 400);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM bless_comments WHERE event_id = ?').bind(id),
      env.DB.prepare('DELETE FROM bless_likes WHERE event_id = ?').bind(id),
      env.DB.prepare('DELETE FROM bless_events WHERE id = ?').bind(id),
    ]);
  } else if (action === 'deleteComment') {
    if (!id) return json({ error: 'missing id' }, 400);
    await env.DB.prepare('DELETE FROM bless_comments WHERE id = ?').bind(id).run();
  } else if (action !== 'list') {
    return json({ error: 'unknown action' }, 400);
  }
  return json({ ok: true, events: await blessEvents(env, '', true) });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/bless' && request.method === 'GET') return handleBlessList(env, url);
    if (url.pathname === '/api/bless/like' && request.method === 'POST') return handleBlessLike(request, env);
    if (url.pathname === '/api/bless/comment' && request.method === 'POST') return handleBlessComment(request, env);
    if (url.pathname === '/api/bless/admin' && request.method === 'POST') return handleBlessAdmin(request, env);

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
