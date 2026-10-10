import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('the prompt never carries the real date or time: the story has its own time', async () => {
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { buildSystemPrompt } = await server.ssrLoadModule('/api/_lib/roleplayPrompt.ts');
    const character = { chat_name: 'Mara', personality: 'Dry wit.', content_rating: 'SFW', category: 'Fantasy', tags: ['sea'] };
    const bot = { display_name: 'Mara', username: 'mara' };
    const prompt = buildSystemPrompt(character, bot, null, null);
    assert.ok(!/Current datetime/i.test(prompt), 'the real-clock line is gone');
    assert.ok(!/\b20\d\d-\d\d-\d\dT\d\d:\d\d/.test(prompt), 'no ISO timestamp anywhere');
    assert.ok(prompt.includes('Story time: only what the scene itself says'), 'the model is told where story time comes from');
    assert.ok(prompt.includes('Category: Fantasy') && prompt.includes('Tags: sea'), 'the rest of the runtime block is unchanged');
    const same = buildSystemPrompt(character, bot, null, null);
    assert.equal(same, prompt, 'the prompt no longer changes from one second to the next (so it can be cached)');
  } finally { await server.close(); }
});

test('the movement choice reaches the whole page, and programmatic scrolling honours it', async () => {
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const attrs = new Map();
  const root = { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k), hasAttribute: (k) => attrs.has(k) };
  let deviceReduces = false;
  globalThis.document = { documentElement: root };
  globalThis.window = { matchMedia: () => ({ matches: deviceReduces }) };
  try {
    const { applyMotion, wantsLessMotion, scrollBehavior } = await server.ssrLoadModule('/src/lib/motion.ts');
    assert.equal(scrollBehavior(), 'smooth', 'nothing asked: smooth scrolling as before');
    applyMotion('reduced');
    assert.equal(attrs.get('data-motion'), 'reduced');
    assert.equal(scrollBehavior(), 'auto');
    applyMotion('calm');
    assert.equal(attrs.get('data-motion'), 'calm');
    assert.equal(wantsLessMotion(), true);
    applyMotion('device');
    assert.equal(attrs.has('data-motion'), false, 'back to the device setting: attribute removed');
    applyMotion('nonsense');
    assert.equal(attrs.has('data-motion'), false, 'unknown values change nothing');
    deviceReduces = true;
    assert.equal(scrollBehavior(), 'auto', 'the device asking for less movement is honoured too');
    // The only scrolling call that asks for smooth movement goes through scrollBehavior().
    const { readFile } = await import('node:fs/promises');
    const page = await readFile(new URL('../src/pages/ConversationPage.tsx', import.meta.url), 'utf8');
    assert.ok(!/behavior:\s*'smooth'/.test(page), "no hard-coded behavior: 'smooth' in the conversation page");
    assert.ok(page.includes('behavior: scrollBehavior()'));
    const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.ok(app.includes('useMotionPreference()'), 'the saved choice is applied by the app, not only by the conversation page');
  } finally {
    delete globalThis.document;
    delete globalThis.window;
    await server.close();
  }
});
