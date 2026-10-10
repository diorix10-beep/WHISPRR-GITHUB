import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const ME = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000a2';
const CHAR = '00000000-0000-4000-8000-0000000000d1';
const SCENE = '00000000-0000-4000-8000-0000000000e1';
const PERSONA = '00000000-0000-4000-8000-0000000000c1';
const BOOK = '00000000-0000-4000-8000-0000000000b1';
const BOOK2 = '00000000-0000-4000-8000-0000000000b2';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function server() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  return createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
}

/** Answers the database's REST calls from a function and keeps what was sent. */
function fakeDatabase(answer) {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? String(input));
    const call = { table: url.pathname.split('/').pop(), search: decodeURIComponent(url.search), method: (init.method ?? 'GET').toUpperCase(), body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    const result = answer(call);
    return new Response(call.method === 'HEAD' || result.body === undefined ? null : JSON.stringify(result.body), { status: result.status ?? 200, headers: { 'content-type': 'application/json', 'content-range': result.range ?? '0-0/*' } });
  };
  return { calls, restore: () => { globalThis.fetch = realFetch; } };
}

test('lorebooks of a character: the ones the database shows, with the viewer\'s own marked, and a failure is an error, not an empty list', async () => {
  const vite = await server();
  const db = fakeDatabase((c) => {
    if (c.table === 'lorebook_characters') return { body: [{ lorebook_id: BOOK }, { lorebook_id: BOOK2 }] };
    if (c.table === 'lorebooks') return { body: [
      { id: BOOK, user_id: ME, title: 'Harbour', description: 'd', visibility: 'private', entry_count: 5, scan_depth: 4, reply_budget: 3000 },
      { id: BOOK2, user_id: OTHER, title: '  ', visibility: 'public', entry_count: 'x', scan_depth: 99, reply_budget: 5 },
      { id: 'unlisted-1', user_id: OTHER, title: 'Unlisted', visibility: 'unlisted', entry_count: 3 },
      { id: 'private-1', user_id: OTHER, title: 'Private of someone else', visibility: 'private', entry_count: 3 },
    ] };
    return { status: 500 };
  });
  try {
    const { loadCharacterLorebooks } = await vite.ssrLoadModule('/src/lib/sceneLore.ts');
    const books = await loadCharacterLorebooks(CHAR, ME);
    assert.deepEqual(books.map((b) => [b.id, b.title, b.mine, b.entryCount, b.depth, b.budget]), [
      [BOOK, 'Harbour', true, 5, 4, 3000],
      [BOOK2, 'Untitled lorebook', false, 0, null, null],
    ], 'odd values fall back instead of breaking the list; unlisted and private lorebooks of others are not shown');
    assert.match(db.calls[0].search, /character_id=eq\./);
    db.restore();
    const none = fakeDatabase((c) => ({ body: c.table === 'lorebook_characters' ? [] : [] }));
    assert.deepEqual(await loadCharacterLorebooks(CHAR, ME), []);
    assert.equal(none.calls.length, 1, 'nothing linked: the lorebooks are not even asked for');
    none.restore();
    const broken = fakeDatabase(() => ({ status: 500, body: { message: 'down' } }));
    await assert.rejects(loadCharacterLorebooks(CHAR, ME));
    broken.restore();
  } finally { globalThis.fetch = globalThis.fetch; await vite.close(); }
});

test('unlinking removes only the link and reports a refusal instead of pretending', async () => {
  const vite = await server();
  let db = fakeDatabase(() => ({ body: [{ id: 'link-1' }] }));
  try {
    const { unlinkLorebookFromCharacter } = await vite.ssrLoadModule('/src/lib/sceneLore.ts');
    await unlinkLorebookFromCharacter(BOOK, CHAR);
    assert.deepEqual(db.calls.map((c) => [c.table, c.method]), [['lorebook_characters', 'DELETE']], 'only the link table is touched: the lorebook and its entries stay');
    assert.match(db.calls[0].search, /lorebook_id=eq\.[^&]+&character_id=eq\./);
    db.restore();
    db = fakeDatabase(() => ({ body: [] }));
    await assert.rejects(unlinkLorebookFromCharacter(BOOK, CHAR), /Not allowed/, 'no row removed means not allowed');
  } finally { db.restore(); await vite.close(); }
});

test('"what is in play" is the server\'s own selection: always-on entries, keywords in the latest messages, the lorebook\'s depth and size', async () => {
  const vite = await server();
  try {
    const { whatIsInPlay } = await vite.ssrLoadModule('/src/lib/sceneLore.ts');
    const lore = await vite.ssrLoadModule('/api/_lib/lorebook.ts');
    const entry = (id, title, keywords, over = {}) => ({ id, title, content: `Text of ${title}.`, keywords, is_constant: false, case_sensitive: false, enabled: true, priority: 0, insertion_order: Number(id.slice(1)), lorebook_id: BOOK, scan_depth: null, ...over });
    const entries = [
      entry('e1', 'Rules', [], { is_constant: true, priority: 5 }),
      entry('e2', 'Rook', ['rook']),
      entry('e3', 'Storm', ['typhoon']),
      entry('e4', 'Lighthouse', ['lighthouse'], { enabled: false }),
    ];
    const book = { id: BOOK, title: 'B', description: '', visibility: 'private', entryCount: 4, depth: 2, budget: 2000, mine: true };
    const messages = ['a typhoon came', 'quiet', 'Captain Rook arrives'];
    const result = whatIsInPlay(entries, [book], messages);
    assert.deepEqual(result.entries.map((e) => e.title), ['Rules', 'Rook'], 'the typhoon is older than the lorebook\'s depth of 2, and a disabled entry is never sent');
    assert.equal(result.budget, 2000);
    const server = lore.selectLorebookEntries(entries, messages, { bookDepths: new Map([[BOOK, 2]]), budget: 2000 });
    assert.deepEqual(result.entries.map((e) => e.id), server.map((e) => e.id), 'the same answer as the reply code gives');
    assert.equal(result.sent, lore.lorebookBlock(server, 2000).length);
    // A deeper lorebook sees the older mention; with no lorebook asking for a size the default applies.
    const deep = whatIsInPlay(entries, [{ ...book, depth: 3, budget: null }], messages);
    assert.deepEqual(deep.entries.map((e) => e.title), ['Rules', 'Rook', 'Storm']);
    assert.equal(deep.budget, lore.LOREBOOK_BUDGET_CHARACTERS);
    // Several lorebooks: the biggest size asked for wins, as on the server.
    assert.equal(whatIsInPlay(entries, [{ ...book, budget: 3000 }, { ...book, id: BOOK2, budget: 9000 }], messages).budget, 9000);
    assert.deepEqual(whatIsInPlay([], [book], messages), { entries: [], sent: 0, budget: 2000 });
  } finally { await vite.close(); }
});

test('entries are read page by page, enabled ones only, and a failed page is an error rather than a shorter list', async () => {
  const vite = await server();
  let page = 0;
  const db = fakeDatabase((c) => {
    page += 1;
    if (page === 3) return { status: 500, body: { message: 'down' } };
    return { body: Array.from({ length: 500 }, (_, i) => ({ id: `p${page}-${i}` })) };
  });
  try {
    const { loadEnabledEntries } = await vite.ssrLoadModule('/src/lib/sceneLore.ts');
    await assert.rejects(loadEnabledEntries([BOOK]));
    assert.match(db.calls[0].search, /enabled=eq\.true/);
    assert.match(db.calls[0].search, /order=priority\.desc/);
    assert.deepEqual(await loadEnabledEntries([]), [], 'nothing to read, nothing asked');
  } finally { db.restore(); await vite.close(); }
});

test('a memory written by hand: the player\'s own, approved at once, for this chat or every chat, validated before anything is sent', async () => {
  const vite = await server();
  const db = fakeDatabase(() => ({ status: 201 }));
  try {
    const { addMemory, MEMORY_TYPES, memoryTypeLabel, MEMORY_LIMITS } = await vite.ssrLoadModule('/src/lib/memories.ts');
    await addMemory({ userId: ME, characterId: CHAR, personaId: PERSONA, conversationId: SCENE, type: 'relationship', content: '  Isolde trusts Rook.  ' });
    assert.deepEqual(db.calls[0].body, {
      user_id: ME, character_id: CHAR, persona_id: PERSONA, conversation_id: SCENE, memory_type: 'relationship', content: 'Isolde trusts Rook.',
      approval_status: 'approved', metadata: { origin: 'player' },
    });
    await addMemory({ userId: ME, characterId: CHAR, personaId: null, conversationId: null, type: 'lore', content: 'The sea is cold.' });
    assert.equal(db.calls[1].body.conversation_id, null, 'every chat means no scene');
    assert.equal(db.calls[1].body.persona_id, null);
    const sent = db.calls.length;
    for (const bad of [{ content: '   ' }, { content: 'x'.repeat(MEMORY_LIMITS.content + 1) }, { type: 'invented' }]) {
      await assert.rejects(addMemory({ userId: ME, characterId: CHAR, personaId: null, conversationId: SCENE, type: 'lore', content: 'ok', ...bad }));
    }
    assert.equal(db.calls.length, sent, 'a bad memory is refused before it is sent');
    // The kinds are the ones the database accepts, and an older kind still has a name.
    const sql = (await read('../../supabase/migrations/20260815170119_secure_character_memories.sql')) + (await read('../../supabase/migrations/20260930170728_chimera_phase3_continuity.sql'));
    assert.ok(MEMORY_TYPES.every((t) => ['long_term', 'relationship', 'lore', 'personality'].includes(t.id)));
    assert.equal(memoryTypeLabel('short_term'), 'Note');
    assert.equal(memoryTypeLabel('long_term'), 'Event');
    assert.ok(sql.length > 0);
    db.restore();
    const failing = fakeDatabase(() => ({ status: 403, body: { message: 'denied' } }));
    await assert.rejects(addMemory({ userId: ME, characterId: CHAR, personaId: null, conversationId: SCENE, type: 'lore', content: 'ok' }));
    failing.restore();
  } finally { db.restore(); await vite.close(); }
});

test('moving a memory between this chat and every chat changes only where it applies, and a refusal is an error', async () => {
  const vite = await server();
  let db = fakeDatabase(() => ({ body: [{ updated_at: '2026-10-10T10:00:00Z' }] }));
  try {
    const { setMemoryScope } = await vite.ssrLoadModule('/src/lib/memories.ts');
    assert.equal(await setMemoryScope('m1', SCENE), '2026-10-10T10:00:00Z');
    assert.deepEqual(db.calls[0].body, { conversation_id: SCENE });
    await setMemoryScope('m1', null);
    assert.deepEqual(db.calls[1].body, { conversation_id: null });
    db.restore();
    db = fakeDatabase(() => ({ body: [] }));
    await assert.rejects(setMemoryScope('m1', null), /Not allowed/);
  } finally { db.restore(); await vite.close(); }
});

test('the database lets a player write only their own memories, in their own scenes and personas (what the manual form relies on)', async () => {
  const sql = await read('../../supabase/migrations/20260930170728_chimera_phase3_continuity.sql');
  assert.match(sql, /Private memory ownership required/);
  assert.match(sql, /Persona ownership required/);
  assert.match(sql, /Scene access required/);
  assert.match(sql, /Choose one memory scope/);
  const rls = await read('../../supabase/migrations/20260815170119_secure_character_memories.sql');
  assert.match(rls, /Users can insert their own character memories/);
  assert.match(rls, /WITH CHECK \(\(select auth\.uid\(\)\) = user_id\)/);
});

test('the Lorebook and Memory tabs are wired: creator only controls, no migration, memories keep their per-persona, per-chat limits', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /id: 'world', label: 'Lorebook'/);
  assert.match(page, /isCreator=\{scene\.characterMine\}/);
  assert.match(page, /creator_id, name:chat_name/);
  assert.match(page, /await addMemory\(\{/);
  assert.match(page, /conversationId: submitted\.everywhere \? null : conversationId!/);
  assert.match(page, /personaId: memoryContextRef\.current\.personaId/);
  assert.match(page, /memories\.length >= MAX_MEMORIES/);
  // A slow save must not overwrite what was typed meanwhile (the box is emptied only if it still holds what was saved).
  assert.match(page, /setNewMemory\(\(current\) => \(current\.text === submitted\.text \? \{ \.\.\.current, text: '' \} : current\)\)/);
  assert.doesNotMatch(page, /setNewMemory\(\{ \.\.\.newMemory, text: '' \}\)/);
  // Moving a memory to "every chat" cannot overflow the list every chat shows (counted in the database, see the test below).
  assert.match(page, /countEveryChatMemories\(/);
  assert.match(page, /never mixed in unless you chose/);
  const section = await read('src/components/chat/panel/LorebookSection.tsx');
  assert.match(section, /\{isCreator && \(/, 'linking, creating and checking are for the creator');
  assert.match(section, /book\.mine && \(/, 'open and unlink only on the player\'s own lorebooks');
  assert.doesNotMatch(section, /loadEnabledEntries\([^)]*books\.map/, 'entries of other people\'s lorebooks are never read');
  assert.match(section, /own\.map\(\(b\) => b\.id\)/);
  // A failure reading the creator's own lorebooks is shown, with a retry, never as an empty library.
  assert.match(section, /setMineFailed\(true\)/);
  assert.doesNotMatch(section, /loadMyLorebooks\(viewerId\)\.catch\(\(\) => \[\]\)/);
  assert.match(section, /We could not load your lorebooks, so linking is unavailable/);
  const lib = await read('src/lib/sceneLore.ts');
  assert.doesNotMatch(lib, /\.(update|insert|upsert)\(/, 'this file never writes lore');
  assert.match(lib, /api\/_lib\/lorebook\.ts/, 'one selection, shared with the server');
});

test('"every chat" memories are counted in the database, not on the screen\'s cut list', async () => {
  const vite = await server();
  let db = fakeDatabase(() => ({ range: '*/100' }));
  try {
    const { countEveryChatMemories } = await vite.ssrLoadModule('/src/lib/memories.ts');
    assert.equal(await countEveryChatMemories(CHAR, PERSONA), 100);
    const call = db.calls[0];
    assert.equal(call.method, 'HEAD', 'a count only, no rows');
    assert.match(call.search, /character_id=eq\./);
    assert.match(call.search, /conversation_id=is\.null/, 'only the ones for every chat');
    assert.match(call.search, /session_id=is\.null/);
    assert.match(call.search, new RegExp(`persona_id=eq\\.${PERSONA}`));
    await countEveryChatMemories(CHAR, null);
    assert.match(db.calls[1].search, /persona_id=is\.null/, 'no persona is its own set');
    db.restore();
    db = fakeDatabase(() => ({ status: 500, body: { message: 'down' } }));
    await assert.rejects(countEveryChatMemories(CHAR, PERSONA), 'a failed count is an error, never zero');
  } finally { db.restore(); await vite.close(); }
});

test('both ways into "every chat" check the real count, and Link is off while the creator\'s library is unreadable', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.equal((page.match(/countEveryChatMemories\(/g) ?? []).length, 2, 'adding and moving');
  assert.doesNotMatch(page, /memories\.filter\(\(m\) => !m\.conversationId\)\.length >= MAX_MEMORIES/, 'no count from the cut list');
  const section = await read('src/components/chat/panel/LorebookSection.tsx');
  assert.match(section, /if \(!choice \|\| busy \|\| mineFailed\) return;/, 'the handler is guarded too');
  assert.match(section, /disabled=\{!choice \|\| busy \|\| mineFailed\}/, 'and the button');
  assert.match(section, /setMineFailed\(true\);\s*\/\/ A choice made before the failure may no longer be valid\.\s*setChoice\(''\);/, 'and a stale choice is dropped');
});
