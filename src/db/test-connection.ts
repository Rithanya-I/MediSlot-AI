import 'dotenv/config';
import { db, createPool } from './index.ts';
import { specialists, users } from './schema.ts';
import { ensureClinicCatalogSeeded } from './repository.ts';

async function testConnection() {
  console.log('\n🔍 Testing Supabase Database Connection for MediSlot-AI...');
  console.log('------------------------------------------------------------');

  const dbUrl = process.env.DATABASE_URL;
  if (
    !dbUrl ||
    dbUrl.includes('[YOUR-PASSWORD]') ||
    dbUrl.includes('[password]') ||
    dbUrl.includes('[REGION]') ||
    dbUrl.includes('[project-ref]')
  ) {
    console.error('❌ DATABASE_URL contains placeholders that must be replaced with your Supabase credentials.');
    console.log('\n👉 To get your exact connection string:');
    console.log('1. Go to: https://supabase.com/dashboard/project/oscrngkopsnjqddscayx/settings/database');
    console.log('2. Scroll to the "Connection string" section and select "URI"');
    console.log('3. Select the "Mode: Transaction" (or "Mode: Session") pooler URL');
    console.log('4. Copy the URI and replace [YOUR-PASSWORD] with the database password you set when creating the project');
    console.log('5. Paste it into your .env file as DATABASE_URL\n');
    process.exit(1);
  }

  try {
    const pool = createPool();
    const client = await pool.connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL server!');
    
    const dbNameRes = await client.query('SELECT current_database(), current_user, version();');
    const { current_database, current_user } = dbNameRes.rows[0];
    console.log(`📊 Connected to Database: "${current_database}" as User: "${current_user}"`);
    client.release();

    console.log('\n📦 Verifying required tables in schema...');
    try {
      const userCount = await db.select().from(users).limit(1);
      console.log('✅ "users" table exists.');
    } catch (err: unknown) {
      console.warn('⚠️ Tables do not exist yet. Run `npm run db:setup` or paste `supabase_schema.sql` into Supabase SQL Editor.');
    }

    console.log('\n🌱 Initializing clinic catalog & specialist seeds...');
    await ensureClinicCatalogSeeded();
    const allSpecialists = await db.select().from(specialists);
    console.log(`✅ Specialists catalog verified (${allSpecialists.length} specialists active).`);

    console.log('\n🎉 Supabase integration is fully configured and ready!');
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('\n❌ Connection error:', message);
    if (message.includes('password authentication failed')) {
      console.error('💡 Hint: Check that the database password in DATABASE_URL is correct.');
    } else if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
      console.error('💡 Hint: Hostname not found. Verify your Supabase project reference and pooler domain.');
    }
    process.exit(1);
  }
}

testConnection();
