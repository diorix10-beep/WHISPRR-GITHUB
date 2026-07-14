import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.gcknzlnumcryvqjvjnyg:Bebechou134@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("--- Checking all tables in public schema ---");
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log("Tables found:", tablesRes.rows.map(r => r.table_name));

  console.log("--- Checking schema_migrations table ---");
  try {
    const migsRes = await client.query(`
      SELECT version 
      FROM supabase_migrations.schema_migrations
      ORDER BY version;
    `);
    console.log("Applied migrations:", migsRes.rows.map(r => r.version));
  } catch (e) {
    console.log("Failed to query schema_migrations:", e.message);
  }

  await client.end();
}

main().catch(console.error);
