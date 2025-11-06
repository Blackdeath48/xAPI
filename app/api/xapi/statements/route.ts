import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';

const statementSchema = z.object({
  verb: z.string(),
  courseId: z.string(),
  moduleId: z.string().optional(),
  moduleTitle: z.string().optional(),
  result: z.any().optional(),
  durationSeconds: z.number().optional(),
  score: z.number().optional()
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = statementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid xAPI statement', details: parsed.error.issues }, { status: 400 });
  }

  await ensureDb();
  const sql = getDb();
  const { verb, courseId, moduleId, moduleTitle, result, durationSeconds, score } = parsed.data;

  const statement = await sql`
    INSERT INTO xapi_statements (user_id, course_id, module_id, verb, object, raw_statement, result, duration_seconds, score)
    VALUES (${user.id}, ${courseId}, ${moduleId || null}, ${verb}, ${moduleTitle || null}, ${JSON.stringify(body)},
            ${typeof result === 'string' ? result : JSON.stringify(result)}, ${durationSeconds || null}, ${score || null})
    RETURNING id, created_at
  `;

  // Upsert enrollment progress
  const current = await sql`
    SELECT id, progress, score, time_spent_seconds
    FROM enrollments
    WHERE user_id = ${user.id} AND course_id = ${courseId}
  `;

  let progressDelta = 10;
  if (verb === 'completed') progressDelta = 100;
  if (verb === 'experienced') progressDelta = 50;
  const duration = durationSeconds || 0;

  if (current.length) {
    const newProgress = Math.min(100, Math.max(Number(current[0].progress || 0), progressDelta));
    const newScore = score !== undefined ? score : current[0].score;
    await sql`
      UPDATE enrollments
      SET progress = ${newProgress},
          score = ${newScore},
          time_spent_seconds = ${Number(current[0].time_spent_seconds || 0) + duration},
          status = ${verb === 'completed' ? 'completed' : 'in progress'},
          last_activity_at = NOW()
      WHERE id = ${current[0].id}
    `;
  } else {
    await sql`
      INSERT INTO enrollments (user_id, course_id, progress, score, time_spent_seconds, status, last_activity_at)
      VALUES (${user.id}, ${courseId}, ${progressDelta}, ${score || null}, ${duration},
              ${verb === 'completed' ? 'completed' : 'in progress'}, NOW())
    `;
  }

  return NextResponse.json({ id: statement[0].id, createdAt: statement[0].created_at });
}
