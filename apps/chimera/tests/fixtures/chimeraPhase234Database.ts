import { readFile } from "node:fs/promises";
import { fixture } from "./chimeraDatabase.js";
const root = new URL("../../../../supabase/migrations/", import.meta.url);
const migrations = [
  "20260930170532_chimera_phase2_reliability.sql",
  "20260930170728_chimera_phase3_continuity.sql",
  "20260930171024_chimera_phase4_human_hybrid_rooms.sql",
];
export async function phase234Database() {
  const db = await fixture();
  await db.exec(`
  CREATE TABLE story_chapters(id uuid PRIMARY KEY,story_id uuid,content text,updated_at timestamptz);
  ALTER TABLE conversations ALTER COLUMN id SET DEFAULT gen_random_uuid(); ALTER TABLE conversations ADD name text,ADD memory_summary text DEFAULT '';
  ALTER TABLE messages ALTER COLUMN read SET DEFAULT false;
  ALTER TABLE personas ADD is_default boolean DEFAULT false;
  ALTER TABLE ai_characters ADD short_description text;
  CREATE TABLE character_memories(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),character_id uuid,user_id uuid,memory_type text DEFAULT 'long_term',content text,importance integer DEFAULT 5,expires_at timestamptz,metadata jsonb DEFAULT '{}',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
  GRANT ALL ON character_memories TO authenticated;
  CREATE POLICY insert_messages ON messages FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid() AND EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id=messages.conversation_id AND user_id=auth.uid()));
  ALTER TABLE human_roleplay_participants ADD joined_at timestamptz DEFAULT now();
  CREATE UNIQUE INDEX room_member_unique ON human_roleplay_participants(session_id,user_id);
  ALTER TABLE human_roleplay_characters ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ALTER TABLE human_roleplay_characters ADD description text DEFAULT '',ADD personality text DEFAULT '',ADD background text DEFAULT '',ADD goals text DEFAULT '',ADD relationships text DEFAULT '',ADD avatar_url text,ADD created_at timestamptz DEFAULT now(),ADD updated_at timestamptz DEFAULT now();
  ALTER TABLE human_roleplay_messages ADD deleted_at timestamptz,ADD created_at timestamptz DEFAULT now();
  DROP FUNCTION human_roleplay_member(uuid);
  CREATE FUNCTION handle_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at:=now(); RETURN NEW; END;$$;
  CREATE FUNCTION gen_random_bytes(n integer) RETURNS bytea LANGUAGE sql AS $$SELECT decode(repeat('00',n),'hex')$$;
 `);
  await db.exec(
    await readFile(
      new URL("20260815170119_secure_character_memories.sql", root),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL("20260818010000_human_roleplay_phase1.sql", root),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL("20260820120000_human_roleplay_playable_room.sql", root),
      "utf8",
    ),
  );
  await db.exec(
    `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated,service_role;`,
  );
  for (const migration of migrations)
    await db.exec(await readFile(new URL(migration, root), "utf8"));
  return db;
}
