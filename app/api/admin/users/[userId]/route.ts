import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../../lib/initDb';
import { getDb } from '../../../../../lib/db';
import { hashPassword, requireAdmin } from '../../../../../lib/auth';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'learner']),
  password: z.string().min(8).optional()
});

interface Params {
  params: { userId: string };
}

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
  }
  await ensureDb();
  const sql = getDb();
  const { name, email, role, password } = parsed.data;
  await sql`
    UPDATE users
    SET name = ${name},
        email = ${email},
        role = ${role}
    WHERE id = ${params.userId}
  `;
  if (password) {
    const passwordHash = await hashPassword(password);
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${params.userId}
    `;
  }
  return NextResponse.json({ id: params.userId });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await ensureDb();
  const sql = getDb();
  await sql`DELETE FROM users WHERE id = ${params.userId}`;
  return NextResponse.json({});
}
