import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../../lib/initDb';
import { getDb } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/auth';

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  content: z.string(),
  objective: z.string().optional(),
  orderIndex: z.number().optional(),
  estimatedMinutes: z.number().optional()
});

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  complianceCode: z.string(),
  estimatedMinutes: z.number().optional(),
  modules: z.array(moduleSchema)
});

interface Params {
  params: { courseId: string };
}

export async function PUT(request: NextRequest, { params }: Params) {
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
  await sql`
    UPDATE courses
    SET title = ${title},
        description = ${description},
        category = ${category},
        compliance_code = ${complianceCode},
        estimated_minutes = ${estimatedMinutes || null},
        updated_at = NOW()
    WHERE id = ${params.courseId}
  `;
  await sql`DELETE FROM course_modules WHERE course_id = ${params.courseId}`;
  for (const [index, module] of modules.entries()) {
    await sql`
      INSERT INTO course_modules (course_id, title, content, objective, order_index, estimated_minutes)
      VALUES (${params.courseId}, ${module.title}, ${module.content}, ${module.objective || null},
              ${module.orderIndex ?? index + 1}, ${module.estimatedMinutes || 10})
    `;
  }
  return NextResponse.json({ id: params.courseId });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await ensureDb();
  const sql = getDb();
  await sql`DELETE FROM courses WHERE id = ${params.courseId}`;
  return NextResponse.json({});
}
