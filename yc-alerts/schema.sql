-- yc-alerts D1 schema (apply with: npx wrangler d1 execute yc_alerts --file=schema.sql --remote)
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,                      -- optional, used only in greetings
  token        TEXT UNIQUE NOT NULL,      -- manage/unsubscribe token (magic link)
  created_at   TEXT NOT NULL,
  confirmed_at TEXT,                      -- NULL until double opt-in click
  unsub_at     TEXT,                      -- set on unsubscribe; kept for consent audit
  n_tabs     INTEGER NOT NULL DEFAULT 0,  -- site-news: new dashboards & tools
  n_shorts   INTEGER NOT NULL DEFAULT 0,  -- site-news: new shorts & movies
  n_research INTEGER NOT NULL DEFAULT 0   -- site-news: papers, decks
);

CREATE TABLE IF NOT EXISTS rules (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id),
  metric    TEXT NOT NULL,                -- one of the METRICS keys in worker.js
  threshold REAL NOT NULL,                -- basis points, absolute 1-day change
  enabled   INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sends (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  asof    TEXT NOT NULL,                  -- metrics date the send was for
  n_fired INTEGER NOT NULL,
  sent_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS sends_once ON sends(user_id, asof);
