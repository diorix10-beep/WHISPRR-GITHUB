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
