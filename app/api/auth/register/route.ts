import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parse = registerSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ message: 'Invalid payload', details: parse.error.issues }, { status: 400 });
  }

  await ensureDb();
  const sql = getDb();
  const { name, email, password } = parse.data;

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${passwordHash}, 'learner')
    RETURNING id, name, email, role, created_at
  `;

  return NextResponse.json({ user: user[0] }, { status: 201 });
}
