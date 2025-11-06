import { getDb } from './db';
import { ensureDb } from './initDb';

export async function getAdminAnalytics(courseId?: string) {
  await ensureDb();
  const sql = getDb();

  const filters = courseId ? sql`WHERE course_id = ${courseId}` : sql``;

  const learners = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'learner'`;
  const avgCompletion = await sql`
    SELECT COALESCE(AVG(progress), 0)::float AS avg
    FROM enrollments
    ${filters}
  `;
  const avgScore = await sql`
    SELECT COALESCE(AVG(score), 0)::float AS avg
    FROM enrollments
    ${filters}
  `;
  const statementCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM xapi_statements
    ${filters}
  `;

  const leaderboard = await sql`
    SELECT u.id, u.name, COALESCE(e.progress, 0) AS completion, e.score
    FROM users u
    LEFT JOIN enrollments e ON e.user_id = u.id
    ${courseId ? sql`AND e.course_id = ${courseId}` : sql``}
    WHERE u.role = 'learner'
    ORDER BY COALESCE(e.progress, 0) DESC NULLS LAST
    LIMIT 10
  `;

  const courseBreakdown = await sql`
    SELECT c.id AS course_id,
           c.title,
           COALESCE(AVG(e.progress), 0)::float AS completion,
           COALESCE(AVG(e.score), 0)::float AS average_score,
           COALESCE(SUM(e.time_spent_seconds) / 60.0, 0)::float AS time_spent_minutes
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    ${courseId ? sql`WHERE c.id = ${courseId}` : sql``}
    GROUP BY c.id
    ORDER BY c.title
  `;

  return {
    totalLearners: learners[0]?.count || 0,
    averageCompletion: Number(avgCompletion[0]?.avg || 0),
    averageScore: Number(avgScore[0]?.avg || 0),
    totalStatements: statementCount[0]?.count || 0,
    leaderboard: leaderboard.map((item: any) => ({
      userId: item.id,
      name: item.name,
      completion: Number(item.completion || 0),
      score: item.score !== null ? Number(item.score) : null
    })),
    courseBreakdown: courseBreakdown.map((item: any) => ({
      courseId: item.course_id,
      title: item.title,
      completion: Number(item.completion || 0),
      averageScore: item.average_score ? Number(item.average_score) : null,
      timeSpentMinutes: Number(item.time_spent_minutes || 0)
    }))
  };
}
