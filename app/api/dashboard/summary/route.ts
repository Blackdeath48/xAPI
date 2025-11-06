import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await ensureDb();
  const sql = getDb();

  const enrollments = await sql`
    SELECT e.course_id,
           c.title,
           e.progress,
           e.score,
           e.status,
           e.time_spent_seconds
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${user.id}
  `;

  const statements = await sql`
    SELECT id, verb, object, created_at
    FROM xapi_statements
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({
    dashboard: {
      learnerName: user.name,
      items: enrollments.map((item: any) => ({
        courseId: item.course_id,
        title: item.title,
        progress: Number(item.progress || 0),
        score: item.score !== null ? Number(item.score) : null,
        status: item.status,
        timeSpentMinutes: Number(item.time_spent_seconds || 0) / 60
      })),
      recentStatements: statements.map((row: any) => ({
        id: row.id,
        verb: row.verb,
        object: row.object,
        timestamp: row.created_at
      }))
    }
  });
}
