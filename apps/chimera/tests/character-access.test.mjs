import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const user = '00000000-0000-4000-8000-000000000001';
const owner = '00000000-0000-4000-8000-000000000002';
const sfw = '00000000-0000-4000-8000-000000000010';
const mature = '00000000-0000-4000-8000-000000000011';
const nsfw = '00000000-0000-4000-8000-000000000012';
const privateId = '00000000-0000-4000-8000-000000000013';
const bot = '00000000-0000-4000-8000-000000000021';
const scene = '00000000-0000-4000-8000-000000000030';
const room = '00000000-0000-4000-8000-000000000040';
const root = new URL('../../../', import.meta.url);

async function database() {
  const db = new PGlite();
  try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA chimera_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public, chimera_private TO anon, authenticated, service_role;
    CREATE TABLE chimera_user_preferences(user_id uuid PRIMARY KEY, adult_content_enabled boolean DEFAULT false,
      adult_eligibility_confirmed_at timestamptz, updated_at timestamptz DEFAULT now());
    ALTER TABLE chimera_user_preferences ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_preferences ON chimera_user_preferences TO authenticated
      USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
    CREATE TABLE profiles(user_id uuid PRIMARY KEY, display_name text, role text);
    CREATE TABLE ai_characters(id uuid PRIMARY KEY, user_id uuid, creator_id uuid, visibility text,
      content_rating text, greeting text, short_description text, personality text);
    CREATE TABLE conversations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), character_id uuid,
      created_by uuid, type text, name text, memory_summary text, last_message text, last_message_at timestamptz);
    CREATE TABLE conversation_participants(conversation_id uuid, user_id uuid, continuity_summaries jsonb);
    CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid,
      sender_id uuid, content text, read boolean, deleted_at timestamptz, sequence_number integer,
      created_at timestamptz DEFAULT now());
    CREATE TABLE character_memories(id uuid DEFAULT gen_random_uuid(),character_id uuid,
      user_id uuid,content text,conversation_id uuid,session_id uuid);
    CREATE TABLE character_relationships(source_character_id uuid,target_character_id uuid,description text);
    CREATE TABLE world_characters(character_id uuid);
    CREATE TABLE lorebook_characters(character_id uuid);
    CREATE TABLE ai_character_likes(character_id uuid);
    CREATE TABLE ai_character_followers(character_id uuid);
    CREATE TABLE human_roleplay_sessions(id uuid PRIMARY KEY,creator_id uuid);
    CREATE TABLE human_roleplay_characters(id uuid DEFAULT gen_random_uuid(),session_id uuid,
      owner_id uuid,name text,description text,persona_id uuid,ai_character_id uuid);
    CREATE TABLE human_roleplay_messages(id uuid DEFAULT gen_random_uuid(),session_id uuid,
      sender_id uuid,content text,created_at timestamptz,sequence_number integer,deleted_at timestamptz);
    CREATE TABLE personas(id uuid,name text,description text,user_id uuid,is_default boolean);
    ALTER TABLE conversation_participants ADD COLUMN persona_id uuid, ADD COLUMN persona_selected boolean DEFAULT false;
    ALTER TABLE messages ADD COLUMN persona_id uuid, ADD COLUMN response_versions jsonb DEFAULT '[]';
    ALTER TABLE human_roleplay_sessions ADD COLUMN ai_enabled boolean DEFAULT true,
      ADD COLUMN status text DEFAULT 'active', ADD COLUMN ai_policy text DEFAULT 'participants',ADD COLUMN turn_user_id uuid;
    ALTER TABLE human_roleplay_messages ADD COLUMN character_id uuid,ADD COLUMN author_kind text,
      ADD COLUMN reply_to_id uuid,ADD COLUMN message_type text;
    CREATE TABLE human_roleplay_participants(session_id uuid,user_id uuid,status text,ai_opt_in boolean);
    CREATE TABLE roleplay_public_scenes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid,content_rating text);
    CREATE TABLE roleplay_public_scene_messages(scene_id uuid,content text);
    CREATE TABLE chimera_private.ai_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,
      operation text,resource text,request_key text,fingerprint text,state text,lease uuid DEFAULT gen_random_uuid(),
      expires_at timestamptz,result jsonb,context jsonb, UNIQUE(user_id,operation,resource,request_key));
    CREATE TABLE chimera_private.ai_attempts(user_id uuid,operation text,started_at timestamptz DEFAULT now());
    CREATE FUNCTION chimera_private.scene_persona(uuid,uuid) RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;

    CREATE FUNCTION public.human_roleplay_member(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION chimera_private.is_conversation_member(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE FUNCTION chimera_private.is_conversation_owner(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid),
      chimera_private.is_conversation_owner(uuid) TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon,authenticated;
  `);
  for (const table of ['profiles', 'ai_characters', 'conversations', 'messages', 'conversation_participants',
    'character_memories', 'character_relationships', 'world_characters', 'lorebook_characters',
    'ai_character_likes', 'ai_character_followers', 'human_roleplay_sessions',
    'human_roleplay_characters', 'human_roleplay_messages','roleplay_public_scenes','roleplay_public_scene_messages']) {
    await db.exec(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
      CREATE POLICY existing_permissive ON ${table} FOR SELECT TO anon,authenticated USING (true);`);
  }
  await db.exec(await readFile(new URL('supabase/migrations/20261006120000_chimera_age_verification_gate.sql', root), 'utf8'));
  await db.exec(await readFile(new URL('supabase/migrations/20261008104038_chimera_character_adult_authorization.sql', root), 'utf8'));
  await db.exec(await readFile(new URL('supabase/migrations/20261008110354_chimera_service_adult_recheck.sql', root), 'utf8'));
  await db.exec(`
    INSERT INTO profiles VALUES ('${bot}','Bot','ai_character');
    INSERT INTO ai_characters VALUES
      ('${sfw}', '${owner}', '${owner}', 'public', 'SFW', 'safe', 'safe', 'safe'),
      ('${mature}', '${bot}', '${owner}', 'public', 'Mature', 'restricted greeting', 'restricted description', 'restricted personality'),
      ('${nsfw}', '${owner}', '${owner}', 'unlisted', 'NSFW', 'restricted', 'restricted', 'restricted'),
      ('${privateId}', '${owner}', '${owner}', 'private', 'Mature', 'private', 'private', 'private');
    INSERT INTO conversations(id,character_id,created_by) VALUES('${scene}','${mature}','${user}');
    INSERT INTO conversation_participants VALUES('${scene}','${user}', '{"excerpt":"restricted"}'),('${scene}','${bot}',null);
    INSERT INTO messages(conversation_id,sender_id,content) VALUES('${scene}','${bot}','restricted greeting');
    INSERT INTO character_memories(character_id,user_id,content) VALUES('${mature}','${user}','restricted');
    INSERT INTO character_relationships VALUES('${sfw}','${mature}','restricted');
    INSERT INTO world_characters VALUES('${mature}');
    INSERT INTO lorebook_characters VALUES('${mature}');
    INSERT INTO ai_character_likes VALUES('${mature}');
    INSERT INTO ai_character_followers VALUES('${mature}');
    INSERT INTO human_roleplay_sessions(id,creator_id) VALUES('${room}','${user}');
    INSERT INTO human_roleplay_participants VALUES('${room}','${user}','accepted',true);
    INSERT INTO roleplay_public_scenes(conversation_id,content_rating) VALUES('${scene}','mature');
    INSERT INTO roleplay_public_scene_messages SELECT id,'restricted' FROM roleplay_public_scenes;
    INSERT INTO human_roleplay_characters(session_id,owner_id,name,description,ai_character_id)
      VALUES('${room}','${user}','restricted','restricted','${mature}');
    INSERT INTO human_roleplay_messages(session_id,content) VALUES('${room}','restricted');
  `);
  return db;
  } catch (error) { await db.close(); throw error; }
}
async function identity(db, role, id = '') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec(`SET ROLE ${role}`);
}
async function ids(db) { return (await db.query('SELECT id FROM ai_characters ORDER BY id')).rows.map(r => r.id); }
async function verify(db, enabled) {
  await db.exec(`RESET ROLE; SELECT public.set_age_verification('${user}', 'verified_adult');
    UPDATE chimera_user_preferences SET adult_content_enabled=${enabled} WHERE user_id='${user}';`);
}

test('database denies direct IDs and related data to anonymous/unverified; verified adults must opt in', async () => {
  const db = await database();
  try {
    for (const [role,id] of [['anon',''], ['authenticated',user], ['authenticated',owner]]) {
      await identity(db,role,id);
      assert.deepEqual(await ids(db), role === 'anon' ? [] : [sfw]);
      assert.deepEqual((await db.query('SELECT * FROM profiles WHERE user_id=$1',[bot])).rows, []);
      assert.deepEqual((await db.query('SELECT greeting,personality FROM ai_characters WHERE id=$1',[mature])).rows, []);
      for (const table of ['character_memories','character_relationships','world_characters','lorebook_characters',
        'ai_character_likes','ai_character_followers','conversations','messages','conversation_participants',
        'human_roleplay_sessions','human_roleplay_characters','human_roleplay_messages','roleplay_public_scenes','roleplay_public_scene_messages']) {
        assert.deepEqual((await db.query(`SELECT * FROM ${table}`)).rows, [], `${role}: ${table} leaked`);
      }
    }
    await verify(db,false);
    await identity(db,'authenticated',user);
    assert.deepEqual(await ids(db),[sfw]);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.deepEqual(await ids(db),[sfw,mature,nsfw]);
    assert.equal((await db.query('SELECT greeting FROM ai_characters WHERE id=$1',[mature])).rows[0].greeting,'restricted greeting');
    assert.equal((await db.query('SELECT * FROM messages')).rows.length,1);
    // Removing consent takes effect without refreshing a JWT.
    await db.exec(`UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id='${user}'`);
    assert.deepEqual(await ids(db),[sfw]);
  } finally { await db.close(); }
});

test('privileged scene/room RPCs cannot bypass the gate; verification cannot be forged', async () => {
  const db = await database();
  try {
    await identity(db,'anon');
    await assert.rejects(db.query('SELECT public.create_chimera_scene($1)',[[bot]]),/permission denied/);
    await identity(db,'authenticated',user);
    await assert.rejects(db.exec(`INSERT INTO chimera_user_preferences(user_id,age_verification_status,adult_content_enabled)
      VALUES('${user}','verified_adult',true)`), /only be recorded/);
    assert.equal((await db.query(`SELECT chimera_private.is_conversation_member('${scene}') AS allowed`)).rows[0].allowed,false);
    await assert.rejects(db.query('SELECT public.create_chimera_scene($1)',[[bot]]),/Character unavailable/);
    await assert.rejects(db.query('SELECT public.respond_as_ai_character($1,$2,$3)',[scene,bot,'restricted greeting']),/Roleplay access required/);
    await assert.rejects(db.query('SELECT public.attach_human_room_character($1,null,$2)',[room,mature]),/Identity unavailable/);
    await assert.rejects(db.query('SELECT public.get_human_room_continuity($1)',[room]),/Room membership required/);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.equal((await db.query(`SELECT chimera_private.is_conversation_member('${scene}') AS allowed`)).rows[0].allowed,true);
    await db.query('SELECT public.create_chimera_scene($1)',[[bot]]);
    await db.query('SELECT public.attach_human_room_character($1,null,$2)',[room,mature]);
    await db.query('SELECT public.get_human_room_continuity($1)',[room]);
  } finally { await db.close(); }
});

test('unknown ratings fail closed, safe scenes remain usable, and verification revocation is immediate', async () => {
  const db = await database();
  try {
    const ratings = [null, '', ' sfw ', 'FutureRating', '   ', 'mature', 'nsfw'];
    for (const [i,rating] of ratings.entries()) {
      await db.query('INSERT INTO ai_characters(id,user_id,creator_id,visibility,content_rating) VALUES($1,$2,$2,$3,$4)',
        [`00000000-0000-4000-8000-${String(100+i).padStart(12,'0')}`,owner,'public',rating]);
    }
    const safeScene='00000000-0000-4000-8000-000000000031';
    await db.exec(`INSERT INTO conversations(id,character_id,created_by) VALUES('${safeScene}','${sfw}','${user}');
      INSERT INTO conversation_participants(conversation_id,user_id) VALUES('${safeScene}','${user}');`);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,4); // SFW, NULL, empty and normalized SFW
    assert.equal((await db.query('SELECT chimera_private.is_conversation_member($1) AS allowed',[safeScene])).rows[0].allowed,true);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,10); // all except somebody else's private character
    await db.exec(`RESET ROLE; SELECT public.set_age_verification('${user}','unverified');`);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,4);
    assert.deepEqual((await db.query('SELECT * FROM messages WHERE conversation_id=$1',[scene])).rows,[]);
    // New migration is repeatable without resetting verification or consent.
    await db.exec('RESET ROLE');
    await db.exec(await readFile(new URL('supabase/migrations/20261008104038_chimera_character_adult_authorization.sql',root),'utf8'));
  } finally { await db.close(); }
});

test('service-role completions and cached replies recheck the reserved user after consent/verification revocation', async () => {
  const db=await database();
  const requestId='00000000-0000-4000-8000-000000000050';
  const lease='00000000-0000-4000-8000-000000000051';
  const source='00000000-0000-4000-8000-000000000052';
  try {
    const messageId=(await db.query('SELECT id FROM messages WHERE conversation_id=$1',[scene])).rows[0].id;
    const characterId=(await db.query('SELECT id FROM human_roleplay_characters WHERE session_id=$1',[room])).rows[0].id;
    for (const operation of ['chat','regeneration','room']) {
      const resource=operation==='room'?`room:${room}:${characterId}`:`${scene}:${bot}`;
      const complete=()=> operation==='chat'
        ? db.query('SELECT public.complete_chimera_chat_request($1,$2,$3,$4,$5)',[requestId,lease,scene,bot,'new restricted reply'])
        : operation==='regeneration'
        ? db.query('SELECT public.complete_chimera_regeneration($1,$2,$3,$4,$5,$6,$7)',[requestId,lease,scene,bot,messageId,'restricted greeting','new restricted reply'])
        : db.query('SELECT public.complete_chimera_room_ai($1,$2,$3,$4,$5,$6)',[requestId,lease,room,characterId,source,'new restricted reply']);
      for(const revoke of ['consent','verification']) {
        await verify(db,true);
        await db.query(`INSERT INTO chimera_private.ai_requests(id,user_id,operation,resource,request_key,fingerprint,state,lease,expires_at)
          VALUES($1,$2,'chat',$3,$4,$5,'running',$6,now()+interval '2 minutes')
          ON CONFLICT(id) DO UPDATE SET state='running',resource=EXCLUDED.resource,request_key=EXCLUDED.request_key,result=null`,
          [requestId,user,resource,operation==='room'?`turn:${source}`:'test','a'.repeat(64),lease]);
        if(revoke==='consent') await db.query('UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id=$1',[user]);
        else await db.query("SELECT public.set_age_verification($1,'unverified')",[user]);
        await identity(db,'service_role'); // no member auth.uid(): authorization must use the reservation user
        await assert.rejects(complete(),/permission changed/);
        await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission changed/);
        await assert.rejects(db.query('SELECT public.reserve_chimera_ai_request($1,$2,$3,$4,$5)',
          [user,'chat',resource,'test','a'.repeat(64)]),/permission changed/);
        await db.exec('RESET ROLE');
        assert.equal((await db.query('SELECT state FROM chimera_private.ai_requests WHERE id=$1',[requestId])).rows[0].state,'running');
        assert.equal((await db.query('SELECT content FROM messages WHERE id=$1',[messageId])).rows[0].content,'restricted greeting');
        await db.query("UPDATE chimera_private.ai_requests SET state='completed',result='{"+ '"reply":"cached restricted reply"' + "}'::jsonb WHERE id=$1",[requestId]);
        await identity(db,'service_role');
        await assert.rejects(complete(),/permission changed/); // completed replay must also be denied
        await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission changed/);
        await db.exec('RESET ROLE');
      }
      await verify(db,true);
      await db.query("UPDATE chimera_private.ai_requests SET state='running',result=null WHERE id=$1",[requestId]);
      await identity(db,'service_role');
      await complete(); // same service endpoint still works for an eligible adult
      await db.exec('RESET ROLE');
      assert.equal((await db.query('SELECT state FROM chimera_private.ai_requests WHERE id=$1',[requestId])).rows[0].state,'completed');
      if(operation==='chat') await db.query('DELETE FROM messages WHERE id<>$1',[messageId]);
      if(operation==='regeneration') await db.query("UPDATE messages SET content='restricted greeting' WHERE id=$1",[messageId]);
    }
    await identity(db,'authenticated',user);
    await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission denied/);
  } finally {await db.close();}
});
