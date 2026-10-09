import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const split = await server.ssrLoadModule('/src/lib/lorebookSplit.ts');
  const book = await server.ssrLoadModule('/src/lib/lorebooks.ts');
  return { split, book, close: () => server.close() };
}
const squash = (text) => text.replace(/\s+/g, '');

const MARKDOWN = '# The Lantern Guild\nThey keep the harbour lights.\n\n# Captain Isolde Vance\nA sky-pirate with a map.\n\n## Her ship\nThe Wren.';
const CAPS = 'Intro text before anything.\n\nTHE LANTERN GUILD\nThey keep the harbour lights.\n\nCAPTAIN ISOLDE VANCE\nA sky-pirate with a map.';
const LABELLED = 'EPISODE 1: The Harbour\nIsolde arrives.\n\nEPISODE 2 / UNIVERSE TWO\nThe lights go out.\n\nPart 3\nA reckoning.';
const NUMBERED = '1. The harbour\nBoats.\n\n2. The guild\nLanterns.\n\n3 The map\nA map.';

test('heading styles are detected, each only when there are at least two headings, and the example is real', async () => {
  const { split, close } = await load();
  try {
    assert.deepEqual(split.detectStyles(MARKDOWN).map((s) => s.style), ['markdown']);
    assert.equal(split.detectStyles(MARKDOWN)[0].count, 3);
    assert.ok(split.detectStyles(CAPS).some((s) => s.style === 'caps' && s.count === 2));
    assert.ok(split.detectStyles(LABELLED).some((s) => s.style === 'labelled' && s.count === 3));
    assert.ok(split.detectStyles(NUMBERED).some((s) => s.style === 'numbered' && s.count >= 2));
    assert.deepEqual(split.detectStyles('Just a paragraph.\n\nAnother one.'), [], 'no headings: nothing offered');
    assert.deepEqual(split.detectStyles('# Only one heading\nText.'), [], 'one heading is not a structure');
    assert.equal(split.defaultStyle([]), 'none');
    assert.equal(split.defaultStyle(split.detectStyles(MARKDOWN)), 'markdown');
    // A sentence is not a heading, even in capitals with a full stop.
    assert.equal(split.isHeading('caps', 'THIS IS SHOUTED AS A SENTENCE.'), false);
    assert.equal(split.isHeading('caps', 'Mixed Case Title'), false);
  } finally { await close(); }
});

test('the text is cut at the headings; text before the first heading is kept as an Introduction; no text is lost', async () => {
  const { split, close } = await load();
  try {
    const sections = split.splitByStyle(CAPS, 'caps');
    assert.deepEqual(sections.map((s) => s.title), ['Introduction', 'THE LANTERN GUILD', 'CAPTAIN ISOLDE VANCE']);
    assert.equal(sections[0].body, 'Intro text before anything.');
    const md = split.splitByStyle(MARKDOWN, 'markdown');
    assert.deepEqual(md.map((s) => s.title), ['The Lantern Guild', 'Captain Isolde Vance', 'Her ship']);
    // Everything that is not a heading line is still there.
    assert.equal(squash(md.map((s) => s.body).join('')), squash('They keep the harbour lights.A sky-pirate with a map.The Wren.'));
    assert.equal(split.splitByStyle('plain text only', 'none').length, 1);
    assert.deepEqual(split.splitByStyle('', 'none'), []);
  } finally { await close(); }
});

test('long parts are cut at paragraph and sentence ends, never longer than the limit, and nothing is lost', async () => {
  const { split, close } = await load();
  try {
    const paragraph = (n) => `Paragraph ${n}. ` + 'Sentence of lore that goes on. '.repeat(30);
    const long = Array.from({ length: 12 }, (_, i) => paragraph(i)).join('\n\n');
    const chunks = split.chunkBody(long, 2000);
    assert.ok(chunks.length >= 5 && chunks.every((c) => c.length <= 2000), chunks.map((c) => c.length).join(','));
    assert.equal(squash(chunks.join('')), squash(long));
    assert.ok(chunks.every((c) => c === c.trim() && c.length > 0));
    // One huge paragraph with no blank line is cut at sentence ends.
    const solid = 'A sentence about the harbour. '.repeat(400);
    const cut = split.chunkBody(solid, 1000);
    assert.ok(cut.every((c) => c.length <= 1000) && cut.slice(0, -1).every((c) => c.endsWith('.')));
    assert.equal(squash(cut.join('')), squash(solid));
    // No spaces at all: a hard cut, still no loss.
    const blob = 'x'.repeat(5000);
    assert.equal(split.chunkBody(blob, 2000).join(''), blob);
    assert.deepEqual(split.chunkBody('   ', 2000), []);
    assert.deepEqual(split.chunkBody('short', 2000), ['short']);
  } finally { await close(); }
});

test('keywords come from the heading: the heading itself when short, its meaningful words, never empty, no filler words', async () => {
  const { split, close } = await load();
  try {
    assert.deepEqual(split.suggestKeywords('The Lantern Guild'), ['The Lantern Guild', 'Lantern', 'Guild']);
    assert.ok(split.suggestKeywords('Captain Isolde Vance').includes('Isolde'));
    const noisy = split.suggestKeywords('EPISODE 2 / UNIVERSE TWO COMPLETE CHARACTER DEFINITION & ROLEPLAY CODEX COMPACT PARAGRAPH EDITION');
    assert.ok(noisy.includes('CHARACTER') && !noisy.some((k) => /^(EPISODE|CODEX|COMPLETE)$/i.test(k)), noisy.join(','));
    assert.ok(noisy.length <= 6);
    assert.deepEqual(split.suggestKeywords('Part 2').length > 0, true, 'a heading made only of filler still gets a keyword');
    assert.ok(split.suggestKeywords('x'.repeat(200))[0].length <= 60);
    assert.deepEqual(split.keywordsFromContent('Isolde sailed to Verity. Later, Isolde met Marcus at Verity. Verity burned.').slice(0, 2), ['Verity', 'Isolde']);
  } finally { await close(); }
});

test('draft entries: one per heading, long ones numbered with the same keywords, the short introduction starts always-on', async () => {
  const { split, close } = await load();
  try {
    const drafts = split.buildDrafts(CAPS, 'caps');
    assert.deepEqual(drafts.map((d) => d.title), ['Introduction', 'THE LANTERN GUILD', 'CAPTAIN ISOLDE VANCE']);
    assert.deepEqual(drafts.map((d) => d.isConstant), [true, false, false]);
    assert.ok(drafts.slice(1).every((d) => d.keywords.length > 0), 'every headed entry has keywords');

    const body = Array.from({ length: 10 }, (_, i) => `Part ${i}. ` + 'Lore sentence here. '.repeat(40)).join('\n\n');
    const long = split.buildDrafts(`# The Archive\n${body}`, 'markdown');
    assert.ok(long.length > 1 && long.every((d) => d.content.length <= split.SPLIT_CHUNK_CHARACTERS));
    assert.deepEqual(long.map((d) => d.title).slice(0, 2), ['The Archive (1)', 'The Archive (2)']);
    assert.equal(new Set(long.map((d) => d.keywords)).size, 1, 'the parts share the heading keywords');
    assert.ok(long.every((d) => !d.isConstant));

    // No headings at all: cut by size, named Part N, keywords from the names in the text.
    const flat = Array.from({ length: 8 }, (_, i) => `Isolde walked the docks of Verity, number ${i}. `.repeat(60)).join('\n\n');
    const plain = split.buildDrafts(flat, 'none');
    assert.ok(plain.length >= 8 && plain[0].title === 'Part 1' && plain.every((d) => d.content.length <= split.SPLIT_CHUNK_CHARACTERS));
    assert.match(plain[0].keywords, /Isolde|Verity/);
  } finally { await close(); }
});

test('a codex of about 650,000 characters becomes a few hundred entries quickly, losing no text', async () => {
  const { split, close } = await load();
  try {
    const sections = Array.from({ length: 160 }, (_, i) => `SECTION ${i + 1} THE HOUSE OF ${['ASH', 'GLASS', 'IRON', 'SALT'][i % 4]} ${i}\n` + Array.from({ length: 9 }, (_, j) => `Paragraph ${j} of the house. ` + 'It stands above the sea and remembers everything. '.repeat(10)).join('\n\n'));
    const text = sections.join('\n\n');
    assert.ok(text.length > 600_000, `text is ${text.length}`);
    const started = Date.now();
    const styles = split.detectStyles(text);
    const drafts = split.buildDrafts(text, split.defaultStyle(styles));
    assert.ok(Date.now() - started < 3000, `took ${Date.now() - started} ms`);
    assert.ok(drafts.length >= 160 && drafts.length < 2000, `${drafts.length} entries`);
    assert.ok(drafts.every((d) => d.content.length <= split.SPLIT_CHUNK_CHARACTERS));
    const kept = squash(drafts.map((d) => d.content).join(''));
    const original = squash(text.split('\n').filter((line) => !split.isHeading(split.defaultStyle(styles), line)).join('\n'));
    assert.equal(kept, original, 'everything that is not a heading is in an entry');
  } finally { await close(); }
});
