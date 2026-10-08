import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../../../', import.meta.url);
const ME = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000b1';
const BOT = '00000000-0000-4000-8000-0000000000d1';
const SCENE = '00000000-0000-4000-8000-0000000000c1';
const PERSONA = '00000000-0000-4000-8000-0000000000e1';

async function memoryDatabase() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA chimera_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    GRANT USAGE ON SCHEMA auth, public, chimera_private TO anon, authenticated, service_role;
    CREATE FUNCTION public.handle_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
    CREATE TABLE public.conversations (id uuid PRIMARY KEY);
    CREATE TABLE public.conversation_participants (conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE, user_id uuid,
      persona_id uuid, persona_selected boolean DEFAULT false, PRIMARY KEY (conversation_id, user_id));
    CREATE TABLE public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid, sender_id uuid, content text,
      persona_id uuid, deleted_at timestamptz, created_at timestamptz DEFAULT now());
    CREATE TABLE public.character_memories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, character_id uuid,
      conversation_id uuid, approval_status text NOT NULL DEFAULT 'approved', content text, persona_id uuid);
    GRANT SELECT ON public.conversations, public.conversation_participants TO authenticated;
    CREATE FUNCTION chimera_private.is_conversation_member(c uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER
      AS $$ SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = c AND user_id = auth.uid()) $$;
    CREATE FUNCTION chimera_private.scene_persona(p_scene uuid, p_user uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
      AS $$ SELECT cp.persona_id FROM public.conversation_participants cp WHERE cp.conversation_id = p_scene AND cp.user_id = p_user $$;
    GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid), chimera_private.scene_persona(uuid, uuid) TO authenticated;
    INSERT INTO auth.users VALUES ('${ME}'), ('${OTHER}'), ('${BOT}');
    INSERT INTO public.conversations VALUES ('${SCENE}');
    INSERT INTO public.conversation_participants (conversation_id, user_id, persona_id) VALUES ('${SCENE}', '${ME}', '${PERSONA}'), ('${SCENE}', '${BOT}', NULL);
  `);
  await db.exec(await readFile(new URL('supabase/migrations/20261009020000_chimera_scene_settings.sql', root), 'utf8'));
  await db.exec(await readFile(new URL('supabase/migrations/20261009030000_chimera_auto_memory.sql', root), 'utf8'));
  const as = async (role, uid, sql) => {
    await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    try {
      return await db.query(sql);
    } finally {
      await db.exec('RESET ROLE');
    }
  };
  // Messages numbered by minute so "after the cursor" is easy to reason about.
  const say = (sender, minute, extra = {}) => db.query(
    `INSERT INTO public.messages (conversation_id, sender_id, content, persona_id, created_at, deleted_at)
     VALUES ($1, $2, $3, $4, '2026-01-01T10:00:00Z'::timestamptz + ($5 || ' minutes')::interval, $6)`,
    [SCENE, sender, `line ${minute}`, extra.persona === undefined ? PERSONA : extra.persona, String(minute), extra.deleted ? '2026-01-02T00:00:00Z' : null],
  );
  return { db, as, say };
}

const claim = async (as, uid = ME) => (await as('authenticated', uid, `SELECT public.claim_chimera_memory_window('${SCENE}') AS w`)).rows[0].w;

test('claim_chimera_memory_window: waits for 8 new player messages, then hands out each window exactly once', async () => {
  const { db, as, say } = await memoryDatabase();
  try {
    for (let i = 0; i < 7; i += 1) { await say(ME, i * 2); await say(BOT, i * 2 + 1); }
    assert.equal(await claim(as), null, 'seven player messages are not enough');

    await say(ME, 14); await say(BOT, 15);
    const first = await claim(as);
    assert.ok(first && first.from === null && first.persona_id === PERSONA, 'the first window opens at the beginning, for the current persona');
    assert.equal(new Date(first.to).toISOString(), '2026-01-01T10:15:00.000Z', 'it ends at the newest message');
    assert.equal(await claim(as), null, 'the same window is never handed out twice');

    for (let i = 0; i < 8; i += 1) await say(ME, 20 + i);
    const second = await claim(as);
    assert.equal(new Date(second.from).toISOString(), new Date(first.to).toISOString(), 'the next window starts where the last ended');
  } finally {
    await db.close();
  }
});

test('claim_chimera_memory_window: ignores deleted messages and other personas, and respects the off switch and the 10-suggestion cap', async () => {
  const { db, as, say } = await memoryDatabase();
  try {
    for (let i = 0; i < 6; i += 1) await say(ME, i);
    await say(ME, 6, { deleted: true });
    await say(ME, 7, { persona: '00000000-0000-4000-8000-0000000000ee' });
    await say(OTHER, 8);
    assert.equal(await claim(as), null, 'deleted, other-persona and other-people messages do not count');
    await say(ME, 9); await say(ME, 10);
    assert.ok(await claim(as), 'eight counted messages open a window');

    await as('authenticated', ME, `UPDATE public.chimera_scene_settings SET auto_memory = false`);
    for (let i = 0; i < 8; i += 1) await say(ME, 30 + i);
    assert.equal(await claim(as), null, 'suggestions switched off');
    await as('authenticated', ME, `UPDATE public.chimera_scene_settings SET auto_memory = true`);

    for (let i = 0; i < 10; i += 1) await db.query(`INSERT INTO public.character_memories (user_id, conversation_id, approval_status, content) VALUES ($1, $2, 'proposed', 'x')`, [ME, SCENE]);
    assert.equal(await claim(as), null, 'ten suggestions waiting: nothing new until they are reviewed');
    await db.exec(`UPDATE public.character_memories SET approval_status = 'approved' WHERE id IN (SELECT id FROM public.character_memories LIMIT 1)`);
    assert.ok(await claim(as), 'once under the cap, the waiting messages are looked at');
  } finally {
    await db.close();
  }
});

test('claim/release: only members, and release only undoes this request\'s own claim', async () => {
  const { db, as, say } = await memoryDatabase();
  try {
    for (let i = 0; i < 8; i += 1) await say(ME, i);
    await assert.rejects(as('authenticated', OTHER, `SELECT public.claim_chimera_memory_window('${SCENE}')`), /Scene access required/, 'not a member');
    await assert.rejects(as('anon', null, `SELECT public.claim_chimera_memory_window('${SCENE}')`), /permission denied/, 'anon');
    await assert.rejects(as('authenticated', OTHER, `SELECT public.release_chimera_memory_window('${SCENE}', now(), NULL)`), /Scene access required/);

    const window = await claim(as);
    assert.ok(window);
    await as('authenticated', ME, `SELECT public.release_chimera_memory_window('${SCENE}', '${window.to}', NULL)`);
    const reopened = await claim(as);
    assert.ok(reopened && reopened.from === null, 'after a release the same messages are offered again');

    // A stale release (the cursor has moved on since) must not rewind a newer claim.
    for (let i = 0; i < 8; i += 1) await say(ME, 40 + i);
    const newer = await claim(as);
    assert.ok(newer && new Date(newer.from).toISOString() === new Date(reopened.to).toISOString());
    await as('authenticated', ME, `SELECT public.release_chimera_memory_window('${SCENE}', '${reopened.to}', NULL)`);
    const cursor = (await db.query('SELECT memory_cursor_at FROM public.chimera_scene_settings')).rows[0].memory_cursor_at;
    assert.equal(new Date(cursor).toISOString(), new Date(newer.to).toISOString(), 'cursor stays where the newest claim put it');
  } finally {
    await db.close();
  }
});

test('giving back the newest reply: moving the cursor to just before it makes the next window start with that reply', async () => {
  const { db, as, say } = await memoryDatabase();
  try {
    for (let i = 0; i < 8; i += 1) { await say(ME, i * 2); await say(BOT, i * 2 + 1); }
    const window = await claim(as);
    assert.equal(new Date(window.to).toISOString(), '2026-01-01T10:15:00.000Z', 'the window ends on the newest reply');
    // The server leaves that reply out of what it reads (it can still be regenerated) and moves the cursor back.
    await as('authenticated', ME, `SELECT public.release_chimera_memory_window('${SCENE}', '${window.to}', '2026-01-01T10:14:00Z')`);
    for (let i = 0; i < 8; i += 1) await say(ME, 20 + i);
    const next = await claim(as);
    assert.equal(new Date(next.from).toISOString(), '2026-01-01T10:14:00.000Z');
    const inNext = (await db.query(`SELECT content FROM public.messages WHERE created_at > $1 AND created_at <= $2 ORDER BY created_at LIMIT 1`, [next.from, next.to])).rows[0].content;
    assert.equal(inNext, 'line 15', 'the reply that was left out is the first message of the next window');
  } finally {
    await db.close();
  }
});
