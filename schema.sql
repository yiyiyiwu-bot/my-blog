CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  ip TEXT,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- 祝福樹（人生小島的公園）。worker 第一次用到時也會自動建立
CREATE TABLE IF NOT EXISTS bless_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bless_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  ip TEXT,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bless_likes (
  event_id INTEGER NOT NULL,
  visitor TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, visitor)
);

CREATE INDEX IF NOT EXISTS idx_bless_comments_event ON bless_comments(event_id);
