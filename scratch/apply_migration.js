import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const pgConnectionString = 'postgresql://postgres.gcknzlnumcryvqjvjnyg:Bebechou134@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function apply() {
  const client = new Client({ connectionString: pgConnectionString });
  await client.connect();

  try {
    const migrationPath = path.resolve('supabase/migrations/20260701130000_028_v4_ecosystem_platforms.sql');
    console.log(`Reading migration from ${migrationPath}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

apply().catch(console.error);
