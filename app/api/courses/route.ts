import { randomUUID } from 'node:crypto';

import { and, eq, notInArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import {
  courses,
  lessons,
  modules,
  quizQuestions,
} from '@/db/schema/course';

type QuizQuestionPayload = {
  id?: string;
  prompt: string;
  type?: string;
  options?: Array<{ value: string; label: string }>;
  answer?: string | string[] | null;
  metadata?: Record<string, unknown> | null;
  sortOrder?: number;
};

type LessonPayload = {
  id?: string;
  title: string;
  description?: string | null;
  content?: string | null;
  type?: 'lesson' | 'quiz';
  sortOrder?: number;
  estimatedMinutes?: number | null;
  quizQuestions?: QuizQuestionPayload[];
};

type ModulePayload = {
  id?: string;
  title: string;
  description?: string | null;
  sortOrder?: number;
  lessons?: LessonPayload[];
};

type CoursePayload = {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  modules?: ModulePayload[];
};

function ensureId(id?: string) {
  return id ?? randomUUID();
}

export async function GET() {
  const data = await db.query.courses.findMany({
    with: {
      modules: {
        orderBy: (module, { asc }) => [asc(module.sortOrder)],
        with: {
          lessons: {
            orderBy: (lesson, { asc }) => [asc(lesson.sortOrder)],
            with: {
              quizQuestions: {
                orderBy: (question, { asc }) => [asc(question.sortOrder)],
              },
            },
          },
        },
      },
    },
    orderBy: (course, { asc }) => [asc(course.createdAt)],
  });

  return NextResponse.json({ courses: data });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CoursePayload;

  if (!payload.slug || !payload.title) {
    return NextResponse.json(
      { error: 'A course slug and title are required.' },
      { status: 400 },
    );
  }

  const result = await db.transaction(async (tx) => {
    const [courseRecord] = await tx
      .insert(courses)
      .values({
        id: payload.id,
        slug: payload.slug,
        title: payload.title,
        description: payload.description ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: courses.slug,
        set: {
          title: payload.title,
          description: payload.description ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!courseRecord) {
      throw new Error('Failed to persist course record.');
    }

    const modulePayloads = payload.modules ?? [];
    const moduleIds: string[] = [];

    for (const modulePayload of modulePayloads) {
      const moduleId = ensureId(modulePayload.id);
      moduleIds.push(moduleId);

      const moduleInsertValues = {
        id: moduleId,
        courseId: courseRecord.id,
        title: modulePayload.title,
        description: modulePayload.description ?? null,
        sortOrder: modulePayload.sortOrder ?? 0,
        updatedAt: new Date(),
      } as const;

      const existingModule = modulePayload.id
        ? await tx.query.modules.findFirst({
            where: (module, { eq: eqWhere }) =>
              eqWhere(module.id, modulePayload.id as string),
          })
        : null;

      if (existingModule) {
        await tx
          .update(modules)
          .set({
            courseId: courseRecord.id,
            title: modulePayload.title,
            description: modulePayload.description ?? null,
            sortOrder: modulePayload.sortOrder ?? 0,
            updatedAt: new Date(),
          })
          .where(eq(modules.id, existingModule.id));
      } else {
        await tx.insert(modules).values({ ...moduleInsertValues, createdAt: new Date() });
      }

      const lessonPayloads = modulePayload.lessons ?? [];
      const lessonIds: string[] = [];

      for (const lessonPayload of lessonPayloads) {
        const lessonId = ensureId(lessonPayload.id);
        lessonIds.push(lessonId);

        const lessonInsertValues = {
          id: lessonId,
          moduleId,
          title: lessonPayload.title,
          description: lessonPayload.description ?? null,
          content: lessonPayload.content ?? null,
          type: lessonPayload.type ?? 'lesson',
          sortOrder: lessonPayload.sortOrder ?? 0,
          estimatedMinutes: lessonPayload.estimatedMinutes ?? null,
          updatedAt: new Date(),
        } as const;

        const existingLesson = lessonPayload.id
          ? await tx.query.lessons.findFirst({
              where: (lesson, { eq: eqWhere }) =>
                eqWhere(lesson.id, lessonPayload.id as string),
            })
          : null;

        if (existingLesson) {
          await tx
            .update(lessons)
            .set({
              moduleId,
              title: lessonPayload.title,
              description: lessonPayload.description ?? null,
              content: lessonPayload.content ?? null,
              type: lessonPayload.type ?? 'lesson',
              sortOrder: lessonPayload.sortOrder ?? 0,
              estimatedMinutes: lessonPayload.estimatedMinutes ?? null,
              updatedAt: new Date(),
            })
            .where(eq(lessons.id, existingLesson.id));
        } else {
          await tx.insert(lessons).values({ ...lessonInsertValues, createdAt: new Date() });
        }

        const questionPayloads = lessonPayload.quizQuestions ?? [];
        const questionIds: string[] = [];

        for (const questionPayload of questionPayloads) {
          const questionId = ensureId(questionPayload.id);
          questionIds.push(questionId);

          const questionInsertValues = {
            id: questionId,
            lessonId,
            prompt: questionPayload.prompt,
            type: questionPayload.type ?? 'multiple-choice',
            options: questionPayload.options ?? null,
            answer: questionPayload.answer ?? null,
            metadata: questionPayload.metadata ?? null,
            sortOrder: questionPayload.sortOrder ?? 0,
            updatedAt: new Date(),
          } as const;

          const existingQuestion = questionPayload.id
            ? await tx.query.quizQuestions.findFirst({
                where: (question, { eq: eqWhere }) =>
                  eqWhere(question.id, questionPayload.id as string),
              })
            : null;

          if (existingQuestion) {
            await tx
              .update(quizQuestions)
              .set({
                lessonId,
                prompt: questionPayload.prompt,
                type: questionPayload.type ?? 'multiple-choice',
                options: questionPayload.options ?? null,
                answer: questionPayload.answer ?? null,
                metadata: questionPayload.metadata ?? null,
                sortOrder: questionPayload.sortOrder ?? 0,
                updatedAt: new Date(),
              })
              .where(eq(quizQuestions.id, existingQuestion.id));
          } else {
            await tx
              .insert(quizQuestions)
              .values({ ...questionInsertValues, createdAt: new Date() });
          }
        }

        if (questionIds.length > 0) {
          await tx
            .delete(quizQuestions)
            .where(
              and(
                eq(quizQuestions.lessonId, lessonId),
                notInArray(quizQuestions.id, questionIds),
              ),
            );
        } else {
          await tx.delete(quizQuestions).where(eq(quizQuestions.lessonId, lessonId));
        }
      }

      if (lessonIds.length > 0) {
        await tx
          .delete(lessons)
          .where(and(eq(lessons.moduleId, moduleId), notInArray(lessons.id, lessonIds)));
      } else {
        await tx.delete(lessons).where(eq(lessons.moduleId, moduleId));
      }
    }

    if (moduleIds.length > 0) {
      await tx
        .delete(modules)
        .where(and(eq(modules.courseId, courseRecord.id), notInArray(modules.id, moduleIds)));
    } else {
      await tx.delete(modules).where(eq(modules.courseId, courseRecord.id));
    }

    return courseRecord.id;
  });

  const course = await db.query.courses.findFirst({
    where: (course, { eq }) => eq(course.id, result),
    with: {
      modules: {
        orderBy: (module, { asc }) => [asc(module.sortOrder)],
        with: {
          lessons: {
            orderBy: (lesson, { asc }) => [asc(lesson.sortOrder)],
            with: {
              quizQuestions: {
                orderBy: (question, { asc }) => [asc(question.sortOrder)],
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
