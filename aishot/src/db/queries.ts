import { desc, eq } from 'drizzle-orm';
import { db, schema } from './client';
import type {
  CaptureInsert,
  CaptureRow,
  MessageInsert,
  MessageRow,
  SessionInsert,
  SessionRow,
} from './schema';

export async function upsertSession(s: SessionInsert): Promise<void> {
  await db
    .insert(schema.sessions)
    .values(s)
    .onConflictDoUpdate({
      target: schema.sessions.id,
      set: {
        intentSubject: s.intentSubject ?? null,
        intentMood: s.intentMood ?? null,
        intentStyle: s.intentStyle ?? null,
        intentConstraints: s.intentConstraints ?? null,
        endedAt: s.endedAt ?? null,
      },
    });
}

export async function insertMessage(m: MessageInsert): Promise<void> {
  await db.insert(schema.messages).values(m);
}

export async function insertCapture(c: CaptureInsert): Promise<number> {
  const inserted = await db
    .insert(schema.captures)
    .values(c)
    .returning({ id: schema.captures.id });
  return inserted[0]?.id ?? 0;
}

export async function updateCaptureCritique(
  id: number,
  critique: string,
): Promise<void> {
  await db.update(schema.captures).set({ critique }).where(eq(schema.captures.id, id));
}

export async function listSessions(limit = 50): Promise<SessionRow[]> {
  return db
    .select()
    .from(schema.sessions)
    .orderBy(desc(schema.sessions.createdAt))
    .limit(limit);
}

export async function getSession(id: string): Promise<SessionRow | undefined> {
  const rows = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id))
    .limit(1);
  return rows[0];
}

export async function listMessages(sessionId: string): Promise<MessageRow[]> {
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.sessionId, sessionId))
    .orderBy(schema.messages.at);
}

export async function listCaptures(sessionId: string): Promise<CaptureRow[]> {
  return db
    .select()
    .from(schema.captures)
    .where(eq(schema.captures.sessionId, sessionId))
    .orderBy(desc(schema.captures.takenAt));
}

export async function getLatestCaptureForSession(
  sessionId: string,
): Promise<CaptureRow | undefined> {
  const rows = await db
    .select()
    .from(schema.captures)
    .where(eq(schema.captures.sessionId, sessionId))
    .orderBy(desc(schema.captures.takenAt))
    .limit(1);
  return rows[0];
}

export async function captureCountForSession(sessionId: string): Promise<number> {
  const rows = await db
    .select({ id: schema.captures.id })
    .from(schema.captures)
    .where(eq(schema.captures.sessionId, sessionId));
  return rows.length;
}
