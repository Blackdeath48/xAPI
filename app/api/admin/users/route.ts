import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { hashPassword, requireAdmin } from '../../../../lib/auth';

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'learner']),
  password: z.string().min(8).optional()
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await ensureDb();
  const sql = getDb();
  const users = await sql`
    SELECT id, name, email, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json({
    users: users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    }))
  });
}

export async function POST(request: NextRequest) {
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
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
  }
  const passwordHash = await hashPassword(password || Math.random().toString(36).slice(2));
  const user = await sql`
    INSERT INTO users (name, email, role, password_hash)
    VALUES (${name}, ${email}, ${role}, ${passwordHash})
    RETURNING id
  `;
  return NextResponse.json({ id: user[0].id }, { status: 201 });
}
