import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const rich = await server.ssrLoadModule('/src/lib/richText.ts');
  return { ...rich, close: () => server.close() };
}
const join = (spans) => spans.map((s) => s.text).join('');

test('actions are italic, bold is bold, both at once, and the text between stays plain', async () => {
  const { parseRoleplayText: p, close } = await load();
  try {
    assert.deepEqual(p('*Kamala lowered herself onto the sofa.* "Hello."'), [{ text: 'Kamala lowered herself onto the sofa.', em: true }, { text: ' "Hello."' }]);
    assert.deepEqual(p('**Stop.** and *wait* and ***now***'), [{ text: 'Stop.', strong: true }, { text: ' and ' }, { text: 'wait', em: true }, { text: ' and ' }, { text: 'now', em: true, strong: true }]);
    assert.deepEqual(p('a _thought_ here'), [{ text: 'a ' }, { text: 'thought', em: true }, { text: ' here' }]);
    assert.deepEqual(p('*"Hello," she said.*\n\n*She smiled.*').map((s) => [s.text, !!s.em]), [['"Hello," she said.', true], ['\n\n', false], ['She smiled.', true]]);
    assert.deepEqual(p('plain text'), [{ text: 'plain text' }]);
    assert.deepEqual(p(''), []);
  } finally { await close(); }
});

test('formatting can nest, in both directions', async () => {
  const { parseRoleplayText: p, close } = await load();
  try {
    assert.deepEqual(p('**bold *it* bold**'), [{ text: 'bold ', strong: true }, { text: 'it', em: true, strong: true }, { text: ' bold', strong: true }]);
    assert.deepEqual(p('a *b **c** d* e'), [{ text: 'a ' }, { text: 'b ', em: true }, { text: 'c', em: true, strong: true }, { text: ' d', em: true }, { text: ' e' }]);
    assert.deepEqual(p('**bold *it***'), [{ text: 'bold ', strong: true }, { text: 'it', em: true, strong: true }]);
  } finally { await close(); }
});

test('odd text stays odd text: spaces, lists, snake_case, a stray marker, a marker across paragraphs, escapes', async () => {
  const { parseRoleplayText: p, close } = await load();
  try {
    for (const plain of ['2 * 3 * 4', '* item', '- item * other', 'snake_case_name', 'unmatched *star', 'unmatched **bold', '***', '**', '*', '_', '*  *', '**** four', '5 * 6', 'a * b']) {
      assert.deepEqual(p(plain), [{ text: plain }], plain);
    }
    // One stray asterisk never italicises the rest of the message.
    assert.deepEqual(p('one * stray\n\nsecond *para* here'), [{ text: 'one * stray\n\nsecond ' }, { text: 'para', em: true }, { text: ' here' }]);
    assert.deepEqual(p('*first\n\nsecond*'), [{ text: '*first\n\nsecond*' }]);
    // A backslash shows the character itself.
    assert.deepEqual(p('\\*not\\* *yes*'), [{ text: '*not* ' }, { text: 'yes', em: true }]);
    assert.equal(join(p('keep\nthe\nline breaks *and\nthis*')), 'keep\nthe\nline breaks and\nthis');
  } finally { await close(); }
});

test('what a message contains can never become markup: only text and flags come out', async () => {
  const { parseRoleplayText: p, plainText, close } = await load();
  try {
    const hostile = ['<script>alert(1)</script>', '*<img src=x onerror=alert(1)>*', '**<b>x</b>**', '[a](javascript:alert(1))', '<a href="x">y</a>', '&lt;b&gt;', '"><svg onload=1>', '*a*<style>*{}</style>'];
    for (const text of hostile) {
      const spans = p(text);
      for (const span of spans) assert.deepEqual(Object.keys(span).filter((k) => !['text', 'em', 'strong'].includes(k)), [], text);
      // Nothing is dropped or invented: the characters come back, minus the formatting marks.
      assert.equal(join(spans).replace(/[*]/g, ''), text.replace(/[*]/g, ''), text);
      assert.ok(plainText(text).includes(text.replace(/\*/g, '').slice(0, 5)));
    }
    const component = await readFile(new URL('../src/components/chat/RichMessage.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(component, /dangerouslySetInnerHTML|innerHTML/, 'built from React elements only');
    for (const file of ['MessageRow.tsx', 'MessageMenu.tsx']) {
      assert.doesNotMatch(await readFile(new URL(`../src/components/chat/${file}`, import.meta.url), 'utf8'), /dangerouslySetInnerHTML|innerHTML/, file);
    }
  } finally { await close(); }
});

test('strange input is handled in bounded time, and an old Safari does not choke on the code', async () => {
  const { parseRoleplayText: p, close } = await load();
  try {
    const worst = ['*a '.repeat(10_000), '*a*'.repeat(10_000), '**a *b '.repeat(4_000), '_a '.repeat(10_000), '*'.repeat(30_000), ('x *y\n'.repeat(1_000) + '\n\n').repeat(5), '\\'.repeat(20_000)];
    for (const text of worst) {
      const started = Date.now();
      const spans = p(text);
      assert.ok(Date.now() - started < 300, `${text.slice(0, 10)}… took ${Date.now() - started} ms`);
      assert.equal(join(spans).replace(/[*_\\]/g, '').length <= text.length, true);
    }
    // Look-behind in a regular expression fails to compile in Safari before 16.4, which would break the whole page.
    const source = await readFile(new URL('../src/lib/richText.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\(\?<[=!]/);
  } finally { await close(); }
});

test('the editing limits match what is sent and what the character can answer', async () => {
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
    process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
    const chat = await server.ssrLoadModule('/src/lib/chat.ts');
    assert.equal(chat.MESSAGE_EDIT_LIMITS.player, 4_000, 'the composer allows 4,000');
    assert.equal(chat.MESSAGE_EDIT_LIMITS.character, 32_000, 'the database refuses a reply over 32,000');
  } finally { await server.close(); }
});
