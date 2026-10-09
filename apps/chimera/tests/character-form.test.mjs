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
    // The Bio has no limit: it is only shown, never read by the AI, so even a huge one saves.
    for (const length of [5_001, 100_000, 1_000_000]) assert.equal(validateForm(filled(EMPTY_FORM, { about: 'b'.repeat(length) })), null, `a ${length}-character Bio is accepted`);
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
    assert.deepEqual([edited.p_rp_definition, edited.p_voice_id, edited.p_suggested_persona_name, edited.p_character_id], ['RP', 'v', 'Sam', 'c1'], 'fields the form does not show are carried through');
    assert.deepEqual(edited.p_alternate_greetings, [], 'the openings are the form\'s: removing them in the form removes them');
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
    assert.equal(definitionSize(plain, kept) - definitionSize(plain), 800, 'the three prompt fields kept on edit count (the full definition is in the form now, so it is not counted twice), other fields do not');
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

test('full definition: written in the form, saved as the detailed character definition, counted once, and read back on edit', async () => {
  const { buildSaveArgs, formFromRecord, definitionSize, validateForm, EMPTY_FORM, MAX_DEFINITION_CHARACTERS, close } = await load();
  try {
    assert.equal(EMPTY_FORM.definition, '');
    const base = filled(EMPTY_FORM, { name: 'Isolde' });
    assert.equal(buildSaveArgs(base, null).p_system_character_definition, '', 'empty by default');
    assert.equal(buildSaveArgs({ ...base, definition: '  MAISON VERITY codex  ' }, null).p_system_character_definition, 'MAISON VERITY codex');
    // An older character that already has one: the form shows it, and saving without touching it keeps it.
    const stored = { id: 'c1', system_character_definition: 'Old detailed definition' };
    const form = formFromRecord(stored, 'Isolde');
    assert.equal(form.definition, 'Old detailed definition');
    assert.equal(buildSaveArgs({ ...form, personality: 'p', greeting: 'g' }, stored).p_system_character_definition, 'Old detailed definition');
    // Counted once, whether it comes from the form or from the stored row.
    assert.equal(definitionSize(filled(EMPTY_FORM, { definition: 'x'.repeat(100) }), stored) - definitionSize(filled(EMPTY_FORM), null), 100);
    assert.equal(definitionSize({ ...form }, stored), definitionSize({ ...form }, null));
    // It is part of what the AI reads, so it counts toward the ceiling.
    assert.match(validateForm(filled(EMPTY_FORM, { definition: 'd'.repeat(MAX_DEFINITION_CHARACTERS + 1) })) ?? '', /too long for chats/);
    assert.equal(validateForm(filled(EMPTY_FORM, { definition: 'd'.repeat(30_000) })), null);
  } finally { await close(); }
});

test('other opening messages: saved from the form, loaded back, never repeating the main one, bounded; the longest counts for the size', async () => {
  const { buildSaveArgs, formFromRecord, validateForm, definitionSize, EMPTY_FORM, LIMITS, close } = await load();
  try {
    const form = filled(EMPTY_FORM, { greeting: '  *Hi.*  ', alternateGreetings: ['  *The rain stops.*', '', '*hi.*', '*Another one.*'] });
    assert.deepEqual(buildSaveArgs(form, null).p_alternate_greetings, ['*The rain stops.*', '*Another one.*'], 'trimmed, no empty, no repeat of the main one');
    assert.equal(buildSaveArgs(filled(EMPTY_FORM), null).p_alternate_greetings.length, 0);
    const many = filled(EMPTY_FORM, { alternateGreetings: Array.from({ length: 14 }, (_, i) => `Opening ${i}`) });
    assert.match(validateForm(many) ?? '', /at most 10 other opening messages/);
    assert.equal(buildSaveArgs(filled(EMPTY_FORM, { alternateGreetings: Array.from({ length: 10 }, (_, i) => `Opening ${i}`) }), null).p_alternate_greetings.length, 10);
    assert.match(validateForm(filled(EMPTY_FORM, { alternateGreetings: ['x'.repeat(LIMITS.greeting + 1)] })) ?? '', /opening message is too long/);

    const back = formFromRecord({ id: 'c1', chat_name: 'Isolde', greeting: '*Hi.*', alternate_greetings: ['A', 3, '  ', 'B'], personality: 'Bold.' });
    assert.deepEqual(back.alternateGreetings, ['A', 'B']);
    assert.deepEqual(formFromRecord({ id: 'c1', chat_name: 'Isolde', greeting: 'x', alternate_greetings: null }).alternateGreetings, []);

    // A scene uses one opening, so only the longest counts (twice), not the sum.
    const one = definitionSize(filled(EMPTY_FORM, { greeting: 'a'.repeat(100) }));
    assert.equal(definitionSize(filled(EMPTY_FORM, { greeting: 'a'.repeat(100), alternateGreetings: ['b'.repeat(50), 'c'.repeat(60)] })), one);
    assert.equal(definitionSize(filled(EMPTY_FORM, { greeting: 'a'.repeat(100), alternateGreetings: ['b'.repeat(300)] })), one + 2 * 200);
  } finally { await close(); }
});
