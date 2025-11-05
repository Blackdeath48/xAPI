import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as schema from '@/db/schema';

type Database = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db: Database | undefined;
};

export function getDatabase(): Database {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not configured');
  }

  if (!globalForDb.db) {
    const client = neon(process.env.NEON_DATABASE_URL);
    globalForDb.db = drizzle(client, { schema });
  }

  return globalForDb.db;
}

export const db = getDatabase();
export type { Database };
