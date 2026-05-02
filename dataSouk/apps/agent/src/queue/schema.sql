CREATE TABLE IF NOT EXISTS events_queue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT NOT NULL,
  payload     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  synced      INTEGER DEFAULT 0,
  synced_at   INTEGER
);

CREATE TABLE IF NOT EXISTS sync_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO sync_state (key, value)
VALUES ('last_polled_at', '1970-01-01T00:00:00.000Z');
