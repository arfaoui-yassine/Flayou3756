import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { DataSoukEvent, EventType, QueueItem } from '@datasouk/shared';

const SCHEMA_SQL = `
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
`;

let db: Database.Database | null = null;

function getDbPath(): string {
  const fromEnv = process.env.DATASOUK_QUEUE_DB;
  if (fromEnv) return fromEnv;
  const base = process.env.DATASOUK_DATA_DIR ?? path.join(os.homedir(), '.datasouk');
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, 'queue.db');
}

export function initQueue(): void {
  if (db) return;
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.exec(SCHEMA_SQL);
}

function q(): Database.Database {
  if (!db) initQueue();
  return db!;
}

export function enqueue(event: DataSoukEvent): void {
  const event_type = event.event_type as EventType;
  const payload = JSON.stringify(event);
  q()
    .prepare(
      `INSERT INTO events_queue (event_type, payload, created_at, synced) VALUES (?, ?, ?, 0)`,
    )
    .run(event_type, payload, Date.now());
}

export function getPending(limit = 500): QueueItem[] {
  const rows = q()
    .prepare(
      `SELECT id, event_type, payload, created_at, synced, synced_at FROM events_queue WHERE synced = 0 ORDER BY id ASC LIMIT ?`,
    )
    .all(limit) as QueueItem[];
  return rows;
}

export function markSynced(ids: number[]): void {
  if (ids.length === 0) return;
  const now = Date.now();
  const stmt = q().prepare(`UPDATE events_queue SET synced = 1, synced_at = ? WHERE id = ?`);
  const tx = q().transaction((list: number[]) => {
    for (const id of list) stmt.run(now, id);
  });
  tx(ids);
}

export function getLastPolledAt(): Date {
  const row = q().prepare(`SELECT value FROM sync_state WHERE key = 'last_polled_at'`).get() as
    | { value: string }
    | undefined;
  return row ? new Date(row.value) : new Date(0);
}

export function setLastPolledAt(date: Date): void {
  q()
    .prepare(`INSERT INTO sync_state (key, value) VALUES ('last_polled_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .run(date.toISOString());
}

export function getPendingCount(): number {
  const row = q().prepare(`SELECT COUNT(*) as c FROM events_queue WHERE synced = 0`).get() as { c: number };
  return row.c;
}

export function getSyncedTodayCount(): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const row = q()
    .prepare(`SELECT COUNT(*) as c FROM events_queue WHERE synced = 1 AND synced_at >= ?`)
    .get(start.getTime()) as { c: number };
  return row.c;
}

export function getLastSyncAt(): string | null {
  const row = q()
    .prepare(`SELECT MAX(synced_at) as m FROM events_queue WHERE synced = 1`)
    .get() as { m: number | null } | undefined;
  if (!row?.m) return null;
  return new Date(row.m).toISOString();
}
