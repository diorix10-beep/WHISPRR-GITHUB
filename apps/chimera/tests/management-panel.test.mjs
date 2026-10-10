import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const ME = '00000000-0000-4000-8000-0000000000a1';
const BOT = '00000000-0000-4000-8000-0000000000b1';
const BOT2 = '00000000-0000-4000-8000-0000000000b2';
const FRIEND = '00000000-0000-4000-8000-0000000000f1';
const CHAR = '00000000-0000-4000-8000-0000000000d1';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function server() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  return createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
}

/** Answers the database's REST calls from a fixed set of rows and keeps what was asked. */
function fakeDatabase(tables) {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? String(input));
    calls.push({ table: url.pathname.split('/').pop(), search: url.search, method: (init.method ?? 'GET').toUpperCase() });
    const rows = tables[url.pathname.split('/').pop()];
    if (rows === undefined) return new Response(JSON.stringify({ message: 'unexpected' }), { status: 500 });
    const wantsOne = (init.headers?.Accept ?? init.headers?.accept ?? '').includes('vnd.pgrst.object');
    return new Response(JSON.stringify(wantsOne ? rows[0] ?? null : rows), { status: 200, headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/*` } });
  };
  return { calls, restore: () => { globalThis.fetch = realFetch; } };
}

const conversation = (id, name, parent, minutes, others) => ({
  id, name, last_message: `last ${id.slice(-1)}`, last_message_at: `2026-10-10T10:${String(minutes).padStart(2, '0')}:00Z`, created_at: '2026-10-10T09:00:00Z',
  parent_conversation_id: parent, conversation_participants: [{ user_id: ME }, ...others.map((user_id) => ({ user_id }))],
});

test('the chat list holds only scenes with a character, one character\'s scenes can be asked for, and branches are recognised', async () => {
  const vite = await server();
  const rows = [
    conversation('00000000-0000-4000-8000-000000000001', null, null, 30, [BOT]),
    conversation('00000000-0000-4000-8000-000000000002', 'What if she refused', '00000000-0000-4000-8000-000000000001', 20, [BOT]),
    conversation('00000000-0000-4000-8000-000000000003', 'Elsewhere', null, 10, [BOT2]),
    conversation('00000000-0000-4000-8000-000000000004', null, null, 5, [FRIEND]),
    conversation('00000000-0000-4000-8000-000000000005', 'Orphan branch', '00000000-0000-4000-8000-0000000000ff', 1, [BOT]),
  ];
  const db = fakeDatabase({
    conversations: rows,
    profiles: [
      { user_id: BOT, display_name: 'Isolde', role: 'ai_character' },
      { user_id: BOT2, display_name: 'Sable', role: 'ai_character' },
      { user_id: FRIEND, display_name: 'A real person', role: 'user' },
    ],
  });
  try {
    const { loadScenes, branchNote, sceneName } = await vite.ssrLoadModule('/src/lib/sceneList.ts');
    const all = await loadScenes(ME);
    assert.deepEqual(all.map((s) => s.id.slice(-1)), ['1', '2', '3', '5'], 'the conversation with a real person is not a scene');
    const mine = await loadScenes(ME, { characterUserId: BOT });
    assert.deepEqual(mine.map((s) => s.id.slice(-1)), ['1', '2', '5'], 'only this character\'s scenes');
    assert.equal(sceneName(mine[0]), 'Isolde');
    assert.equal(sceneName(mine[1]), 'What if she refused');
    assert.equal(branchNote(mine[0], mine), null, 'an ordinary scene is not a branch');
    assert.equal(branchNote(mine[1], mine), 'Branch of “Isolde”');
    assert.equal(branchNote(mine[2], mine), 'A branch', 'a branch whose source is not in the list is still marked');
    // Only scenes of type "dm" are asked for, newest first.
    const request = db.calls.find((c) => c.table === 'conversations');
    assert.match(decodeURIComponent(request.search), /type=eq\.dm/);
    assert.match(decodeURIComponent(request.search), /order=last_message_at\.desc/);
  } finally { db.restore(); await vite.close(); }
});

test('a failure reading the list is reported, never shown as an empty history', async () => {
  const vite = await server();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'down' }), { status: 500, headers: { 'content-type': 'application/json' } });
  try {
    const { loadScenes } = await vite.ssrLoadModule('/src/lib/sceneList.ts');
    await assert.rejects(loadScenes(ME));
  } finally { globalThis.fetch = realFetch; await vite.close(); }
});

test('character details: the public description only, the creator by name, nothing when the database says no', async () => {
  const vite = await server();
  const row = { id: CHAR, user_id: BOT, creator_id: ME, visibility: 'private', name: 'Isolde (chat)', short_description: ' A keeper. ', long_description: 'Long.', content_rating: 'SFW', avatar_url: null };
  let db = fakeDatabase({ ai_characters: [row], profiles: [{ user_id: BOT, display_name: 'Isolde' }, { user_id: ME, display_name: 'Me' }] });
  try {
    const { loadCharacterInfo } = await vite.ssrLoadModule('/src/lib/characterInfo.ts');
    const info = await loadCharacterInfo(CHAR, ME);
    assert.deepEqual([info.name, info.shortDescription, info.creatorName, info.mine, info.visibility], ['Isolde', 'A keeper.', 'Me', true, 'private']);
    const select = decodeURIComponent(db.calls.find((c) => c.table === 'ai_characters').search);
    for (const secret of ['personality', 'scenario', 'creator_notes', 'greeting', 'definition', 'system_prompt']) assert.ok(!select.includes(secret), `${secret} is not read`);
    assert.equal((await loadCharacterInfo(CHAR, FRIEND)).mine, false);
    db.restore();
    db = fakeDatabase({ ai_characters: [] });
    assert.equal(await loadCharacterInfo(CHAR, ME), null, 'a character the database will not show gives nothing');
  } finally { db.restore(); await vite.close(); }
});

test('the open/closed choice of the panel is remembered on a computer, and a browser that refuses storage just starts closed', async () => {
  const vite = await server();
  try {
    const { readPanelOpen, writePanelOpen } = await vite.ssrLoadModule('/src/lib/panelPrefs.ts');
    const map = new Map();
    const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
    assert.equal(readPanelOpen(storage), false, 'closed by default');
    writePanelOpen(true, storage);
    assert.equal(readPanelOpen(storage), true);
    writePanelOpen(false, storage);
    assert.equal(readPanelOpen(storage), false);
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    assert.equal(readPanelOpen(broken), false);
    assert.doesNotThrow(() => writePanelOpen(true, broken));
    assert.equal(readPanelOpen(null), false);
  } finally { await vite.close(); }
});

test('the panel is wired into the chat: one Manage button, five tabs, the existing tools and memory kept, a sheet or a column by screen size', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /<ManagementPanel desktop=\{desktop\}/);
  assert.match(page, /useMediaQuery\('\(min-width: 1024px\)'\)/);
  for (const id of ['about', 'chat', 'history', 'memory', 'persona']) assert.match(page, new RegExp(`id: '${id}'`), id);
  assert.doesNotMatch(page, /toolsOpen|memoryOpen|scene-tools|scene-memory/, 'the two old sections are gone');
  // What the old sections did is still done, by the same functions.
  for (const kept of ['saveTitle', 'updateSettings', 'saveBannedWords', 'startOver', 'removeScene', 'saveCanon', 'approveSuggestion', 'forgetMemory', 'changePersona']) assert.match(page, new RegExp(kept), kept);
  // On a phone the panel is never open by itself.
  assert.match(page, /matchMedia\?\.\('\(min-width: 1024px\)'\)\.matches && readPanelOpen\(\)/);
  assert.match(page, /if \(desktop\) writePanelOpen\(true\)/);
});

test('Refresh only reads; it cannot erase anything', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  const body = page.slice(page.indexOf('const refreshConversation'), page.indexOf('const openTurningPoint'));
  assert.match(body, /await loadMessages\(\)/);
  assert.doesNotMatch(body, /\.(update|delete|insert|upsert|rpc)\(/, 'no write of any kind');
  assert.match(body, /Nothing was removed/);
});

test('History renames and deletes through the existing safe paths and asks before deleting', async () => {
  const history = await read('src/components/chat/panel/HistorySection.tsx');
  assert.match(history, /renameScene\(/);
  assert.match(history, /deleteScene\(/, 'the database function that only deletes a scene the player started');
  assert.doesNotMatch(history, /from\('(conversations|messages)'\)\s*\.(delete|update)/, 'no direct table writes');
  assert.match(history, /<ConfirmDialog/);
  assert.match(history, /This cannot be undone/);
  const list = await read('src/lib/sceneList.ts');
  assert.match(list, /role === 'ai_character'|p\.role === 'ai_character'/, 'only scenes with a character');
});

test('the persona is fixed once the story has begun, so earlier messages never change', async () => {
  const section = await read('src/components/chat/panel/PersonaSection.tsx');
  assert.match(section, /fixed once the story has begun/);
  assert.match(section, /locked \?/);
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /locked=\{hasPlayerMessages\}/);
  assert.match(page, /rpc\('set_chimera_scene_persona'/, 'the change goes through the database function');
});

test('the panel is accessible: tab roles and keys, labelled dialog or region, Escape, big touch targets, reduced motion', async () => {
  const panel = await read('src/components/chat/ManagementPanel.tsx');
  assert.match(panel, /role="tablist"/);
  assert.match(panel, /role="tab"/);
  assert.match(panel, /aria-selected/);
  assert.match(panel, /ArrowRight/);
  assert.match(panel, /role="tabpanel"/);
  assert.match(panel, /<aside/);
  assert.match(panel, /event\.key === 'Escape'/);
  assert.match(panel, /role="dialog"/, 'a sheet on a phone');
  assert.match(panel, /aria-label="Close the chat panel"/);
  assert.match(panel, /min-h-\[44px\]/);
  const menu = await read('src/components/chat/MessageMenu.tsx');
  assert.match(menu, /motion-reduce:transition-none/, 'the sheet shares the overlay that respects reduced motion');
});

test('no voice playback, text-to-speech or image generation in the panel (kept on the roadmap, not built now)', async () => {
  const files = ['src/components/chat/ManagementPanel.tsx', 'src/components/chat/panel/AboutSection.tsx', 'src/components/chat/panel/HistorySection.tsx', 'src/components/chat/panel/PersonaSection.tsx'];
  for (const file of files) assert.doesNotMatch(await read(file), /speechSynthesis|SpeechSynthesis|text-to-speech|textToSpeech|generate.?image/i, file);
});
