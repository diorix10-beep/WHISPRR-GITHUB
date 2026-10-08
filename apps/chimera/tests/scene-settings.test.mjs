import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'vite';

const root = new URL('../../../', import.meta.url);
const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b1';
const SCENE_A = '00000000-0000-4000-8000-0000000000c1';
const SCENE_B = '00000000-0000-4000-8000-0000000000c2';

const character = { chat_name: 'Mara', personality: 'Dry wit.', content_rating: 'SFW' };
const bot = { display_name: 'Mara', username: 'mara' };

async function loadPrompt() {
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const module = await server.ssrLoadModule('/api/_lib/roleplayPrompt.ts');
  return { module, close: () => server.close() };
}

test('scene settings reach the prompt, and are capped so they cannot crowd out the character', async () => {
  const { module, close } = await loadPrompt();
  try {
    const { buildSystemPrompt, maxOutputTokensFor, normalizeResponseLength } = module;

    const plain = buildSystemPrompt(character, bot, null, null);
    assert.ok(!plain.includes('Player Preferences') && !plain.includes('Pinned By The Player'), 'no settings, no extra blocks');

    assert.ok(buildSystemPrompt(character, bot, null, null, { responseLength: 'short' }).includes('Keep every reply short'));
    assert.ok(buildSystemPrompt(character, bot, null, null, { responseLength: 'long' }).includes('Write fuller replies'));
    assert.ok(!buildSystemPrompt(character, bot, null, null, { responseLength: 'medium' }).includes('Player Preferences'));
    assert.equal(normalizeResponseLength('ENORMOUS'), 'medium');
    assert.equal(maxOutputTokensFor('short'), 2048);
    assert.equal(maxOutputTokensFor('long'), 4096);

    const banned = buildSystemPrompt(character, bot, null, null, { bannedWords: `suddenly,\n\n orbs ${'x'.repeat(900)}` });
    const line = banned.split('\n').find((l) => l.includes('does not want to read these words'));
    assert.ok(line.includes('suddenly, orbs'), 'newlines are flattened');
    assert.ok(line.split(': ').slice(1).join(': ').length <= 500, 'capped at 500 characters');

    const pinned = buildSystemPrompt(character, bot, null, null, {
      pinned: Array.from({ length: 8 }, (_, i) => ({ speaker: i % 2 ? 'Mara' : 'Lyra', content: String.fromCharCode(65 + i).repeat(2000) })),
    });
    const block = pinned.slice(pinned.indexOf('## Pinned By The Player')).split('\n---')[0];
    assert.ok(block.length < 3600, `pinned block stays small (${block.length})`);
    assert.ok(!pinned.includes('A'.repeat(601)), 'one pin is capped at 600 characters');
    assert.ok(block.includes('[Lyra] AAAA') && block.includes('[Mara] BBBB'), 'each pin names its speaker');
    assert.ok(!buildSystemPrompt(character, bot, null, null, { pinned: [{ speaker: 'Lyra', content: '   ' }] }).includes('Pinned By The Player'), 'blank pins are ignored');
  } finally {
    await close();
  }
});

async function settingsDatabase() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA chimera_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    GRANT USAGE ON SCHEMA auth, public, chimera_private TO anon, authenticated, service_role;
    CREATE FUNCTION public.handle_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
    CREATE TABLE public.conversations (id uuid PRIMARY KEY, name text);
    CREATE TABLE public.conversation_participants (conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE, user_id uuid, PRIMARY KEY (conversation_id, user_id));
    GRANT SELECT ON public.conversations, public.conversation_participants TO authenticated;
    CREATE FUNCTION chimera_private.is_conversation_member(c uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER
      AS $$ SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = c AND user_id = auth.uid()) $$;
    GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid) TO authenticated;
    INSERT INTO auth.users VALUES ('${A}'), ('${B}');
    INSERT INTO public.conversations VALUES ('${SCENE_A}', 'a'), ('${SCENE_B}', 'b');
    INSERT INTO public.conversation_participants VALUES ('${SCENE_A}', '${A}'), ('${SCENE_B}', '${B}');
  `);
  await db.exec(await readFile(new URL('supabase/migrations/20261009020000_chimera_scene_settings.sql', root), 'utf8'));
  const as = async (role, uid, sql) => {
    await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    try {
      return await db.query(sql);
    } finally {
      await db.exec('RESET ROLE');
    }
  };
  return { db, as };
}

test('scene settings: each player reaches only their own row, in a scene they belong to, within limits', async () => {
  const { db, as } = await settingsDatabase();
  try {
    await as('authenticated', A, `INSERT INTO public.chimera_scene_settings (conversation_id) VALUES ('${SCENE_A}')`);
    const own = (await as('authenticated', A, 'SELECT user_id, response_length, banned_words, cardinality(pinned_message_ids) AS pins FROM public.chimera_scene_settings')).rows;
    assert.deepEqual(own, [{ user_id: A, response_length: 'medium', banned_words: '', pins: 0 }], 'defaults, owner filled from the session');

    await assert.rejects(as('authenticated', A, `INSERT INTO public.chimera_scene_settings (conversation_id) VALUES ('${SCENE_B}')`), /row-level security/, 'not a member of that scene');
    await assert.rejects(as('authenticated', A, `INSERT INTO public.chimera_scene_settings (conversation_id, user_id) VALUES ('${SCENE_A}', '${B}')`), /row-level security/, 'cannot write for someone else');
    assert.equal((await as('authenticated', B, 'SELECT * FROM public.chimera_scene_settings')).rows.length, 0, 'another player sees nothing');
    assert.equal((await as('authenticated', B, `UPDATE public.chimera_scene_settings SET response_length = 'long' WHERE user_id = '${A}' RETURNING 1`)).rows.length, 0, 'another player cannot edit');
    assert.equal((await as('authenticated', B, `DELETE FROM public.chimera_scene_settings WHERE user_id = '${A}' RETURNING 1`)).rows.length, 0, 'another player cannot delete');
    await assert.rejects(as('anon', null, 'SELECT * FROM public.chimera_scene_settings'), /permission denied/);

    await as('authenticated', A, `UPDATE public.chimera_scene_settings SET response_length = 'short', banned_words = 'orbs', pinned_message_ids = ARRAY['${SCENE_A}'::uuid]`);
    await assert.rejects(as('authenticated', A, `UPDATE public.chimera_scene_settings SET response_length = 'epic'`), /check/);
    await assert.rejects(as('authenticated', A, `UPDATE public.chimera_scene_settings SET banned_words = '${'x'.repeat(501)}'`), /check/);
    await assert.rejects(as('authenticated', A, `UPDATE public.chimera_scene_settings SET pinned_message_ids = ARRAY(SELECT gen_random_uuid() FROM generate_series(1, 9))`), /check/);
    await assert.rejects(as('authenticated', A, `UPDATE public.chimera_scene_settings SET user_id = '${B}'`), /row-level security|violates/);

    await db.exec(`DELETE FROM public.conversation_participants WHERE conversation_id = '${SCENE_A}' AND user_id = '${A}'`);
    assert.equal((await as('authenticated', A, 'SELECT * FROM public.chimera_scene_settings')).rows.length, 0, 'leaving the scene closes the settings');
    await db.exec(`DELETE FROM public.conversations WHERE id = '${SCENE_A}'`);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.chimera_scene_settings')).rows[0].n, 0, 'deleting a scene removes its settings');
  } finally {
    await db.close();
  }
});
