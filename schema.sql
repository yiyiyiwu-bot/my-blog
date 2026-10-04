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
