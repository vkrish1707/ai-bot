import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  endedAt: integer('ended_at'),
  intentSubject: text('intent_subject'),
  intentMood: text('intent_mood'),
  intentStyle: text('intent_style'),
  intentConstraints: text('intent_constraints'),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  at: integer('at').notNull(),
});

export const captures = sqliteTable('captures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  assetId: text('asset_id'),
  localUri: text('local_uri'),
  iso: real('iso').notNull(),
  shutterSeconds: real('shutter_seconds').notNull(),
  ev: real('ev').notNull(),
  wbKelvin: real('wb_kelvin').notNull(),
  critique: text('critique'),
  takenAt: integer('taken_at').notNull(),
});

export type SessionRow = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type MessageRow = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
export type CaptureRow = typeof captures.$inferSelect;
export type CaptureInsert = typeof captures.$inferInsert;
