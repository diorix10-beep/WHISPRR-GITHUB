import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../../../', import.meta.url);
const ME = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000b1';

test('chimera_model_testers: a member can read only their own row and nobody can add or change rows from the app', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
      INSERT INTO auth.users VALUES ('${ME}'), ('${OTHER}');
    `);
    await db.exec(await readFile(new URL('supabase/migrations/20261009050000_chimera_model_testers.sql', root), 'utf8'));
    await db.exec(`INSERT INTO public.chimera_model_testers (user_id) VALUES ('${ME}')`);

    const as = async (role, uid, sql) => {
      await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
      try { return await db.query(sql); } finally { await db.exec('RESET ROLE'); }
    };
    assert.deepEqual((await as('authenticated', ME, 'SELECT user_id FROM public.chimera_model_testers')).rows.map((r) => r.user_id), [ME]);
    assert.deepEqual((await as('authenticated', OTHER, 'SELECT user_id FROM public.chimera_model_testers')).rows, [], 'someone else sees nothing');
    await assert.rejects(as('anon', null, 'SELECT * FROM public.chimera_model_testers'), /permission denied/);
    await assert.rejects(as('authenticated', OTHER, `INSERT INTO public.chimera_model_testers (user_id) VALUES ('${OTHER}')`), /permission denied/);
    await assert.rejects(as('authenticated', ME, `UPDATE public.chimera_model_testers SET created_at = now()`), /permission denied/);
    await assert.rejects(as('authenticated', ME, 'DELETE FROM public.chimera_model_testers'), /permission denied/);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.chimera_model_testers')).rows[0].n, 1);
  } finally { await db.close(); }
});
