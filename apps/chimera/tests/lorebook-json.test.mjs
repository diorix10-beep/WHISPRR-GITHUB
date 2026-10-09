import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const json = await server.ssrLoadModule('/src/lib/lorebookJson.ts');
  return { json, close: () => server.close() };
}
const text = (value) => JSON.stringify(value);

test('a character card "character_book" (V2) is read: keys, name, constant, enabled, priority, case', async () => {
  const { json, close } = await load();
  try {
    const book = { name: 'Maison Verity', description: 'The official lorebook.', scan_depth: 5, entries: [
      { keys: ['Kamala', 'Kamala Harris'], content: 'She is the lead.', name: 'Kamala', enabled: true, constant: false, insertion_order: 1, priority: 7, case_sensitive: true },
      { keys: [], content: 'Universe Two: January 2021.', comment: 'Timeline', enabled: true, constant: true },
      { keys: ['x'], content: 'Switched off.', enabled: false },
    ] };
    const read = json.parseLorebookJson(text({ spec: 'chara_card_v2', data: { name: 'Card', character_book: book } }));
    assert.equal(read.name, 'Maison Verity');
    assert.equal(read.description, 'The official lorebook.');
    assert.equal(read.scanDepth, 5);
    assert.deepEqual(read.entries[0], { title: 'Kamala', keywords: ['Kamala', 'Kamala Harris'], content: 'She is the lead.', isConstant: false, caseSensitive: true, enabled: true, priority: 7, scanDepth: null });
    assert.deepEqual([read.entries[1].isConstant, read.entries[1].title, read.entries[1].keywords], [true, 'Timeline', []]);
    assert.equal(read.entries[2].enabled, false);
    assert.deepEqual(read.notes, []);
    // The same book at the top level, or nested under other names.
    for (const wrapped of [book, { character_book: book }, { lorebook: book }, { data: { character_book: book } }]) {
      assert.equal(json.parseLorebookJson(text(wrapped)).entries.length, 3);
    }
  } finally { await close(); }
});

test('a SillyTavern world (entries keyed by number; key, comment, disable, order, depth) is read', async () => {
  const { json, close } = await load();
  try {
    const world = { entries: {
      '1': { uid: 1, key: ['harbour'], keysecondary: [], comment: 'The Harbour', content: 'Boats.', constant: false, disable: false, order: 100, depth: 4 },
      '0': { uid: 0, key: ['guild'], comment: 'The Guild', content: 'Lanterns.', disable: true, order: 50 },
      '2': { uid: 2, key: ['a', 'b'], comment: 'Always', content: 'Always on.', constant: true, scanDepth: 8 },
    } };
    const read = json.parseLorebookJson(text(world));
    assert.deepEqual(read.entries.map((e) => e.title), ['The Guild', 'The Harbour', 'Always'], 'in the order of their numbers');
    assert.deepEqual(read.entries.map((e) => e.enabled), [false, true, true], '"disable" means off');
    assert.deepEqual(read.entries.map((e) => e.priority), [50, 100, 0]);
    assert.deepEqual(read.entries.map((e) => e.scanDepth), [null, 4, 8]);
    assert.equal(read.entries[2].isConstant, true);
  } finally { await close(); }
});

test('other spellings are understood: a bare list, keywords as one string, "active", message depth, depth on the entry or in extensions', async () => {
  const { json, close } = await load();
  try {
    const read = json.parseLorebookJson(text([
      { keywords: 'Anthony, Anthony Harris;\nTony', text: 'About Anthony.', title: 'Anthony', active: true, message_depth: '10', always_active: false },
      { triggers: ['Asha'], entry: 'About Asha.', is_active: false, extensions: { scan_depth: 2 } },
    ]));
    assert.deepEqual(read.entries[0].keywords, ['Anthony', 'Anthony Harris', 'Tony']);
    assert.equal(read.entries[0].scanDepth, 10);
    assert.equal(read.entries[0].enabled, true);
    assert.deepEqual([read.entries[1].enabled, read.entries[1].scanDepth, read.entries[1].title], [false, 2, 'Asha'], 'the title falls back to the first keyword');
    assert.equal(json.parseLorebookJson(text({ entries: [{ keys: ['a'], content: 'b', depth: 99 }] })).entries[0].scanDepth, null, 'a depth outside 1 to 10 is ignored');
  } finally { await close(); }
});

test('unusable entries are left out and said so; entries without keywords get their name as keywords; a bad file gets a plain message', async () => {
  const { json, close } = await load();
  try {
    const read = json.parseLorebookJson(text({ entries: [
      { keys: ['ok'], content: 'Fine.' },
      { keys: ['empty'], content: '   ' },
      { content: 'No keyword and no name.' },
      { comment: 'The Lantern Guild', content: 'Named, no keyword.' },
      'not an entry',
      42,
    ] }));
    assert.deepEqual(read.entries.map((e) => e.title), ['ok', 'The Lantern Guild']);
    assert.ok(read.entries[1].keywords.includes('The Lantern Guild'), read.entries[1].keywords.join(','));
    const notes = read.notes.join(' | ');
    assert.match(notes, /1 entry without any text was left out/);
    assert.match(notes, /1 entry with no keyword and no name was left out/);
    assert.match(notes, /2 items that are not entries were left out/);
    assert.match(notes, /1 entry had no keyword: its name was used/);

    const failure = (raw, pattern) => assert.throws(() => json.parseLorebookJson(raw), (e) => e instanceof json.LorebookJsonError && pattern.test(e.message), raw.slice(0, 30));
    failure('{not json', /not valid JSON/);
    failure('', /not valid JSON/);
    failure('{"name":"no entries here"}', /does not look like a lorebook/);
    failure('{"entries":[]}', /no entries/);
    failure('{"entries":[{"keys":["a"],"content":""}]}', /None of the entries/);
    failure('null', /does not look like a lorebook/);
    failure('"just a string"', /does not look like a lorebook/);
    assert.equal(json.parseLorebookJson('﻿' + text([{ keys: ['a'], content: 'b' }])).entries.length, 1, 'a byte-order mark is fine');
  } finally { await close(); }
});

test('hostile files cannot do harm: prototype keys are ignored, deep nesting stops, and huge lists are bounded', async () => {
  const { json, close } = await load();
  try {
    const read = json.parseLorebookJson('{"__proto__":{"polluted":true},"entries":[{"keys":["a"],"content":"b","__proto__":{"x":1},"constructor":{"prototype":{"y":2}}}]}');
    assert.equal({}.polluted, undefined);
    assert.equal({}.x, undefined);
    assert.equal(read.entries.length, 1);
    let nested = { entries: [{ keys: ['a'], content: 'b' }] };
    for (let i = 0; i < 20; i += 1) nested = { data: nested };
    assert.throws(() => json.parseLorebookJson(text(nested)), json.LorebookJsonError, 'nesting stops at a few levels');
    const many = { entries: Array.from({ length: 3000 }, (_, i) => ({ keys: [`k${i}`], content: `c${i}` })) };
    const big = json.parseLorebookJson(text(many));
    assert.equal(big.entries.length, json.MAX_IMPORTED_ENTRIES);
    assert.match(big.notes.join(' '), /first 2,000 entries/);
    // Odd values in every field never throw.
    // (this one has no usable keyword or name, so it is refused with the plain message, never with a crash)
    assert.throws(() => json.parseLorebookJson(text({ entries: [{ keys: { a: 1 }, content: 'x', constant: 'maybe', priority: 'high', depth: {}, name: ['n'], enabled: 'yes' }] })), json.LorebookJsonError);
    assert.doesNotThrow(() => json.parseLorebookJson(text({ entries: [{ keys: { a: 1 }, content: 'x', constant: true, priority: 'high', depth: {}, name: ['n'], enabled: 'yes' }] })));
    const odd = json.parseLorebookJson(text({ entries: [{ keys: 5, content: 'x', constant: true, priority: 1e99 }] })).entries[0];
    assert.equal(odd.priority, 100000, 'priority is clamped');
  } finally { await close(); }
});

test('export then import gives the same lorebook back', async () => {
  const { json, close } = await load();
  try {
    const entries = [
      { title: 'Kamala', keywords: ['Kamala', 'Kamala Harris'], content: 'Lead.', isConstant: false, caseSensitive: true, enabled: true, priority: 3, scanDepth: 10 },
      { title: 'Timeline', keywords: [], content: 'Universe Two.', isConstant: true, caseSensitive: false, enabled: false, priority: 0, scanDepth: null },
    ];
    const exported = json.lorebookToJson({ name: 'Codex', description: 'About.', scanDepth: 4 }, entries);
    assert.equal(exported.entries[0].insertion_order, 0);
    assert.equal(exported.entries[1].insertion_order, 1);
    const back = json.parseLorebookJson(JSON.stringify(exported));
    assert.deepEqual([back.name, back.description, back.scanDepth], ['Codex', 'About.', 4]);
    assert.deepEqual(back.entries, entries);
    assert.deepEqual(back.notes, []);
  } finally { await close(); }
});
