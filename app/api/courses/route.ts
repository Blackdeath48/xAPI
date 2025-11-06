import { NextResponse } from 'next/server';
import { ensureDb } from '../../../lib/initDb';
import { getDb } from '../../../lib/db';

export async function GET() {
  await ensureDb();
  const sql = getDb();
  const rows = await sql`
    SELECT c.id,
           c.title,
           c.description,
           c.category,
           c.compliance_code,
           c.estimated_minutes,
           COALESCE(AVG(e.progress), 0)::float AS completion
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  const courses = rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    complianceCode: row.compliance_code,
    estimatedMinutes: row.estimated_minutes,
    completion: Number(row.completion || 0)
  }));

  return NextResponse.json({ courses });
}
