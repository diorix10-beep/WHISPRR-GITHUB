import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import { CATEGORIES, ROLES, WHISPRR_HQ_GUILD_ID, normalize, planChanges, summarize } from '../../../discord/chimera/plan.mjs';
import { readConfig, snapshot } from '../../../discord/chimera/lib.mjs';
import { buildAnnouncement, readArgs } from '../../../discord/chimera/announcement.mjs';
import { RULES, WELCOME, FAQ, LINKS } from '../../../discord/chimera/texts.mjs';

const empty = { roles: [], categories: [], channels: [] };
const allChannels = CATEGORIES.flatMap((c) => c.channels);

test('normalize: emoji, separators, case and accents do not matter', () => {
  for (const name of ['👋│welcome', '💬・welcome', 'Welcome', '  WELCOME ', 'wélcome']) assert.equal(normalize(name), 'welcome');
  assert.equal(normalize('🛠️ Moderator'), normalize('moderator'));
  assert.equal(normalize('🔥'), '🔥', 'a name that is only an emoji still compares');
});

test('the wanted structure is consistent: unique names, valid Discord types, nothing risky', () => {
  const unique = (names) => new Set(names.map(normalize)).size === names.length;
  assert.ok(unique(ROLES.map((r) => r.name)) && unique(CATEGORIES.map((c) => c.name)) && unique(allChannels.map((c) => c.name)));
  for (const role of ROLES) {
    for (const flag of role.permissions) assert.ok(PermissionFlagsBits[flag] !== undefined, `${flag} is a real permission`);
    for (const forbidden of ['Administrator', 'ManageRoles', 'ManageGuild', 'ManageChannels', 'ManageWebhooks', 'MentionEveryone']) {
      assert.ok(!role.permissions.includes(forbidden), `${role.name} must not have ${forbidden}`);
    }
    assert.match(role.color, /^#[0-9A-F]{6}$/i);
  }
  assert.ok(allChannels.every((c) => ['text', 'announcement', 'forum'].includes(c.type)));
  assert.ok(allChannels.every((c) => c.name.length <= 100 && (c.topic ?? '').length <= 1024));
  assert.ok(CATEGORIES.every((c) => c.name.length <= 100 && ['public', 'staff', 'beta'].includes(c.visibility)));
  assert.ok(allChannels.every((c) => c.nsfw !== true), 'no age-restricted channel while Mature content is not open on the site');
  assert.ok(CATEGORIES.every((c) => c.visibility === 'public' || c.channels.every((ch) => !ch.readonly)));
  assert.equal(ChannelType.GuildCategory, 4);
  assert.deepEqual([ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum], [0, 5, 15]);
});

test('on an empty server everything is created, with each channel under its category', () => {
  const steps = planChanges(empty);
  assert.deepEqual(summarize(steps), { rolesToCreate: ROLES.length, categoriesToCreate: CATEGORIES.length, channelsToCreate: allChannels.length, alreadyThere: 0 });
  assert.ok(steps.filter((s) => s.kind === 'channel').every((s) => s.category));
});

test('on a living server: existing things are never recreated, renamed or moved, only what is missing is added', () => {
  const existing = {
    roles: [{ name: 'Moderator' }, { name: '👑 Founder' }, { name: '🎨 creator' }],
    categories: [{ id: '1', name: 'COMMUNITY' }, { id: '2', name: 'Games' }],
    channels: [
      { name: '💬・general', parentName: 'COMMUNITY' },
      { name: 'rules', parentName: null },
      { name: 'memes', parentName: 'Games' },
    ],
  };
  const steps = planChanges(existing);
  const byName = (kind, name) => steps.find((s) => s.kind === kind && s.name === name);
  assert.equal(byName('role', '🛡️ Moderator').action, 'exists');
  assert.equal(byName('role', '🎨 Creator').action, 'exists');
  assert.equal(byName('role', '🧪 Beta Tester').action, 'create');
  assert.equal(byName('category', '💬 COMMUNITY').action, 'exists', 'the existing category is reused');
  assert.equal(byName('channel', '💬│general').action, 'exists');
  assert.equal(byName('channel', '💬│general').where, 'COMMUNITY');
  assert.equal(byName('channel', '📜│rules').where, '(no category)', 'a rules channel anywhere counts');
  assert.equal(byName('channel', '👤│introductions').action, 'create');
  assert.ok(steps.every((s) => ['create', 'exists', 'skip'].includes(s.action)), 'the plan has no rename, move or delete');
  assert.ok(!steps.some((s) => s.kind === 'channel' && s.name.includes('memes')), 'unrelated channels are not part of the plan');
});

test('a category is not created when all of its channels already exist elsewhere', () => {
  const existing = { roles: [], categories: [], channels: CATEGORIES.find((c) => c.name.includes('SUPPORT')).channels.map((c) => ({ name: c.name, parentName: null })) };
  const support = planChanges(existing).find((s) => s.kind === 'category' && s.name.includes('SUPPORT'));
  assert.equal(support.action, 'skip');
});

test('readConfig: needs a token and a numeric server id, and refuses the WHISPRR HQ server', () => {
  const ok = { DISCORD_BOT_TOKEN: 't', CHIMERA_DISCORD_GUILD_ID: '123456789012345678' };
  assert.deepEqual(readConfig(ok), { token: 't', guildId: '123456789012345678' });
  assert.throws(() => readConfig({ ...ok, DISCORD_BOT_TOKEN: '' }), /DISCORD_BOT_TOKEN/);
  assert.throws(() => readConfig({ ...ok, CHIMERA_DISCORD_GUILD_ID: undefined }), /CHIMERA_DISCORD_GUILD_ID/);
  assert.throws(() => readConfig({ ...ok, CHIMERA_DISCORD_GUILD_ID: 'abc' }), /CHIMERA_DISCORD_GUILD_ID/);
  assert.throws(() => readConfig({ ...ok, CHIMERA_DISCORD_GUILD_ID: WHISPRR_HQ_GUILD_ID }), /WHISPRR HQ/);
  assert.throws(() => readConfig({ DISCORD_GUILD_ID: '123456789012345678', DISCORD_BOT_TOKEN: 't' }), /CHIMERA_DISCORD_GUILD_ID/, 'the old WHISPRR variable is not used');
});

test('snapshot reads names and structure only', async () => {
  const guild = {
    id: 'g',
    roles: { fetch: async () => {}, cache: new Map([['g', { id: 'g', name: '@everyone' }], ['r', { id: 'r', name: 'Mod', managed: false }]]) },
    channels: { fetch: async () => new Map([['c1', { id: 'c1', name: 'COMMUNITY', type: 4 }], ['c2', { id: 'c2', name: 'general', type: 0, parentId: 'c1' }], ['c3', { id: 'c3', name: 'loose', type: 0, parentId: null }]]) },
  };
  assert.deepEqual(await snapshot(guild), {
    roles: [{ name: 'Mod', managed: false }],
    categories: [{ id: 'c1', name: 'COMMUNITY' }],
    channels: [{ name: 'general', parentName: 'COMMUNITY' }, { name: 'loose', parentName: null }],
  });
});

test('the texts fit Discord limits and keep the safety promises', () => {
  for (const text of [RULES, WELCOME, FAQ, LINKS]) {
    assert.ok(text.title.length <= 256 && text.description.length <= 4096);
  }
  assert.match(RULES.description, /18\+/);
  assert.match(RULES.description, /minors/i);
  assert.match(RULES.description, /age regression/i);
  assert.match(RULES.description, /password/i);
  assert.match(WELCOME.description, /<#RULES>/);
  assert.match(FAQ.description, /not yet/i, 'the FAQ does not claim Mature content exists');
  assert.ok(!/free chat stays free|guarantee|will launch|by (january|february|march|spring|summer)/i.test(FAQ.description + WELCOME.description), 'no promise or date');
});

test('announcements: webhook URL checked, no pings by default, only the one named role can be pinged, never everyone', () => {
  const webhookUrl = 'https://discord.com/api/webhooks/123456789012345678/abc_DEF-123';
  const base = { title: 'Hello', text: 'Body', webhookUrl };
  const plain = buildAnnouncement(base);
  assert.deepEqual(plain.allowed_mentions, { parse: [] });
  assert.equal(plain.content, undefined);
  const pinged = buildAnnouncement({ ...base, pingRole: '123456789012345678' });
  assert.equal(pinged.content, '<@&123456789012345678>');
  assert.deepEqual(pinged.allowed_mentions, { roles: ['123456789012345678'] });
  const sneaky = buildAnnouncement({ ...base, text: '@everyone @here <@&999999999999999999>' });
  assert.deepEqual(sneaky.allowed_mentions, { parse: [] });
  for (const bad of ['', 'http://discord.com/api/webhooks/1/a', 'https://evil.example/api/webhooks/123456789012345678/a', 'https://discord.com/api/webhooks/123456789012345678/a?x=1', undefined]) {
    assert.throws(() => buildAnnouncement({ ...base, webhookUrl: bad }), /webhook/i, String(bad));
  }
  assert.throws(() => buildAnnouncement({ ...base, title: '' }), /title/);
  assert.throws(() => buildAnnouncement({ ...base, text: 'x'.repeat(4001) }), /4000/);
  assert.throws(() => buildAnnouncement({ ...base, pingRole: 'everyone' }), /role id/);
  assert.deepEqual(readArgs(['--title', 'A b', '--send', '--ping-role', '123']), { title: 'A b', send: true, 'ping-role': '123' });
});
