import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const lessonTypeEnum = pgEnum('lesson_type', ['lesson', 'quiz']);

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(module) => ({
  courseIdx: index('modules_course_idx').on(module.courseId),
  sortIdx: index('modules_sort_idx').on(module.courseId, module.sortOrder),
}));

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'),
  type: lessonTypeEnum('type').default('lesson').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  estimatedMinutes: integer('estimated_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(lesson) => ({
  moduleIdx: index('lessons_module_idx').on(lesson.moduleId),
  sortIdx: index('lessons_sort_idx').on(lesson.moduleId, lesson.sortOrder),
}));

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  type: varchar('type', { length: 32 }).default('multiple-choice').notNull(),
  options: jsonb('options').$type<Array<{ value: string; label: string }> | null>(),
  answer: jsonb('answer').$type<string | string[] | null>(),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(question) => ({
  lessonIdx: index('quiz_questions_lesson_idx').on(question.lessonId),
}));

export const courseRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
}));

export const moduleRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  quizQuestions: many(quizQuestions),
}));

export const quizQuestionRelations = relations(quizQuestions, ({ one }) => ({
  lesson: one(lessons, {
    fields: [quizQuestions.lessonId],
    references: [lessons.id],
  }),
}));
