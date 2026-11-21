import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL must be set in .env.\n' +
    'Get it from: Supabase Dashboard → Project Settings → Database → Connection string\n' +
    'Use the "Session" mode URL (port 5432) for migrations.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com')
      ? { rejectUnauthorized: false }
      : false,
  },
  verbose: true,
});
