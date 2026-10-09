import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

async function load() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  const characters = await server.ssrLoadModule('/src/lib/characters.ts');
  const avatar = await server.ssrLoadModule('/src/lib/characterAvatar.ts');
  return { ...characters, ...avatar, close: () => server.close() };
}

const filled = (EMPTY_FORM, over = {}) => ({ ...EMPTY_FORM, name: 'Isolde', personality: 'Bold.', greeting: '*Hi.*', ...over });

test('estimateTokens is a rough count and definitionSize leaves the bio out (it is only shown on cards)', async () => {
  const { estimateTokens, definitionSize, EMPTY_FORM, close } = await load();
  try {
    assert.equal(estimateTokens(''), 0);
    assert.equal(estimateTokens('abcd'), 1);
    assert.equal(estimateTokens('abcde'), 2);
    assert.equal(estimateTokens('   '), 0);
    const form = filled(EMPTY_FORM, { about: 'x'.repeat(4000), tagline: 'aa', scenario: 'bbb', examples: 'cccc', style: 'd', lore: 'ee', avoid: 'f', notes: 'g' });
    assert.equal(definitionSize(form), 5 /* personality */ + 5 * 2 /* the opening message is sent twice */ + 2 + 3 + 4 + 1 + 2 + 1 + 1, 'the bio is not counted');
  } finally { await close(); }
});

test('long writing is welcome: no limit is hit by ordinary or very long definitions, and only the real ceiling stops one', async () => {
  const { validateForm, EMPTY_FORM, MAX_DEFINITION_CHARACTERS, close } = await load();
  try {
    assert.equal(validateForm(filled(EMPTY_FORM, { personality: 'p'.repeat(20_000), scenario: 's'.repeat(10_000), examples: 'e'.repeat(15_000) })), null, 'about 11,000 tokens is fine');
    assert.equal(validateForm(filled(EMPTY_FORM, { personality: 'p'.repeat(MAX_DEFINITION_CHARACTERS - 10) })), null, 'right up to the ceiling (the 5-character greeting counts twice)');
    const over = validateForm(filled(EMPTY_FORM, { personality: 'p'.repeat(MAX_DEFINITION_CHARACTERS + 1) }));
    assert.match(over ?? '', /too long for chats to work/);
    assert.match(over ?? '', /about [\d,]+ tokens/, 'it says by how much, in tokens');
    assert.ok(!(over ?? '').includes(String(MAX_DEFINITION_CHARACTERS)), 'the ceiling itself is never printed');
    // Spread over several fields it is the same: it is the total that counts.
    assert.ok(validateForm(filled(EMPTY_FORM, { personality: 'p'.repeat(30_000), lore: 'l'.repeat(30_000) })), 'two long fields together pass the ceiling');
  } finally { await close(); }
});

test('required fields, and the short fields that cards show', async () => {
  const { validateForm, missingForCreate, EMPTY_FORM, close } = await load();
  try {
    assert.deepEqual(missingForCreate(EMPTY_FORM), ['a name', 'a personality', 'an opening message']);
    assert.deepEqual(missingForCreate(filled(EMPTY_FORM)), []);
    assert.deepEqual(missingForCreate(filled(EMPTY_FORM, { name: '  ' })), ['a name']);
    assert.match(validateForm(EMPTY_FORM) ?? '', /name/);
    assert.match(validateForm(filled(EMPTY_FORM, { about: 'b'.repeat(5001) })) ?? '', /Bio is too long to be shown/);
    assert.equal(validateForm(filled(EMPTY_FORM, { about: 'b'.repeat(5000) })), null);
    assert.match(validateForm(filled(EMPTY_FORM, { chatName: 'c'.repeat(101) })) ?? '', /Chat name/);
    assert.match(validateForm(filled(EMPTY_FORM, { avoid: 'a'.repeat(5001) })) ?? '', /Phrases to avoid/);
  } finally { await close(); }
});

test('what is saved: the chat name defaults to the name, every written field reaches the database, and unseen fields are kept on edit', async () => {
  const { buildSaveArgs, EMPTY_FORM, close } = await load();
  try {
    const form = filled(EMPTY_FORM, { name: ' Isolde Vance ', chatName: ' Isolde ', style: ' dry ', lore: ' the map ', avoid: ' sigh ', notes: ' be bold ', avatarUrl: 'https://x.test/a.png', tagline: ' t ', about: ' b ', examples: ' e ', scenario: ' s ' });
    const created = buildSaveArgs(form, null);
    assert.equal(created.p_name, 'Isolde Vance');
    assert.equal(created.p_chat_name, 'Isolde');
    assert.deepEqual(
      [created.p_conversation_style, created.p_knowledge, created.p_banned_words, created.p_creator_notes, created.p_avatar_url, created.p_short_description, created.p_long_description, created.p_example_dialogues, created.p_scenario],
      ['dry', 'the map', 'sigh', 'be bold', 'https://x.test/a.png', 't', 'b', 'e', 's'],
    );
    assert.equal(created.p_content_rating, 'SFW', 'a character is General unless Mature is chosen');
    assert.equal(buildSaveArgs(filled(EMPTY_FORM, { chatName: '  ' }), null).p_chat_name, 'Isolde', 'no nickname means the name');
    const edited = buildSaveArgs(form, { id: 'c1', alternate_greetings: ['Hello'], rp_definition: 'RP', content_rating: 'SFW', voice_id: 'v', suggested_persona_name: 'Sam' });
    assert.deepEqual([edited.p_alternate_greetings, edited.p_rp_definition, edited.p_voice_id, edited.p_suggested_persona_name, edited.p_character_id], [['Hello'], 'RP', 'v', 'Sam', 'c1'], 'fields the form does not show are carried through');
  } finally { await close(); }
});

test('opening a saved character: the name is the profile name, and the chat name only when it is different', async () => {
  const { formFromRecord, close } = await load();
  try {
    const row = { id: 'c1', chat_name: 'Isolde', conversation_style: 'dry', knowledge: 'map', banned_words: 'sigh', creator_notes: 'bold', avatar_url: 'https://x.test/a.png', tags: ['a', 'b'] };
    const card = formFromRecord(row, 'Isolde Vance');
    assert.deepEqual([card.name, card.chatName, card.style, card.lore, card.avoid, card.notes, card.avatarUrl, card.tags], ['Isolde Vance', 'Isolde', 'dry', 'map', 'sigh', 'bold', 'https://x.test/a.png', 'a, b']);
    const older = formFromRecord({ id: 'c2', chat_name: 'Mara' });
    assert.deepEqual([older.name, older.chatName], ['Mara', ''], 'a character saved before chat names existed has no nickname');
    assert.equal(formFromRecord({ id: 'c3', chat_name: 'Same' }, 'Same').chatName, '');
  } finally { await close(); }
});

test('tags: up to ten, no duplicates, and a tag cannot be longer than the card can show', async () => {
  const { parseTags, LIMITS, close } = await load();
  try {
    assert.equal(LIMITS.tags, 10);
    assert.equal(parseTags(Array.from({ length: 14 }, (_, i) => `t${i}`).join(', ')).length, 10);
    assert.deepEqual(parseTags('Cozy, cozy, COZY,  Slow   burn '), ['Cozy', 'Slow burn']);
    assert.ok(parseTags('x'.repeat(60))[0].length <= LIMITS.tag);
  } finally { await close(); }
});

test('pictures: only JPG, PNG and WebP up to 5 MB, stored in the member\'s own folder', async () => {
  const { checkAvatarFile, avatarPath, AVATAR_MAX_BYTES, close } = await load();
  try {
    assert.equal(checkAvatarFile({ type: 'image/png', size: 1000 }), null);
    assert.equal(checkAvatarFile({ type: 'image/jpeg', size: AVATAR_MAX_BYTES }), null);
    assert.match(checkAvatarFile({ type: 'image/jpeg', size: AVATAR_MAX_BYTES + 1 }) ?? '', /5 MB/);
    for (const type of ['image/svg+xml', 'image/gif', 'application/pdf', 'text/html', '']) assert.match(checkAvatarFile({ type, size: 10 }) ?? '', /JPG, PNG or WebP/, type);
    assert.match(checkAvatarFile({ type: 'image/png', size: 0 }) ?? '', /empty/);
    assert.equal(avatarPath('user-1', 'image/webp', 'abc'), 'user-1/character-avatars/abc.webp');
    assert.ok(avatarPath('user-1', 'image/png', 'abc').startsWith('user-1/'), 'the first folder is the member id, as the storage rule requires');
  } finally { await close(); }
});

test('the size matches what the chat really sends: the opening message twice, and the fields kept from older versions', async () => {
  const { definitionSize, validateForm, EMPTY_FORM, MAX_DEFINITION_CHARACTERS, close } = await load();
  try {
    // The reviewed case: a very long opening with a minimal personality used to pass and then could never start a scene.
    const longOpening = filled(EMPTY_FORM, { greeting: 'g'.repeat(MAX_DEFINITION_CHARACTERS) });
    assert.equal(definitionSize(longOpening), MAX_DEFINITION_CHARACTERS * 2 + 5);
    assert.match(validateForm(longOpening) ?? '', /too long for chats/);
    assert.equal(validateForm(filled(EMPTY_FORM, { greeting: 'g'.repeat(MAX_DEFINITION_CHARACTERS / 2 - 5) })), null, 'half the ceiling, counted twice, fits');

    const kept = { id: 'c1', system_definition: 'a'.repeat(100), system_character_definition: 'b'.repeat(200), rp_definition: 'c'.repeat(300), example_conversations: 'd'.repeat(400), voice_id: 'x'.repeat(5000) };
    const plain = filled(EMPTY_FORM);
    assert.equal(definitionSize(plain, kept) - definitionSize(plain), 1000, 'the four prompt fields kept on edit count, other fields do not');
    const nearly = filled(EMPTY_FORM, { personality: 'p'.repeat(MAX_DEFINITION_CHARACTERS - 10 - 500) });
    assert.equal(validateForm(nearly, null), null);
    assert.match(validateForm(nearly, kept) ?? '', /too long for chats/, 'the same text no longer fits once the kept fields are counted');
  } finally { await close(); }
});

test('rating: General unless Mature is chosen; a stored NSFW stays NSFW; General always wins; opening a saved card shows its rating', async () => {
  const { buildSaveArgs, formFromRecord, EMPTY_FORM, close } = await load();
  try {
    const base = filled(EMPTY_FORM, { name: 'Isolde' });
    assert.equal(buildSaveArgs(base, null).p_content_rating, 'SFW');
    assert.equal(buildSaveArgs({ ...base, mature: true }, null).p_content_rating, 'Mature');
    assert.equal(buildSaveArgs({ ...base, mature: true }, { id: 'c1', content_rating: 'Mature' }).p_content_rating, 'Mature');
    assert.equal(buildSaveArgs({ ...base, mature: true }, { id: 'c1', content_rating: 'NSFW' }).p_content_rating, 'NSFW', 'a stored NSFW is not lowered to Mature');
    assert.equal(buildSaveArgs({ ...base, mature: false }, { id: 'c1', content_rating: 'NSFW' }).p_content_rating, 'SFW', 'moving a character to General is always possible');
    assert.equal(buildSaveArgs({ ...base, mature: true }, { id: 'c1', content_rating: 'SFW' }).p_content_rating, 'Mature');

    assert.equal(formFromRecord({ id: 'a', content_rating: 'Mature' }).mature, true);
    assert.equal(formFromRecord({ id: 'a', content_rating: 'NSFW' }).mature, true);
    assert.equal(formFromRecord({ id: 'a', content_rating: 'SFW' }).mature, false);
    assert.equal(formFromRecord({ id: 'a' }).mature, false, 'no rating means General');
    assert.equal(EMPTY_FORM.mature, false, 'a new or imported card starts General');
  } finally { await close(); }
});
