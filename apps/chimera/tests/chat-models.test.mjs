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
  const billing = await server.ssrLoadModule('/api/_lib/replyBilling.ts');
  return { ...models, ...providers, ...billing, RequestError: protection.RequestError, close: () => server.close() };
}

const model = (over) => ({ id: 'x', name: 'X', provider: 'openrouter', company: 'c', engineName: 'e', description: '', strengths: [], bestFor: '', consideration: '', tier: 'free', status: 'available', ...over });

test('the real catalog: SUPERNOVA is the default and the only model that can be used today', async () => {
  const { CHAT_MODELS, DEFAULT_MODEL_ID, usableModels, findModel, isUsable, defaultGeminiModels, close } = await load();
  try {
    assert.equal(DEFAULT_MODEL_ID, 'gemini-3.1-flash-lite');
    assert.deepEqual(usableModels().map((m) => m.name), ['SUPERNOVA']);
    assert.equal(findModel(DEFAULT_MODEL_ID).provider, 'gemini');
    // Gemini 2.5 Flash is retired on 2026-10-20: saved preferences keep working through an alias.
    assert.equal(findModel('gemini-2.5-flash').id, DEFAULT_MODEL_ID);
    assert.deepEqual(defaultGeminiModels(), ['gemini-3.1-flash-lite', 'gemini-2.5-flash']);
    assert.equal(new Set(CHAT_MODELS.map((m) => m.id)).size, CHAT_MODELS.length, 'ids are unique');
    assert.ok(CHAT_MODELS.every((m) => !m.uncensored), 'no uncensored model before age verification exists');
    assert.ok(CHAT_MODELS.filter((m) => m.tier === 'shards').every((m) => !isUsable(m)), 'a paid model is never usable');
  } finally { await close(); }
});

test('resolveModel: member, then character, then default; unusable or unknown choices are skipped, never used', async () => {
  const { resolveModel, close } = await load();
  try {
    const catalog = [
      model({ id: 'gemini-3.1-flash-lite', name: 'DEFAULT', provider: 'gemini', aliases: ['old-default'] }),
      model({ id: 'a/free', name: 'FREE' }),
      model({ id: 'a/free2', name: 'FREE2' }),
      model({ id: 'a/paid', name: 'PAID', tier: 'shards' }),
      model({ id: 'a/soon', name: 'SOON', status: 'soon' }),
      model({ id: 'a/raw', name: 'RAW', uncensored: true }),
    ];
    const pick = (choice, adultVerified = false) => resolveModel(choice, { adultVerified }, catalog).name;
    assert.equal(pick({}), 'DEFAULT');
    assert.equal(pick({ member: 'old-default' }), 'DEFAULT', 'an alias resolves to its model');
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

test('geminiGenerate: moves to the next model only when Google says the model is gone', async () => {
  const { geminiGenerate, geminiText, RequestError, close } = await load();
  const realFetch = globalThis.fetch;
  try {
    const seen = [];
    let script = [];
    globalThis.fetch = async (url) => { seen.push(String(url).match(/models\/([^:]+):/)[1]); const next = script.shift(); return new Response(next.body, { status: next.status }); };
    const ok = JSON.stringify({ candidates: [{ content: { parts: [{ text: 'A' }, { text: 'B' }] } }] });

    script = [{ status: 404, body: 'x' }, { status: 200, body: ok }];
    const first = await geminiGenerate('KEY', ['new', 'old'], {});
    assert.equal(first.model, 'old'); assert.equal(geminiText(first.data), 'AB'); assert.deepEqual(seen, ['new', 'old']);

    for (const [status, body] of [[500, 'boom'], [429, 'quota'], [400, 'Invalid JSON payload'], [401, 'bad key']]) {
      seen.length = 0; script = [{ status, body }, { status: 200, body: ok }];
      await assert.rejects(geminiGenerate('KEY', ['new', 'old'], {}), (error) => error instanceof RequestError && error.status === 502 && !/KEY|boom|quota|Invalid|bad key/.test(error.message), String(status));
      assert.deepEqual(seen, ['new'], `${status} must not try the next model`);
    }
    for (const body of ['This model is no longer available', 'model is deprecated', 'models/x is not supported for generateContent']) {
      seen.length = 0; script = [{ status: 400, body }, { status: 200, body: ok }];
      assert.equal((await geminiGenerate('KEY', ['new', 'old'], {})).model, 'old', body);
    }
    seen.length = 0; script = [{ status: 404, body: 'gone' }, { status: 404, body: 'gone too' }];
    await assert.rejects(geminiGenerate('KEY', ['new', 'old'], {}), (error) => error.status === 502 && !/gone/.test(error.message));
    assert.equal(geminiText(null), ''); assert.equal(geminiText({ candidates: [] }), '');
  } finally {
    globalThis.fetch = realFetch;
    await close();
  }
});

test('a paid model is usable only with a valid price, and costs are whole positive SHARDS', async () => {
  const { isUsable, replyCost, close } = await load();
  try {
    const paid = (over) => model({ tier: 'shards', ...over });
    assert.equal(isUsable(paid({ shardsCost: 5 })), true);
    assert.equal(replyCost(paid({ shardsCost: 5 })), 5);
    for (const bad of [undefined, 0, -3, 1.5, NaN, 10_001, '5']) assert.equal(isUsable(paid({ shardsCost: bad })), false, `price ${String(bad)}`);
    assert.equal(isUsable(paid({ shardsCost: 5, status: 'soon' })), false, 'not available yet');
    assert.equal(replyCost(model({ tier: 'free', shardsCost: 9 })), 0, 'a free model never costs anything');
  } finally { await close(); }
});

test('resolveModel: only the player can pick a paid model; a creator recommendation never spends their SHARDS', async () => {
  const { resolveModel, close } = await load();
  try {
    const catalog = [
      model({ id: 'gemini-3.1-flash-lite', name: 'DEFAULT', provider: 'gemini' }),
      model({ id: 'a/paid', name: 'PAID', tier: 'shards', shardsCost: 4 }),
      model({ id: 'a/free', name: 'FREE' }),
    ];
    const pick = (choice) => resolveModel(choice, { adultVerified: false }, catalog).name;
    assert.equal(pick({ member: 'a/paid' }), 'PAID', 'the player chose it');
    assert.equal(pick({ character: 'a/paid' }), 'DEFAULT', 'the creator recommended it: not charged');
    assert.equal(pick({ character: 'a/paid', member: 'a/free' }), 'FREE');
    assert.equal(pick({ character: 'a/free' }), 'FREE', 'a free recommendation still works');
  } finally { await close(); }
});

test('chargeForReply: free models take nothing; paid ones charge the catalog price; errors are translated', async () => {
  const { chargeForReply, refundUndeliveredReply, RequestError, close } = await load();
  try {
    const calls = [];
    let outcome = { error: null };
    const admin = { rpc: async (name, args) => { calls.push({ name, args }); return outcome; } };
    const reservation = { id: 'req', lease: 'lease' };
    let attempts = 0;
    const attempt = () => { attempts += 1; };

    assert.equal(await chargeForReply(admin, reservation, model({ tier: 'free' }), attempt), 0);
    assert.deepEqual([calls.length, attempts], [0, 0], 'a free model does not even call the database');

    const paid = model({ id: 'a/paid', name: 'AURELIA', tier: 'shards', shardsCost: 7 });
    assert.equal(await chargeForReply(admin, reservation, paid, attempt), 7);
    assert.deepEqual(calls[0], { name: 'charge_chimera_reply', args: { p_request_id: 'req', p_lease: 'lease', p_amount: 7, p_model: 'AURELIA' } });
    assert.equal(attempts, 1);

    outcome = { error: { code: 'CH402', message: 'insufficient_shards' } };
    await assert.rejects(chargeForReply(admin, reservation, paid, attempt), (error) => error instanceof RequestError && error.status === 402 && /7 SHARDS/.test(error.message) && /SUPERNOVA/.test(error.message));
    outcome = { error: { code: 'XX000', message: 'connection reset by SECRET host' } };
    await assert.rejects(chargeForReply(admin, reservation, paid, attempt), (error) => error instanceof RequestError && error.status === 503 && !/SECRET/.test(error.message));
    assert.equal(attempts, 3, 'every charge that was sent is flagged for a refund');

    await refundUndeliveredReply(admin, reservation);
    assert.deepEqual(calls.at(-1), { name: 'refund_chimera_reply', args: { p_request_id: 'req', p_lease: 'lease' } });
    const broken = { rpc: async () => { throw new Error('network down'); } };
    await assert.doesNotReject(refundUndeliveredReply(broken, reservation), 'a refund that cannot run never breaks the response');
  } finally { await close(); }
});

test('testers-only models: invisible and unusable for everyone else, usable by testers; fallbacks never expose them', async () => {
  const { isUsable, usableModels, resolveModel, close } = await load();
  try {
    const catalog = [
      model({ id: 'gemini-3.1-flash-lite', name: 'DEFAULT', provider: 'gemini' }),
      model({ id: 'a/beta', name: 'BETA', tier: 'shards', shardsCost: 6, testersOnly: true }),
      model({ id: 'a/free-beta', name: 'FREEBETA', testersOnly: true }),
    ];
    const beta = catalog[1];
    assert.equal(isUsable(beta), false);
    assert.equal(isUsable(beta, true), true);
    assert.deepEqual(usableModels(catalog).map((m) => m.name), ['DEFAULT']);
    assert.deepEqual(usableModels(catalog, true).map((m) => m.name), ['DEFAULT', 'BETA', 'FREEBETA']);

    const pick = (choice, tester) => resolveModel(choice, { adultVerified: false, tester }, catalog).name;
    assert.equal(pick({ member: 'a/beta' }, true), 'BETA');
    assert.equal(pick({ member: 'a/beta' }, false), 'DEFAULT', 'a saved choice does not outlive tester access');
    assert.equal(pick({ member: 'a/beta' }, undefined), 'DEFAULT');
    assert.equal(pick({ character: 'a/free-beta' }, false), 'DEFAULT', 'a creator cannot expose a model that is still being tried');
  } finally { await close(); }
});

test('the real catalog: every paid model on offer is priced, testers-only for now, and kept out of reach of other members', async () => {
  const { CHAT_MODELS, usableModels, resolveModel, replyCost, close } = await load();
  try {
    const paid = CHAT_MODELS.filter((m) => m.tier === 'shards' && m.status === 'available');
    assert.deepEqual(paid.map((m) => m.name), ['PULSAR', 'QUANTUM', 'HELIOS', 'ECLIPSE']);
    assert.ok(paid.every((m) => m.testersOnly && replyCost(m) > 0), 'priced, and not public yet');
    assert.deepEqual(usableModels().map((m) => m.name), ['SUPERNOVA'], 'other members still only get SUPERNOVA');
    for (const m of paid) {
      assert.equal(resolveModel({ member: m.id }, { adultVerified: true }).name, 'SUPERNOVA', `${m.name} is refused for a non-tester`);
      assert.equal(resolveModel({ member: m.id }, { adultVerified: false, tester: true }).name, m.name);
    }
    assert.ok(paid.every((m) => m.provider === 'openrouter' && m.reasoningEffort), 'each paid model asks for minimal reasoning');
  } finally { await close(); }
});

test('OpenRouter requests carry the reasoning effort of the model, and nothing for models that do not set one', async () => {
  const { generateReply, close } = await load();
  const realFetch = globalThis.fetch;
  try {
    const bodies = [];
    globalThis.fetch = async (_url, init) => { bodies.push(JSON.parse(init.body)); return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }); };
    const turns = [{ role: 'user', text: 'hi' }];
    const keys = { openrouter: 'K' };
    await generateReply({ model: model({ id: 'v/m', reasoningEffort: 'low' }), systemPrompt: 'S', turns, maxOutputTokens: 100, keys });
    await generateReply({ model: model({ id: 'v/n', reasoningEffort: 'none', noSampling: true }), systemPrompt: 'S', turns, maxOutputTokens: 100, keys });
    await generateReply({ model: model({ id: 'v/o' }), systemPrompt: 'S', turns, maxOutputTokens: 100, keys });
    assert.deepEqual(bodies[0].reasoning, { effort: 'low' });
    assert.deepEqual(bodies[1].reasoning, { effort: 'none' });
    assert.equal('temperature' in bodies[1], false);
    assert.equal('reasoning' in bodies[2], false);
  } finally { globalThis.fetch = realFetch; await close(); }
});
