import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const models = await server.ssrLoadModule('/src/lib/chatModels.ts');
  const providers = await server.ssrLoadModule('/api/_lib/modelProviders.ts');
  const protection = await server.ssrLoadModule('/api/_lib/requestProtection.ts');
  return { ...models, ...providers, RequestError: protection.RequestError, close: () => server.close() };
}

const model = (over) => ({ id: 'x', name: 'X', provider: 'openrouter', company: 'c', engineName: 'e', description: '', strengths: [], bestFor: '', consideration: '', tier: 'free', status: 'available', ...over });

test('the real catalog: SUPERNOVA is the default and the only model that can be used today', async () => {
  const { CHAT_MODELS, DEFAULT_MODEL_ID, usableModels, findModel, isUsable, close } = await load();
  try {
    assert.equal(DEFAULT_MODEL_ID, 'gemini-2.5-flash');
    assert.deepEqual(usableModels().map((m) => m.name), ['SUPERNOVA']);
    assert.equal(findModel(DEFAULT_MODEL_ID).provider, 'gemini');
    assert.equal(new Set(CHAT_MODELS.map((m) => m.id)).size, CHAT_MODELS.length, 'ids are unique');
    assert.ok(CHAT_MODELS.every((m) => !m.uncensored), 'no uncensored model before age verification exists');
    assert.ok(CHAT_MODELS.filter((m) => m.tier === 'shards').every((m) => !isUsable(m)), 'a paid model is never usable');
  } finally { await close(); }
});

test('resolveModel: member, then character, then default; unusable or unknown choices are skipped, never used', async () => {
  const { resolveModel, close } = await load();
  try {
    const catalog = [
      model({ id: 'gemini-2.5-flash', name: 'DEFAULT', provider: 'gemini' }),
      model({ id: 'a/free', name: 'FREE' }),
      model({ id: 'a/free2', name: 'FREE2' }),
      model({ id: 'a/paid', name: 'PAID', tier: 'shards' }),
      model({ id: 'a/soon', name: 'SOON', status: 'soon' }),
      model({ id: 'a/raw', name: 'RAW', uncensored: true }),
    ];
    const pick = (choice, adultVerified = false) => resolveModel(choice, { adultVerified }, catalog).name;
    assert.equal(pick({}), 'DEFAULT');
    assert.equal(pick({ member: 'a/free', character: 'a/free2' }), 'FREE');
    assert.equal(pick({ character: 'a/free2' }), 'FREE2');
    assert.equal(pick({ member: 'a/paid', character: 'a/free2' }), 'FREE2', 'a paid member choice is skipped');
    for (const bad of ['a/paid', 'a/soon', 'nope', '', null, undefined, '__proto__', 'a/free ']) assert.equal(pick({ member: bad }), 'DEFAULT', String(bad));
    assert.equal(pick({ member: 'a/raw' }), 'DEFAULT', 'uncensored model refused outside an adult scene');
    assert.equal(pick({ member: 'a/raw' }, true), 'RAW', 'and allowed in a verified adult scene');
    assert.throws(() => resolveModel({}, { adultVerified: false }, [model({ id: 'a/free' })]), /default model is missing/);
  } finally { await close(); }
});

test('generateReply: Gemini and OpenRouter requests are shaped correctly, and errors never leak keys or provider text', async () => {
  const { generateReply, providerKeys, RequestError, close } = await load();
  const realFetch = globalThis.fetch;
  try {
    const seen = [];
    let reply = { ok: true, body: {} };
    globalThis.fetch = async (url, init) => {
      seen.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
      return reply.ok ? new Response(JSON.stringify(reply.body), { status: 200 }) : new Response('provider text with SECRET', { status: 500 });
    };
    const turns = [{ role: 'user', text: 'hi' }, { role: 'model', text: 'hello' }, { role: 'user', text: 'again' }];
    const keys = { gemini: 'GKEY', openrouter: 'ORKEY' };

    reply = { ok: true, body: { candidates: [{ content: { parts: [{ text: 'A' }, { text: 'B' }] } }] } };
    assert.equal(await generateReply({ model: model({ id: 'gemini-2.5-flash', provider: 'gemini' }), systemPrompt: 'SYS', turns, maxOutputTokens: 777, keys }), 'AB');
    assert.match(seen[0].url, /models\/gemini-2\.5-flash:generateContent\?key=GKEY$/);
    assert.equal(seen[0].body.systemInstruction.parts[0].text, 'SYS');
    assert.deepEqual(seen[0].body.contents.map((c) => c.role), ['user', 'model', 'user']);
    assert.equal(seen[0].body.generationConfig.maxOutputTokens, 777);

    reply = { ok: true, body: { choices: [{ message: { content: 'OR reply' } }] } };
    assert.equal(await generateReply({ model: model({ id: 'v/m', name: 'M' }), systemPrompt: 'SYS', turns, maxOutputTokens: 500, keys }), 'OR reply');
    assert.equal(seen[1].url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(seen[1].headers.Authorization, 'Bearer ORKEY');
    assert.deepEqual(seen[1].body.messages.map((m) => m.role), ['system', 'user', 'assistant', 'user']);
    assert.equal(seen[1].body.model, 'v/m'); assert.equal(seen[1].body.max_tokens, 500);

    reply = { ok: true, body: { choices: [] } };
    assert.equal(await generateReply({ model: model({}), systemPrompt: 'S', turns, maxOutputTokens: 1, keys }), '', 'empty answer is reported as empty, not thrown');

    reply = { ok: false };
    for (const m of [model({ provider: 'gemini' }), model({ name: 'M' })]) {
      await assert.rejects(generateReply({ model: m, systemPrompt: 'S', turns, maxOutputTokens: 1, keys }), (error) => error instanceof RequestError && error.status === 502 && !/SECRET|KEY|http/i.test(error.message));
    }
    await assert.rejects(generateReply({ model: model({ name: 'M' }), systemPrompt: 'S', turns, maxOutputTokens: 1, keys: {} }), (error) => error.status === 503 && /Model House/.test(error.message));
    await assert.rejects(generateReply({ model: model({ provider: 'gemini' }), systemPrompt: 'S', turns, maxOutputTokens: 1, keys: {} }), (error) => error.status === 503);
    assert.deepEqual(providerKeys({ GEMINI_API_KEY_SERVER: 'a', OPENROUTER_API_KEY: 'b' }), { gemini: 'a', openrouter: 'b' });
    assert.equal(providerKeys({ GEMINI_API_KEY: 'legacy' }).gemini, 'legacy');
  } finally {
    globalThis.fetch = realFetch;
    await close();
  }
});
