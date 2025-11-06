import { NextResponse } from 'next/server';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';

interface Params {
  params: { courseId: string };
}

export async function GET(_: Request, { params }: Params) {
  await ensureDb();
  const sql = getDb();
  const courses = await sql`
    SELECT id, title, description
    FROM courses
    WHERE id = ${params.courseId}
  `;
  if (!courses.length) {
    return NextResponse.json({ message: 'Course not found' }, { status: 404 });
  }
  const modules = await sql`
    SELECT id, title, content, objective, order_index, estimated_minutes
    FROM course_modules
    WHERE course_id = ${params.courseId}
    ORDER BY order_index ASC
  `;
  const course = {
    id: courses[0].id,
    title: courses[0].title,
    description: courses[0].description,
    modules: modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      content: module.content,
      objective: module.objective,
      orderIndex: module.order_index,
      estimatedMinutes: module.estimated_minutes
    }))
  };
  return NextResponse.json({ course });
}
