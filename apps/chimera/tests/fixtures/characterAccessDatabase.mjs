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
const root = new URL('../../../../', import.meta.url);

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
  await db.exec(await readFile(new URL('supabase/migrations/20261008113846_chimera_lock_room_adult_preferences.sql', root), 'utf8'));
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


export { database, identity, ids, verify, user, owner, sfw, mature, nsfw, privateId, bot, scene, room };
