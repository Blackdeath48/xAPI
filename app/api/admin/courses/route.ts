import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/auth';

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  content: z.string(),
  objective: z.string().optional(),
  orderIndex: z.number().optional(),
  estimatedMinutes: z.number().optional()
});

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  complianceCode: z.string(),
  estimatedMinutes: z.number().optional(),
  modules: z.array(moduleSchema)
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await ensureDb();
  const sql = getDb();
  const courses = await sql`
    SELECT id, title, description, category, compliance_code, estimated_minutes
    FROM courses
    ORDER BY updated_at DESC
  `;

  const modulesByCourse: Record<string, any[]> = {};
  await Promise.all(
    courses.map(async (course: any) => {
      const modules = await sql`
        SELECT id, course_id, title, content, objective, order_index, estimated_minutes
        FROM course_modules
        WHERE course_id = ${course.id}
        ORDER BY order_index ASC
      `;
      modulesByCourse[course.id] = modules.map((mod: any) => ({
        id: mod.id,
        title: mod.title,
        content: mod.content,
        objective: mod.objective,
        orderIndex: mod.order_index,
        estimatedMinutes: mod.estimated_minutes
      }));
    })
  );

  return NextResponse.json({
    courses: courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      complianceCode: course.compliance_code,
      estimatedMinutes: course.estimated_minutes,
      modules: modulesByCourse[course.id] || []
    }))
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
  }

  await ensureDb();
  const sql = getDb();
  const { title, description, category, complianceCode, estimatedMinutes, modules } = parsed.data;

  const course = await sql`
    INSERT INTO courses (title, description, category, compliance_code, estimated_minutes)
    VALUES (${title}, ${description}, ${category}, ${complianceCode}, ${estimatedMinutes || null})
    RETURNING id
  `;

  for (const [index, module] of modules.entries()) {
    await sql`
      INSERT INTO course_modules (course_id, title, content, objective, order_index, estimated_minutes)
      VALUES (${course[0].id}, ${module.title}, ${module.content}, ${module.objective || null},
              ${module.orderIndex ?? index + 1}, ${module.estimatedMinutes || 10})
    `;
  }

  return NextResponse.json({ id: course[0].id }, { status: 201 });
}
