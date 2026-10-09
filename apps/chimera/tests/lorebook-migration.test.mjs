import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../../../', import.meta.url);
const U = '00000000-0000-4000-8000-0000000000a1';

async function database() {
  const db = new PGlite();
  // The two tables as they are in production before this migration, with a row in each.
  await db.exec(`
    CREATE TABLE public.lorebooks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL,
      description text NOT NULL DEFAULT '', entry_count integer NOT NULL DEFAULT 0,
      visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','unlisted')),
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE public.lorebook_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lorebook_id uuid NOT NULL REFERENCES public.lorebooks(id) ON DELETE CASCADE, title text NOT NULL,
      content text NOT NULL DEFAULT '', keywords text[] NOT NULL DEFAULT '{}', priority integer NOT NULL DEFAULT 0,
      enabled boolean NOT NULL DEFAULT true, insertion_order integer NOT NULL DEFAULT 0, is_constant boolean NOT NULL DEFAULT false,
      case_sensitive boolean NOT NULL DEFAULT false);
    INSERT INTO public.lorebooks (id, user_id, title, visibility) VALUES ('00000000-0000-4000-8000-000000000b01', '${U}', 'Old book', 'private');
    INSERT INTO public.lorebook_entries (lorebook_id, title, content, keywords) VALUES ('00000000-0000-4000-8000-000000000b01', 'Old entry', 'Lore.', '{dragon}');
  `);
  return db;
}
const migration = () => readFile(new URL('supabase/migrations/20261009070000_chimera_lorebook_depth_theme.sql', root), 'utf8');

test('existing lorebooks and entries are untouched and get the defaults: depth 3, purple, no entry depth', async () => {
  const db = await database();
  try {
    await db.exec(await migration());
    const book = (await db.query('SELECT title, visibility, scan_depth, theme FROM public.lorebooks')).rows[0];
    assert.deepEqual(book, { title: 'Old book', visibility: 'private', scan_depth: 3, theme: 'purple' });
    const entry = (await db.query('SELECT title, content, keywords, scan_depth FROM public.lorebook_entries')).rows[0];
    assert.deepEqual(entry, { title: 'Old entry', content: 'Lore.', keywords: ['dragon'], scan_depth: null });
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.lorebooks')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('the database refuses a depth outside 1 to 10 and a colour that is not on the list', async () => {
  const db = await database();
  try {
    await db.exec(await migration());
    const book = (sql) => db.query(`INSERT INTO public.lorebooks (user_id, title, ${sql.col}) VALUES ($1, 'x', $2)`, [U, sql.value]);
    for (const depth of [1, 3, 10]) await book({ col: 'scan_depth', value: depth });
    for (const depth of [0, 11, -1]) await assert.rejects(book({ col: 'scan_depth', value: depth }), /check constraint/, `lorebook depth ${depth}`);
    for (const theme of ['purple', 'midnight', 'sky', 'teal', 'forest', 'mint', 'green', 'orange', 'sunset', 'red', 'candy']) await book({ col: 'theme', value: theme });
    await assert.rejects(book({ col: 'theme', value: 'hotpink' }), /check constraint/);
    await assert.rejects(book({ col: 'theme', value: '<script>' }), /check constraint/);

    const entry = (value) => db.query(`INSERT INTO public.lorebook_entries (lorebook_id, title, scan_depth) VALUES ('00000000-0000-4000-8000-000000000b01', 'e', $1)`, [value]);
    for (const depth of [null, 1, 10]) await entry(depth);
    for (const depth of [0, 11]) await assert.rejects(entry(depth), /check constraint/, `entry depth ${depth}`);
  } finally { await db.close(); }
});

test('the migration can be applied twice, and it only adds columns', async () => {
  const db = await database();
  try {
    const sql = await migration();
    await db.exec(sql);
    await db.exec(sql);
    assert.deepEqual((await db.query('SELECT scan_depth, theme FROM public.lorebooks')).rows, [{ scan_depth: 3, theme: 'purple' }]);
    assert.doesNotMatch(sql, /\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i, 'additive only');
    assert.doesNotMatch(sql.replace(/--.*$/gm, ''), /SECURITY|POLICY|GRANT|REVOKE/i, 'no change to access rules');
  } finally { await db.close(); }
});

const budgetMigration = () => readFile(new URL('supabase/migrations/20261009080000_chimera_lorebook_reply_budget.sql', root), 'utf8');

test('reply size: existing lorebooks keep the 8,000 they always had, only 1,000 to 40,000 is accepted, and it only adds a column', async () => {
  const db = await database();
  try {
    await db.exec(await migration());
    const sql = await budgetMigration();
    await db.exec(sql);
    await db.exec(sql);
    assert.deepEqual((await db.query('SELECT title, reply_budget FROM public.lorebooks')).rows, [{ title: 'Old book', reply_budget: 8000 }]);
    const book = (value) => db.query(`INSERT INTO public.lorebooks (user_id, title, reply_budget) VALUES ($1, 'x', $2)`, [U, value]);
    for (const size of [1000, 8000, 40000]) await book(size);
    for (const size of [0, 999, 40001, 800000, -5]) await assert.rejects(book(size), /check constraint/, `reply size ${size}`);
    assert.doesNotMatch(sql, /\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i, 'additive only');
    assert.doesNotMatch(sql.replace(/--.*$/gm, ''), /SECURITY|POLICY|GRANT|REVOKE/i, 'no change to access rules');
  } finally { await db.close(); }
});
