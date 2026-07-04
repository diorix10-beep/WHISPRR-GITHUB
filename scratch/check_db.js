import pg from 'pg';
const { Client } = pg;

const pgConnectionString = 'postgresql://postgres.gcknzlnumcryvqjvjnyg:Bebechou134@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const testUserId = '6b886301-6e57-47c2-98e5-4b49c2549960'; // Confirmed user ID from auth.users

async function check() {
  const pgClient = new Client({ connectionString: pgConnectionString });
  await pgClient.connect();
  
  try {
    console.log("Simulating authenticated session in PostgreSQL transaction...");
    await pgClient.query('BEGIN');
    
    // Set settings to simulate Supabase PostgREST session
    await pgClient.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [testUserId]);
    await pgClient.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
    await pgClient.query(`SET ROLE authenticated`);
    
    // Check auth.uid() and auth.role()
    const authCheck = await pgClient.query(`SELECT auth.uid() as uid, auth.role() as role`);
    console.log("Simulated Session auth.uid():", authCheck.rows[0].uid);
    console.log("Simulated Session auth.role():", authCheck.rows[0].role);
    
    console.log(`Inserting conversation as user ${testUserId}...`);

    const insertRes = await pgClient.query(`
      INSERT INTO public.conversations (type, created_by) 
      VALUES ('dm', $1) 
      RETURNING id
    `, [testUserId]);
    
    const convId = insertRes.rows[0].id;
    console.log("Insert conversation success! ID:", convId);
    
    // Now let's try to add a participant as the creator of the conversation
    console.log("Inserting conversation participant...");
    const participantRes = await pgClient.query(`
      INSERT INTO public.conversation_participants (conversation_id, user_id)
      VALUES ($1, $2)
      RETURNING id
    `, [convId, testUserId]);
    console.log("Insert conversation participant success! ID:", participantRes.rows[0].id);

    // Let's try to send a message
    console.log("Inserting message...");
    const messageRes = await pgClient.query(`
      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES ($1, $2, 'Hello from check_db.js!')
      RETURNING id
    `, [convId, testUserId]);
    console.log("Insert message success! ID:", messageRes.rows[0].id);

    // Let's try to select the conversations
    console.log("Selecting conversations...");
    const selectRes = await pgClient.query(`
      SELECT id, type, created_by FROM public.conversations WHERE id = $1
    `, [convId]);
    console.log("Select conversation success! Data:", selectRes.rows[0]);

    // Let's try to select the messages
    console.log("Selecting messages...");
    const selectMsgRes = await pgClient.query(`
      SELECT id, content FROM public.messages WHERE conversation_id = $1
    `, [convId]);
    console.log("Select message success! Content:", selectMsgRes.rows[0].content);

    console.log("All RLS operations (insert conv, insert participant, insert msg, select conv, select msg) succeeded!");
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    console.log("Rolling back transaction to keep database clean...");
    await pgClient.query('ROLLBACK');
    await pgClient.end();
  }
}

check().catch(console.error);

