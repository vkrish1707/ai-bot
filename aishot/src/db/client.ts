import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'aishot.db';

const sqlite = openDatabaseSync(DB_NAME);

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    ended_at INTEGER,
    intent_subject TEXT,
    intent_mood TEXT,
    intent_style TEXT,
    intent_constraints TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, at)`,
  `CREATE TABLE IF NOT EXISTS captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    asset_id TEXT,
    local_uri TEXT,
    iso REAL NOT NULL,
    shutter_seconds REAL NOT NULL,
    ev REAL NOT NULL,
    wb_kelvin REAL NOT NULL,
    critique TEXT,
    taken_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_captures_session ON captures(session_id, taken_at)`,
];

sqlite.execSync('PRAGMA journal_mode = WAL');
for (const stmt of SCHEMA_SQL) sqlite.execSync(stmt);

export const db = drizzle(sqlite, { schema });
export { schema };
