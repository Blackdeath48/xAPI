import { neon, NeonQueryFunction } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var cachedSql: NeonQueryFunction<any> | null;
}

let sql: NeonQueryFunction<any>;

export function getDb(): NeonQueryFunction<any> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL env variable is required for Neon connection');
  }
  if (!global.cachedSql) {
    global.cachedSql = neon(process.env.DATABASE_URL);
  }
  sql = global.cachedSql;
  return sql;
}
