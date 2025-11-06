import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { lessons } from './course';

export const learnerProgress = pgTable('learner_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  learnerId: varchar('learner_id', { length: 255 }).notNull(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).default('not-started').notNull(),
  score: integer('score'),
  passed: boolean('passed'),
  completion: integer('completion'),
  xapiStatementId: varchar('xapi_statement_id', { length: 255 }),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
},
(progress) => ({
  learnerLessonIdx: index('learner_progress_learner_lesson_idx').on(
    progress.learnerId,
    progress.lessonId,
  ).unique(),
}));

export const xapiStatements = pgTable('xapi_statements', {
  id: uuid('id').defaultRandom().primaryKey(),
  learnerId: varchar('learner_id', { length: 255 }).notNull(),
  statementId: varchar('statement_id', { length: 255 }).notNull(),
  verb: varchar('verb', { length: 255 }),
  objectId: varchar('object_id', { length: 255 }),
  rawEvent: jsonb('raw_event').$type<Record<string, unknown>>().notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
},
(statement) => ({
  learnerIdx: index('xapi_statements_learner_idx').on(statement.learnerId),
  statementIdIdx: index('xapi_statement_id_idx').on(statement.statementId).unique(),
}));

export const learnerProgressRelations = relations(learnerProgress, ({ one }) => ({
  lesson: one(lessons, {
    fields: [learnerProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const xapiStatementRelations = relations(xapiStatements, ({ one }) => ({
  progress: one(learnerProgress, {
    fields: [xapiStatements.statementId],
    references: [learnerProgress.xapiStatementId],
  }),
}));
