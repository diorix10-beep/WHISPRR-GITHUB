import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const app = await server.ssrLoadModule('/src/lib/openings.ts');
  const api = await server.ssrLoadModule('/api/_lib/openings.ts');
  const prompt = await server.ssrLoadModule('/api/_lib/roleplayPrompt.ts');
  return { app, api, prompt, close: () => server.close() };
}

test('openings: the main one first, trimmed, no empty ones, no repeats (ignoring capitals); anything else is ignored', async () => {
  const { app, api, close } = await load();
  try {
    assert.deepEqual(app.cleanOpenings(' Hi. ', ['  Hello ', '', 'hi.', 5, null, 'Hello']), ['Hi.', 'Hello']);
    assert.deepEqual(app.cleanOpenings('', ['A']), ['A'], 'no main opening: the others still count');
    assert.deepEqual(app.cleanOpenings(null, null), []);
    assert.deepEqual(app.cleanOpenings('Hi', 'not a list'), ['Hi']);
    assert.equal(api.cleanOpenings, app.cleanOpenings, 'the server and the app share one rule');
  } finally { await close(); }
});

test('"surprise me" picks any opening, and never goes out of the list', async () => {
  const { app, close } = await load();
  try {
    const list = ['a', 'b', 'c'];
    assert.deepEqual([0, 0.2, 0.34, 0.66, 0.99, 1, 2, -1].map((roll) => app.surpriseOpening(list, roll)), ['a', 'a', 'b', 'b', 'c', 'c', 'c', 'a']);
    assert.equal(app.surpriseOpening([], 0.5), '');
    const seen = new Set(Array.from({ length: 300 }, () => app.surpriseOpening(list, Math.random())));
    assert.equal(seen.size, 3);
  } finally { await close(); }
});

test('the prompt describes the opening the scene really began with, not always the main one', async () => {
  const { api, prompt, close } = await load();
  try {
    const openings = api.cleanOpenings('*Rain on the quay.*', ['*A knock at midnight.*', '*She wakes up late.*']);
    assert.equal(api.openingUsed(openings, '*A knock at midnight.*'), '*A knock at midnight.*');
    assert.equal(api.openingUsed(openings, '  *She wakes up late.*  '), '*She wakes up late.*', 'spaces around the stored message do not matter');
    assert.equal(api.openingUsed(openings, '*Rain on the quay.*'), '*Rain on the quay.*');
    assert.equal(api.openingUsed(openings, 'Something the creator has since rewritten.'), '*Rain on the quay.*', 'unknown first message: the main opening');
    assert.equal(api.openingUsed(openings, null), '*Rain on the quay.*');
    assert.equal(api.openingUsed([], 'x'), '');

    const system = prompt.buildSystemPrompt({ name: 'Isolde', greeting: api.openingUsed(openings, '*A knock at midnight.*'), personality: 'Bold.' }, { display_name: 'Isolde' }, null, '', {});
    assert.match(system, /## Opening Scene & Tone Baseline[\s\S]*\*A knock at midnight\.\*/);
    assert.doesNotMatch(system, /Rain on the quay/);
  } finally { await close(); }
});

test('the chat page waits for the player to pick when there are several openings, and the server reads the one used', async () => {
  const page = await readFile(new URL('../src/pages/ConversationPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /select\('id, creator_id, name:chat_name, greeting, alternate_greetings, content_rating'\)/);
  assert.match(page, /info\.openings\.length <= 1/, 'with one opening the scene still opens by itself');
  assert.match(page, /const choosingOpening = messages\.length === 0 && scene\.openings\.length > 1 && !adultLocked/);
  assert.match(page, /disabled=\{adultLocked \|\| choosingOpening\}/, 'nothing can be written before an opening is picked');
  assert.match(page, /openingBusyRef/, 'a double click cannot write two openings');
  const chat = await readFile(new URL('../api/ai-chat.ts', import.meta.url), 'utf8');
  assert.match(chat, /openingUsed\(openings,/);
  assert.match(chat, /buildSystemPrompt\(promptCharacter,/);
  assert.match(chat, /if \(openings\.length > 1\)/, 'a character with one opening costs no extra read');
});
