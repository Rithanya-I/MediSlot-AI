import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (
    url.includes('[YOUR-PASSWORD]') ||
    url.includes('[password]') ||
    url.includes('[REGION]') ||
    url.includes('[project-ref]')
  ) {
    return false;
  }
  return true;
};

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!isDatabaseConfigured() || !connectionString) {
      console.warn(
        '⚠️ Notice: Supabase DATABASE_URL is waiting for your password in .env.\n' +
        '  Running with in-memory store so the app is immediately testable.\n' +
        '  Configure your password in .env to persist to Supabase.'
      );
      // Create a dummy pool that won't attempt unconfigured remote TCP connection
      global._postgresPool = new Pool({ max: 0 });
      return global._postgresPool;
    }

    global._postgresPool = new Pool({
      connectionString,
      // Supabase (pooler or direct) requires SSL encryption
      ssl: connectionString.includes('supabase.co') || connectionString.includes('supabase.com')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle Supabase pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
