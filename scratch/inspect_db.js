import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.gcknzlnumcryvqjvjnyg:Bebechou134@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("--- Checking active policies on conversations ---");
  const policiesRes = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'conversations';
  `);
  console.log(JSON.stringify(policiesRes.rows, null, 2));

  console.log("--- Checking table columns on conversations ---");
  const columnsRes = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'conversations';
  `);
  console.log(JSON.stringify(columnsRes.rows, null, 2));

  console.log("--- Checking existing users ---");
  const usersRes = await client.query(`
    SELECT id, email, confirmed_at, raw_app_meta_data 
    FROM auth.users;
  `);
  console.log(JSON.stringify(usersRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
