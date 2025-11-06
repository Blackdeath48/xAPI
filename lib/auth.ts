import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ensureDb } from './initDb';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export interface AuthTokenPayload {
  userId: string;
  role: 'admin' | 'learner';
  email: string;
  name: string;
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  await ensureDb();
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return null;
  const sql = getDb();
  const users = await sql`
    SELECT id, name, email, role
    FROM users
    WHERE id = ${payload.userId}
  `;
  return users[0] || null;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
}
