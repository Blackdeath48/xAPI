import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDb } from '../../../../lib/initDb';
import { getDb } from '../../../../lib/db';
import { createToken, verifyPassword } from '../../../../lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parse = loginSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
  }

  await ensureDb();
  const sql = getDb();
  const { email, password } = parse.data;
  const users = await sql`
    SELECT id, name, email, role, password_hash
    FROM users
    WHERE email = ${email}
  `;
  if (!users.length) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }
  const user = users[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }
  const token = createToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}
