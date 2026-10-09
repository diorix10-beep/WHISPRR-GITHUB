import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const book = await server.ssrLoadModule('/api/_lib/lorebook.ts');
  const prompt = await server.ssrLoadModule('/api/_lib/roleplayPrompt.ts');
  const form = await server.ssrLoadModule('/src/lib/lorebooks.ts');
  return { book, prompt, form, close: () => server.close() };
}

let n = 0;
const entry = (over = {}) => ({
  id: `e${(n += 1)}`, title: 'Entry', content: 'Some lore.', keywords: ['dragon'], is_constant: false,
  case_sensitive: false, enabled: true, priority: 0, insertion_order: 0, ...over,
});
const titles = (list) => list.map((e) => e.title);

test('an entry is chosen only when one of its keywords was just mentioned, or when it is always on', async () => {
  const { book, close } = await load();
  try {
    const entries = [
      entry({ title: 'Dragon', keywords: ['dragon', 'wyrm'] }),
      entry({ title: 'Castle', keywords: ['castle'] }),
      entry({ title: 'Always', keywords: [], is_constant: true }),
    ];
    assert.deepEqual(titles(book.selectLorebookEntries(entries, ['We see a Dragon!'])), ['Always', 'Dragon'], 'same priority and order: by name');
    assert.deepEqual(titles(book.selectLorebookEntries(entries, ['the wyrm roars', 'inside the castle'])).sort(), ['Always', 'Castle', 'Dragon']);
    assert.deepEqual(titles(book.selectLorebookEntries(entries, ['nothing relevant'])), ['Always'], 'only the always-on entry');
    assert.deepEqual(book.selectLorebookEntries(entries, []).map((e) => e.title), ['Always'], 'at the start of a scene only always-on entries apply');
  } finally { await close(); }
});

test('disabled entries, empty entries and entries with no keywords are never sent; capitals only matter when asked', async () => {
  const { book, close } = await load();
  try {
    assert.deepEqual(book.selectLorebookEntries([entry({ enabled: false, is_constant: true })], ['dragon']), []);
    assert.deepEqual(book.selectLorebookEntries([entry({ content: '   ', is_constant: true })], ['dragon']), []);
    assert.deepEqual(book.selectLorebookEntries([entry({ keywords: [] })], ['dragon']), [], 'no keyword and not always-on: never');
    assert.deepEqual(book.selectLorebookEntries([entry({ keywords: ['  ', ''] })], ['dragon']), []);
    assert.equal(book.selectLorebookEntries([entry({ keywords: ['Rose'] })], ['a rose']).length, 1, 'case-insensitive by default');
    assert.equal(book.selectLorebookEntries([entry({ keywords: ['Rose'], case_sensitive: true })], ['a rose']).length, 0);
    assert.equal(book.selectLorebookEntries([entry({ keywords: ['Rose'], case_sensitive: true })], ['Rose is here']).length, 1);
    // Rows from the database can be incomplete: nothing throws.
    assert.doesNotThrow(() => book.selectLorebookEntries([{ id: 'x', title: null, content: 'c', keywords: null, is_constant: true, case_sensitive: null, enabled: null, priority: null, insertion_order: null }], ['hi']));
  } finally { await close(); }
});

test('only the latest messages are searched', async () => {
  const { book, close } = await load();
  try {
    const entries = [entry({ keywords: ['dragon'] })];
    const old = ['the dragon', 'a', 'b', 'c', 'd', 'e', 'f'];
    assert.equal(book.selectLorebookEntries(entries, old).length, 0, 'mentioned seven messages ago');
    assert.equal(book.selectLorebookEntries(entries, ['the dragon', 'a', 'b', 'c', 'd', 'e']).length, 1, 'within the last six');
  } finally { await close(); }
});

test('priority decides who gets the room, then the creator\'s order, and the total is capped', async () => {
  const { book, close } = await load();
  try {
    const entries = [
      entry({ title: 'low', is_constant: true, priority: 0, insertion_order: 0, content: 'x'.repeat(2000) }),
      entry({ title: 'high', is_constant: true, priority: 5, insertion_order: 9, content: 'y'.repeat(2000) }),
      entry({ title: 'mid-b', is_constant: true, priority: 1, insertion_order: 2, content: 'z'.repeat(2000) }),
      entry({ title: 'mid-a', is_constant: true, priority: 1, insertion_order: 1, content: 'w'.repeat(2000) }),
    ];
    assert.deepEqual(titles(book.selectLorebookEntries(entries, [], { budget: 100_000 })), ['high', 'mid-a', 'mid-b', 'low']);
    // Room for three of them: the lowest priority is the one left out.
    const picked = book.selectLorebookEntries(entries, [], { budget: 6_500 });
    assert.deepEqual(titles(picked), ['high', 'mid-a', 'mid-b']);
    // A small entry can still fit after one that was too big.
    const mixed = [entry({ title: 'big', is_constant: true, priority: 9, content: 'b'.repeat(2500) }), entry({ title: 'small', is_constant: true, priority: 1, content: 'tiny' })];
    assert.deepEqual(titles(book.selectLorebookEntries(mixed, [], { budget: 1000 })), ['small']);
    // The default budget bounds what a huge lorebook can send.
    const huge = Array.from({ length: 200 }, (_, i) => entry({ title: `t${i}`, is_constant: true, content: 'q'.repeat(2400) }));
    const sent = book.lorebookBlock(book.selectLorebookEntries(huge, []));
    assert.ok(sent.length < book.LOREBOOK_BUDGET_CHARACTERS + 1500, `block is ${sent.length} characters`);
  } finally { await close(); }
});

test('the block names the entries, cuts an entry that is too long, and is null when nothing applies', async () => {
  const { book, close } = await load();
  try {
    assert.equal(book.lorebookBlock([]), null);
    const block = book.lorebookBlock([entry({ title: 'The Guild', content: 'Lantern bearers.' }), entry({ title: '', content: 'No title entry.' }), entry({ title: 'Long', content: 'L'.repeat(5000) })]);
    assert.match(block, /^## Lorebook/);
    assert.match(block, /### The Guild\nLantern bearers\./);
    assert.match(block, /No title entry\./);
    assert.ok(block.includes('L'.repeat(book.LOREBOOK_ENTRY_MAX_CHARACTERS) + '…') && !block.includes('L'.repeat(book.LOREBOOK_ENTRY_MAX_CHARACTERS + 1)), 'a long entry is cut');
    assert.match(block, /never mention this block/);
  } finally { await close(); }
});

test('the lorebook reaches the character prompt, after the world and before the player, and only when there is one', async () => {
  const { prompt, close } = await load();
  try {
    const character = { chat_name: 'Isolde', personality: 'Bold.', scenario: 'A harbour at dusk.', greeting: 'Hi' };
    const profile = { display_name: 'Isolde', username: 'isolde' };
    const without = prompt.buildSystemPrompt(character, profile, null, null, {});
    assert.ok(!without.includes('## Lorebook'));
    const withBook = prompt.buildSystemPrompt(character, profile, null, null, { lorebook: '## Lorebook\n\n### Guild\nLantern bearers.' });
    const at = (needle) => withBook.indexOf(needle);
    assert.ok(at('## World & Scenario') < at('## Lorebook') && at('## Lorebook') < at('## The Player'));
    assert.ok(!prompt.buildSystemPrompt(character, profile, null, null, { lorebook: '   ' }).includes('## Lorebook'), 'a blank block adds nothing');
    assert.ok(!prompt.buildSystemPrompt(character, profile, null, null, { lorebook: null }).includes('## Lorebook'));
  } finally { await close(); }
});

test('entry form: keywords are cleaned, an entry needs text and a keyword (or always-on), and the saved row is tidy', async () => {
  const { form, close } = await load();
  try {
    assert.deepEqual(form.parseKeywords(' dragon, Wyrm ;\nDRAGON,, castle '), ['dragon', 'Wyrm', 'castle'], 'trimmed, no empties, no duplicates ignoring case');
    assert.equal(form.parseKeywords(Array.from({ length: 50 }, (_, i) => `k${i}`).join(',')).length, form.LOREBOOK_LIMITS.keywords);
    assert.ok(form.parseKeywords('x'.repeat(200))[0].length <= form.LOREBOOK_LIMITS.keyword);

    const base = { ...form.EMPTY_ENTRY, content: 'Lore.', keywords: 'dragon' };
    assert.equal(form.validateEntry(base), null);
    assert.match(form.validateEntry({ ...base, content: '  ' }) ?? '', /what the AI should know/i);
    assert.match(form.validateEntry({ ...base, keywords: ' , ' }) ?? '', /keyword/i);
    assert.equal(form.validateEntry({ ...base, keywords: '', isConstant: true }), null, 'always-on needs no keyword');
    // There is no limit on how long the text is: only what is sent is capped.
    assert.equal(form.validateEntry({ ...base, content: 'c'.repeat(1_000_000) }), null);

    const row = form.entryRow({ ...base, title: '  ', keywords: 'Dragon, dragon, wyrm', priority: 3.7 }, 'book-1', 4);
    assert.deepEqual(row, { lorebook_id: 'book-1', title: 'Dragon', content: 'Lore.', keywords: ['Dragon', 'wyrm'], is_constant: false, case_sensitive: false, enabled: true, priority: 3, insertion_order: 4 });
    const back = form.entryFromRow({ id: 'e1', title: 'T', content: 'C', keywords: ['a', 'b'], is_constant: true, case_sensitive: true, enabled: false, priority: 2 });
    assert.deepEqual(back, { id: 'e1', title: 'T', keywords: 'a, b', content: 'C', isConstant: true, caseSensitive: true, enabled: false, priority: 2 });
    assert.equal(form.entryFromRow({ id: 'e2' }).enabled, true, 'enabled unless saved as off');
  } finally { await close(); }
});

test('the chat reads only lorebooks owned by the character\'s creator and linked to it, and never fails a reply because of them', async () => {
  const chat = await readFile(new URL('../api/ai-chat.ts', import.meta.url), 'utf8');
  const start = chat.indexOf('async function loadLorebookEntries');
  const body = chat.slice(start, chat.indexOf('export default async function handler'));
  assert.match(body, /from\('lorebook_characters'\)[\s\S]*\.eq\('character_id', characterId\)/, 'only lorebooks linked to this character');
  assert.match(body, /from\('lorebooks'\)[\s\S]*\.eq\('user_id', creatorId\)/, 'only the creator\'s own lorebooks');
  assert.match(body, /\.eq\('enabled', true\)/);
  assert.match(body, /catch \{\s*return \[\];\s*\}/, 'a failed read means no lorebook, not a failed reply');
  assert.match(body, /if \(!creatorId\) return \[\]/);
  // It is applied after the adult-content check, so a locked character never gets this far.
  assert.ok(chat.indexOf('requireAdultContentAccess(supabase, character.content_rating)') < chat.indexOf('loadLorebookEntries(character.id'));
});

test('new lorebooks are private and members only write their own', async () => {
  const lib = await readFile(new URL('../src/lib/lorebooks.ts', import.meta.url), 'utf8');
  assert.match(lib, /visibility: 'private'/);
  const page = await readFile(new URL('../src/pages/LorebookEditorPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /\.eq\('user_id', user\.id\)/, 'the editor loads only lorebooks owned by the member');
});
