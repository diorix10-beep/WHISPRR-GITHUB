import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function server() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  return createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
}

test('the look: only known choices are kept, anything else goes back to the default, and odd input cannot break it', async () => {
  const vite = await server();
  try {
    const { normalizeLook, DEFAULT_LOOK, isDefaultLook } = await vite.ssrLoadModule('/src/lib/chatLook.ts');
    assert.deepEqual(normalizeLook(undefined), DEFAULT_LOOK);
    assert.deepEqual(normalizeLook(null), DEFAULT_LOOK);
    assert.deepEqual(normalizeLook('xl'), DEFAULT_LOOK);
    assert.deepEqual(normalizeLook([1, 2]), DEFAULT_LOOK);
    assert.deepEqual(normalizeLook({ size: 'huge', spacing: 7, align: null, bubble: {}, font: 'comic', narration: 'x', dialogue: '' }), DEFAULT_LOOK, 'unknown values');
    const mixed = normalizeLook({ size: 'xl', spacing: 'nope', bubble: 'plain', extra: 'ignored', __proto__: { size: 's' } });
    assert.deepEqual(mixed, { ...DEFAULT_LOOK, size: 'xl', bubble: 'plain' }, 'a valid choice survives next to invalid ones; extra keys are dropped');
    assert.equal(Object.keys(mixed).length, 7);
    assert.equal(isDefaultLook(DEFAULT_LOOK), true);
    assert.equal(isDefaultLook(mixed), false);
    assert.ok(!('extra' in mixed));
  } finally { await vite.close(); }
});

test('the look is kept in the browser, forgotten when it is the default, and a browser that refuses storage never breaks the chat', async () => {
  const vite = await server();
  try {
    const { readLook, writeLook, DEFAULT_LOOK } = await vite.ssrLoadModule('/src/lib/chatLook.ts');
    const map = new Map();
    const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
    assert.deepEqual(readLook(storage), DEFAULT_LOOK, 'nothing saved: the defaults');
    const mine = { ...DEFAULT_LOOK, size: 'l', align: 'left', dialogue: 'gold' };
    assert.equal(writeLook(mine, storage), true);
    assert.deepEqual(readLook(storage), mine);
    assert.equal(map.size, 1);
    assert.equal(writeLook({ ...DEFAULT_LOOK }, storage), true);
    assert.equal(map.size, 0, 'back to the defaults leaves nothing stored');
    map.set('chimera.chat.look', '{not json');
    assert.deepEqual(readLook(storage), DEFAULT_LOOK, 'broken data');
    map.set('chimera.chat.look', JSON.stringify({ size: 'xl', font: 'wingdings' }));
    assert.deepEqual(readLook(storage), { ...DEFAULT_LOOK, size: 'xl' }, 'edited data keeps what is valid');
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    assert.deepEqual(readLook(broken), DEFAULT_LOOK);
    assert.equal(writeLook(mine, broken), false, 'said, not thrown');
    assert.deepEqual(readLook(null), DEFAULT_LOOK);
    assert.equal(writeLook(mine, null), false);
  } finally { await vite.close(); }
});

test('every choice offered has a style rule, and every default keeps the old look (so an untouched chat is unchanged)', async () => {
  const vite = await server();
  try {
    const { LOOK_OPTIONS, DEFAULT_LOOK, lookAttributes } = await vite.ssrLoadModule('/src/lib/chatLook.ts');
    const css = await read('src/index.css');
    const attr = (key) => `data-${key}`;
    for (const key of Object.keys(LOOK_OPTIONS)) {
      assert.equal(LOOK_OPTIONS[key].filter((o) => o.id === DEFAULT_LOOK[key]).length, 1, `${key} has its default among the options`);
      for (const option of LOOK_OPTIONS[key]) {
        if (option.id === DEFAULT_LOOK[key]) {
          assert.ok(!css.includes(`[${attr(key)}='${option.id}']`), `${key}=${option.id} is the default: no rule, the base style is the old look`);
        } else {
          assert.ok(css.includes(`[${attr(key)}='${option.id}']`), `${key}=${option.id} has a rule`);
        }
      }
    }
    assert.deepEqual(Object.keys(lookAttributes(DEFAULT_LOOK)).sort(), Object.keys(LOOK_OPTIONS).map(attr).sort());
    // The base style is the former fixed one: 17px, relaxed line height, 1rem radius, 12 by 16 padding, 1rem between messages.
    assert.match(css, /\.msg-text \{[^}]*border-radius: var\(--look-radius, 1rem\)[^}]*padding: var\(--look-pad-y, 0\.75rem\) var\(--look-pad-x, 1rem\)[^}]*font-size: var\(--look-size, 17px\)[^}]*line-height: var\(--look-lh, 1\.625\)/);
    assert.match(css, /\.msg-list > \* \+ \* \{ margin-top: var\(--look-gap, 1rem\); \}/);
    // Nothing in a rule can hide a message or make it unreadable.
    const rules = css.slice(css.indexOf('.chat-look[data-size'));
    assert.doesNotMatch(rules, /display:\s*none|visibility:\s*hidden|opacity:\s*0|font-size:\s*[0-9.]+px[^;]*;[^}]*font-size:\s*[0-9]\b/);
  } finally { await vite.close(); }
});

test('dialogue is found in plain text: quotation marks kept, unmatched marks left alone, the text never changed', async () => {
  const vite = await server();
  try {
    const { splitDialogue } = await vite.ssrLoadModule('/src/lib/richText.ts');
    const join = (parts) => parts.map((p) => p.text).join('');
    const spoken = (text) => splitDialogue(text).filter((p) => p.spoken).map((p) => p.text);
    assert.deepEqual(splitDialogue('She smiled. "Hello there," she said.'), [
      { text: 'She smiled. ', spoken: false }, { text: '"Hello there,"', spoken: true }, { text: ' she said.', spoken: false },
    ]);
    assert.deepEqual(spoken('“Curly” and "straight" and “mixed"'), ['“Curly”', '"straight"', '“mixed"']);
    assert.deepEqual(spoken('one "two" three "four"'), ['"two"', '"four"']);
    assert.deepEqual(spoken('no quotes at all'), []);
    assert.deepEqual(spoken('a lone " mark'), [], 'an unmatched mark is plain text');
    assert.deepEqual(spoken('empty "" quotes'), [], 'nothing said');
    assert.deepEqual(spoken('"A line\nbreak" closes on the next line'), [], 'a quotation does not run across a line break');
    assert.deepEqual(spoken('He said 5" nails'), [], 'a single inch mark is not a quotation');
    assert.deepEqual(spoken(`"${'x'.repeat(1300)}"`), [], 'too long to be speech');
    assert.deepEqual(splitDialogue(''), []);
    // The parts always add up to the original text, whatever the input.
    for (const text of ['', '"', '""', '"""', '"a"b"c"', '““”', 'x"y\n"z"', '"”"“']) assert.equal(join(splitDialogue(text)), text, JSON.stringify(text));
    let seed = 7;
    const alphabet = ['"', '“', '”', 'a', ' ', '\n', '*'];
    for (let n = 0; n < 300; n += 1) {
      let text = '';
      for (let k = 0; k < 40; k += 1) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; text += alphabet[seed % alphabet.length]; }
      assert.equal(join(splitDialogue(text)), text);
    }
  } finally { await vite.close(); }
});

test('parseMessage cuts the formatted text where speech starts and stops, and never changes a character', async () => {
  const vite = await server();
  try {
    const { parseMessage, parseRoleplayText } = await vite.ssrLoadModule('/src/lib/richText.ts');
    const join = (spans) => spans.map((s) => s.text).join('');
    const text = '*Rain.* "Sit down, **please**." she said. "Or *stand*," he added.';
    const spans = parseMessage(text);
    assert.equal(join(spans), join(parseRoleplayText(text)), 'the same visible text as before');
    assert.deepEqual(spans.filter((s) => s.spoken).map((s) => [s.text, !!s.em, !!s.strong]), [
      ['"Sit down, ', false, false], ['please', false, true], ['."', false, false], ['"Or ', false, false], ['stand', true, false], [',"', false, false],
    ]);
    assert.deepEqual(parseMessage('No quotation marks here, *just an action*.'), parseRoleplayText('No quotation marks here, *just an action*.'), 'nothing to mark: exactly the old spans');
    for (const odd of ['"', '""', '*"*', '"*a', '*"a"*"', '**"x**"', '\u201C*\u201D*', 'a "b" c "d', '"\n"']) assert.equal(join(parseMessage(odd)), join(parseRoleplayText(odd)), JSON.stringify(odd));
    // Cut flags always cover whole characters, in order, with no gaps or overlaps.
    let seed = 11;
    const alphabet = ['"', '\u201C', '\u201D', '*', '_', 'a', ' ', '\n', '**'];
    for (let n = 0; n < 400; n += 1) {
      let text2 = '';
      for (let k = 0; k < 30; k += 1) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; text2 += alphabet[seed % alphabet.length]; }
      assert.equal(join(parseMessage(text2)), join(parseRoleplayText(text2)), JSON.stringify(text2));
    }
  } finally { await vite.close(); }
});

test('dialogue detection stays fast on hostile input', async () => {
  const vite = await server();
  try {
    const { splitDialogue } = await vite.ssrLoadModule('/src/lib/richText.ts');
    for (const text of ['“'.repeat(200_000), '"'.repeat(200_000), '“a '.repeat(100_000), ('"x\n').repeat(60_000), '“' + 'a'.repeat(300_000)]) {
      const start = performance.now();
      const parts = splitDialogue(text);
      const took = performance.now() - start;
      assert.equal(parts.map((p) => p.text).join(''), text);
      assert.ok(took < 300, `${took.toFixed(0)} ms`);
    }
  } finally { await vite.close(); }
});

test('messages mark what is said and still draw everything as plain elements: no markup from a message, text unchanged', async () => {
  const vite = await server();
  try {
    const { RichMessage } = await vite.ssrLoadModule('/src/components/chat/RichMessage.tsx');
    const React = (await import('react')).default;
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(RichMessage, { text: '*She smiles.* "Hello," she says. **"Sit."** <img src=x onerror=alert(1)> "<b>bold</b>"' }));
    assert.match(html, /<em>She smiles\.<\/em>/);
    assert.match(html, /<span class="rp-dialogue">&quot;Hello,&quot;<\/span>/);
    assert.match(html, /<strong><span class="rp-dialogue">&quot;Sit\.&quot;<\/span><\/strong>/);
    // Speech that runs across a bold word is one quotation, drawn in three pieces; the words are the same.
    const across = renderToStaticMarkup(React.createElement(RichMessage, { text: '"Sit down, **please**." she said.' }));
    assert.equal(across, '<span class="rp-dialogue">&quot;Sit down, </span><strong><span class="rp-dialogue">please</span></strong><span class="rp-dialogue">.&quot;</span> she said.');
    // Speech inside an action keeps both.
    const inside = renderToStaticMarkup(React.createElement(RichMessage, { text: '*she whispers "come closer" and waits*' }));
    assert.equal(inside, '<em>she whispers </em><em><span class="rp-dialogue">&quot;come closer&quot;</span></em><em> and waits</em>');
    assert.doesNotMatch(html, /<img|<b>|<script/, 'a message cannot add elements');
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    const plain = renderToStaticMarkup(React.createElement(RichMessage, { text: 'Nothing special here.' }));
    assert.equal(plain, 'Nothing special here.', 'a message without quotes is drawn exactly as before');
  } finally { await vite.close(); }
});

test('the Look tab is wired and only changes how things are drawn: nothing is sent to the server or the database', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /id: 'look', label: 'Look'/);
  assert.match(page, /<LookSection look=\{look\}/);
  assert.match(page, /chat-look [^"]*"[^>]*\{\.\.\.lookAttributes\(look\)\}/);
  assert.match(page, /className="msg-list /);
  const row = await read('src/components/chat/MessageRow.tsx');
  assert.match(row, /msg-text/);
  assert.match(row, /msg-row-mine/);
  // The look never reaches the reply request, the database or the API.
  const lib = await read('src/lib/chatLook.ts');
  assert.doesNotMatch(lib + (await read('src/hooks/useChatLook.ts')), /supabase|fetch\(|\/api\//);
  assert.doesNotMatch(await read('src/lib/chat.ts'), /chatLook|ChatLook|lookAttributes/);
  for (const file of ['api/ai-chat.ts', 'api/chimera-memory.ts']) assert.doesNotMatch(await read(file), /chat\.look|chatLook/, file);
  const section = await read('src/components/chat/panel/LookSection.tsx');
  assert.match(section, /role="radiogroup"/);
  assert.match(section, /role="radio"/);
  assert.match(section, /aria-checked/);
  assert.match(section, /min-h-\[44px\]/);
  assert.match(section, /onKeyDown=\{radioGroupKeys\}/, 'arrow keys move between the choices');
  assert.match(section, /tabIndex=\{selected \? 0 : -1\}/);
  assert.match(await read('src/components/chat/panel/PersonaSection.tsx'), /onKeyDown=\{radioGroupKeys\}/);
  assert.match(section, /Back to the defaults/);
  assert.match(section, /would not keep your choices/);
});

test('dialogue wins over narration where they overlap: its selectors are more specific than the narration ones', async () => {
  const css = await read('src/index.css');
  // Specificity as (ids, classes and attributes, elements) of the selector part before the declaration block.
  const specificity = (selector) => {
    const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]/g) ?? []).length;
    const elements = (selector.replace(/\[[^\]]+\]/g, '').replace(/\.[\w-]+/g, '').match(/(^|\s)[a-z][\w-]*/g) ?? []).length;
    return [classes, elements];
  };
  const rule = (needle) => {
    const line = css.split('\n').find((l) => l.startsWith(needle));
    assert.ok(line, needle);
    return line.slice(0, line.indexOf('{')).trim();
  };
  const higher = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  for (const narration of ['soft', 'gold', 'upright']) {
    for (const dialogue of ['gold', 'bold']) {
      const n = specificity(rule(`.chat-look[data-narration='${narration}']`));
      const d = specificity(rule(`.chat-look[data-dialogue='${dialogue}']`));
      assert.ok(higher(d, n), `dialogue ${dialogue} (${d}) must beat narration ${narration} (${n})`);
    }
  }
});
