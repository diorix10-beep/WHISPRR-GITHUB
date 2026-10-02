import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
export const ids = {
  alice: '00000000-0000-0000-0000-000000000001', bob: '00000000-0000-0000-0000-000000000002',
  bot: '00000000-0000-0000-0000-000000000003', otherBot: '00000000-0000-0000-0000-000000000004',
  chat: '00000000-0000-0000-0000-000000000010', otherChat: '00000000-0000-0000-0000-000000000011',
  character: '00000000-0000-0000-0000-000000000020', world: '00000000-0000-0000-0000-000000000030', lore: '00000000-0000-0000-0000-000000000040',
};

export async function fixture() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,service_role;
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY,role text NOT NULL DEFAULT 'user',access_level text NOT NULL DEFAULT 'ecosystem',display_name text DEFAULT 'Member');
    CREATE TABLE public.ai_characters(id uuid PRIMARY KEY,user_id uuid UNIQUE,creator_id uuid,greeting text,visibility text DEFAULT 'public');
    CREATE TABLE public.conversations(id uuid PRIMARY KEY,created_by uuid,type text DEFAULT 'dm',last_message text,last_message_at timestamptz);
    CREATE TABLE public.personas(id uuid PRIMARY KEY,user_id uuid);
    CREATE TABLE public.conversation_participants(id uuid DEFAULT gen_random_uuid(),conversation_id uuid,user_id uuid,persona_id uuid, UNIQUE(conversation_id,user_id));
    CREATE TABLE public.messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid,sender_id uuid,content text,read boolean DEFAULT false,deleted_at timestamptz,created_at timestamptz DEFAULT now(),image_url text);
    CREATE TABLE public.story_scene_illustrations(id uuid PRIMARY KEY,status text);
    CREATE TABLE public.worlds(id uuid PRIMARY KEY,user_id uuid);
    CREATE TABLE public.lorebooks(id uuid PRIMARY KEY,user_id uuid);
    CREATE TABLE public.lorebook_characters(lorebook_id uuid,character_id uuid);
    CREATE TABLE public.lorebook_worlds(lorebook_id uuid,world_id uuid);
    CREATE TABLE public.human_roleplay_participants(id uuid DEFAULT gen_random_uuid(),session_id uuid,user_id uuid,role text DEFAULT 'participant',status text DEFAULT 'accepted',is_creator boolean DEFAULT false,last_seen_at timestamptz);
    CREATE TABLE public.human_roleplay_characters(id uuid PRIMARY KEY,session_id uuid,owner_id uuid,name text);
    CREATE TABLE public.human_roleplay_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),session_id uuid,sender_id uuid,character_id uuid,message_type text DEFAULT 'dialogue',sequence_number bigint,content text,edited_at timestamptz);
    CREATE FUNCTION public.human_roleplay_member(p_session_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.human_roleplay_participants WHERE session_id=p_session_id AND user_id=auth.uid() AND status='accepted') $$;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated,service_role;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY update_own_profile ON profiles FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
    CREATE POLICY select_profiles ON profiles FOR SELECT TO authenticated USING(true);
    ALTER TABLE ai_characters ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_characters ON ai_characters FOR SELECT TO authenticated USING(visibility='public' OR creator_id=auth.uid());
    CREATE POLICY update_characters ON ai_characters FOR UPDATE TO authenticated USING(creator_id=auth.uid()) WITH CHECK(creator_id=auth.uid());
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY insert_conversations ON conversations FOR INSERT TO authenticated WITH CHECK(auth.uid() IS NOT NULL);
    CREATE POLICY select_conversations ON conversations FOR SELECT TO authenticated USING(created_by=auth.uid() OR EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id=conversations.id AND user_id=auth.uid()));
    ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_conversation_participants ON conversation_participants FOR SELECT TO authenticated USING(true);
    CREATE POLICY insert_conversation_participants ON conversation_participants FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
    CREATE POLICY update_participants ON conversation_participants FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_messages ON messages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id=messages.conversation_id AND user_id=auth.uid()));
    CREATE POLICY update_messages ON messages FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id=messages.conversation_id AND user_id=auth.uid()));
    ALTER TABLE lorebook_characters ENABLE ROW LEVEL SECURITY; ALTER TABLE lorebook_worlds ENABLE ROW LEVEL SECURITY;
    CREATE POLICY manage_lorebook_characters ON lorebook_characters FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM lorebooks WHERE id=lorebook_id AND user_id=auth.uid()));
    CREATE POLICY manage_lorebook_worlds ON lorebook_worlds FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM lorebooks WHERE id=lorebook_id AND user_id=auth.uid()));
    INSERT INTO auth.users VALUES('${ids.alice}'),('${ids.bob}'),('${ids.bot}'),('${ids.otherBot}');
    INSERT INTO profiles(user_id,role) VALUES('${ids.alice}','user'),('${ids.bob}','user'),('${ids.bot}','ai_character'),('${ids.otherBot}','ai_character');
    INSERT INTO ai_characters VALUES('${ids.character}','${ids.bot}','${ids.alice}','Authored opening','public');
    INSERT INTO conversations(id,created_by) VALUES('${ids.chat}','${ids.alice}'),('${ids.otherChat}','${ids.bob}');
    INSERT INTO conversation_participants(conversation_id,user_id) VALUES('${ids.chat}','${ids.alice}'),('${ids.chat}','${ids.bob}'),('${ids.chat}','${ids.bot}'),('${ids.otherChat}','${ids.bob}');
    INSERT INTO worlds VALUES('${ids.world}','${ids.bob}'); INSERT INTO lorebooks VALUES('${ids.lore}','${ids.alice}');
  `);
  // Reproduce the privilege flaw against the baseline before applying the patch.
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${ids.alice}',false); UPDATE profiles SET role='admin' WHERE user_id='${ids.alice}'; RESET ROLE;`);
  assert.equal((await db.query<{role:string}>(`SELECT role FROM profiles WHERE user_id='${ids.alice}'`)).rows[0].role,'admin');
  await db.exec(`UPDATE profiles SET role='user' WHERE user_id='${ids.alice}'`);
  const root = new URL('../../../../supabase/migrations/', import.meta.url);
  await db.exec(await readFile(new URL('20260704034000_031_v4_ai_chat_response_rpc.sql',root),'utf8'));
  await db.exec(`SET ROLE authenticated; SELECT respond_as_ai_character('${ids.chat}','${ids.bob}','Spoofed human'); RESET ROLE; DELETE FROM messages;`);
  for (const name of ['20260930150022_chimera_phase1_authorization.sql','20260930150040_chimera_phase1_request_protection.sql']) {
    await db.exec(await readFile(new URL(name, root), 'utf8'));
  }
  return db;
}
