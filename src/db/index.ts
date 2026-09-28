import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    // ✅ Prefer DATABASE_URL (single Neon string). Fall back to 4-var style.
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 15000,
        ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
        ssl: process.env.SQL_HOST?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { pool };
