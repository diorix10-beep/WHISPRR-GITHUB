// CHIMERA Discord server: what we want, and the plan to get there from what already exists.
// Pure logic, no Discord calls: the scripts do the API work, the tests cover this file.

/** The WHISPRR HQ server. The CHIMERA scripts must never run against it. */
export const WHISPRR_HQ_GUILD_ID = '1148719266157834310';

/** "👋│welcome", "💬・general", "🛠️ Moderator" and "moderator" all compare equal. */
export function normalize(name) {
  const letters = String(name ?? '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  return letters || String(name ?? '').trim().toLowerCase();
}

// Roles are created with no administrator or role-management rights, ever: Founder and Administrator stay manual.
export const ROLES = [
  { name: '🛡️ Moderator', color: '#22C55E', hoist: true, mentionable: true, permissions: ['KickMembers', 'BanMembers', 'ModerateMembers', 'ManageMessages', 'ManageNicknames'] },
  { name: '🎨 Creator', color: '#EC4899', hoist: true, mentionable: true, permissions: [] },
  { name: '🧪 Beta Tester', color: '#F59E0B', hoist: true, mentionable: true, permissions: [] },
  { name: '🌟 Early Supporter', color: '#FACC15', hoist: false, mentionable: false, permissions: [] },
  { name: '📢 Announcement Pings', color: '#10B981', hoist: false, mentionable: false, permissions: [] },
  { name: '📋 Changelog Pings', color: '#059669', hoist: false, mentionable: false, permissions: [] },
];

export const STAFF_ROLE = '🛡️ Moderator';
export const BETA_ROLE = '🧪 Beta Tester';

// visibility: 'public' | 'staff' | 'beta'. readonly: only staff can write. type: 'text' | 'announcement' | 'forum'.
// There is deliberately no age-restricted (NSFW) channel: the site's Mature content is not open yet.
export const CATEGORIES = [
  {
    name: '📢 INFORMATION', visibility: 'public',
    channels: [
      { name: '👋│welcome', type: 'text', readonly: true, topic: 'Start here. What CHIMERA is and how this server works.' },
      { name: '📜│rules', type: 'text', readonly: true, topic: 'Server rules. 18+ only. Please read them before you chat.' },
      { name: '❓│faq', type: 'text', readonly: true, topic: 'Frequently asked questions about CHIMERA.' },
      { name: '🔗│links', type: 'text', readonly: true, topic: 'Official CHIMERA links. Anything not listed here is not official.' },
    ],
  },
  {
    name: '📣 CHIMERA NEWS', visibility: 'public',
    channels: [
      { name: '📢│announcements', type: 'announcement', readonly: true, topic: 'Official CHIMERA announcements.' },
      { name: '📋│changelog', type: 'text', readonly: true, topic: 'What changed in CHIMERA, in plain words.' },
      { name: '🗺️│roadmap', type: 'text', readonly: true, topic: 'Where CHIMERA is going. Plans can change.' },
    ],
  },
  {
    name: '💬 COMMUNITY', visibility: 'public',
    channels: [
      { name: '💬│general', type: 'text', topic: 'Talk about anything CHIMERA. Keep it friendly.' },
      { name: '👤│introductions', type: 'text', topic: 'Say hello and tell us what you like to write or play.' },
      { name: '💡│ideas', type: 'text', topic: 'Ideas for CHIMERA. One idea per message helps us read them.' },
      { name: '🖼️│media-share', type: 'text', topic: 'Share art and screenshots. Nothing explicit.' },
      { name: '☕│off-topic', type: 'text', topic: 'Everything else.' },
    ],
  },
  {
    name: '🎭 ROLEPLAY & CREATION', visibility: 'public',
    channels: [
      { name: '🧬│character-showcase', type: 'text', topic: 'Show a character you made. Credit anyone whose work you built on.' },
      { name: '🛠️│character-help', type: 'text', topic: 'Questions about building characters, personas and scenes.' },
      { name: '📖│story-showcase', type: 'text', topic: 'Share stories and excerpts from Storytelling. Nothing explicit.' },
      { name: '🧠│model-feedback', type: 'text', topic: 'How do the Model House models write for you? Tell us, with an example if you can.' },
    ],
  },
  {
    name: '🛟 SUPPORT', visibility: 'public',
    channels: [
      { name: '🙋│help', type: 'text', topic: 'Ask for help. Never post passwords or payment details.' },
      { name: '🐞│bug-reports', type: 'forum', topic: 'One bug per post: what you did, what you expected, what happened.' },
      { name: '✨│feature-requests', type: 'forum', topic: 'One request per post.' },
    ],
  },
  {
    name: '🧪 BETA', visibility: 'beta',
    channels: [
      { name: '🧪│beta-feedback', type: 'text', topic: 'For Beta Testers: feedback on features and models still being tried.' },
    ],
  },
  {
    name: '🔒 STAFF', visibility: 'staff',
    channels: [
      { name: '🛡️│staff-general', type: 'text', topic: 'Staff only.' },
      { name: '📒│moderation-log', type: 'text', topic: 'Staff only. Record every warning, timeout and ban with the reason.' },
    ],
  },
];

/**
 * existing: { roles: [{name}], categories: [{id,name}], channels: [{name, parentName|null}] }
 * Returns the steps needed to add what is missing. It never plans to rename, move, edit or delete anything.
 */
export function planChanges(existing, desired = { roles: ROLES, categories: CATEGORIES }) {
  const steps = [];
  const roleNames = new Set(existing.roles.map((r) => normalize(r.name)));
  const categoryNames = new Map(existing.categories.map((c) => [normalize(c.name), c.name]));
  const channelAt = new Map();
  for (const channel of existing.channels) {
    const key = normalize(channel.name);
    if (!channelAt.has(key)) channelAt.set(key, channel.parentName ?? '(no category)');
  }

  for (const role of desired.roles) {
    steps.push(roleNames.has(normalize(role.name)) ? { kind: 'role', name: role.name, action: 'exists' } : { kind: 'role', name: role.name, action: 'create' });
  }
  for (const category of desired.categories) {
    const categoryExists = categoryNames.has(normalize(category.name));
    // A new category is only worth creating if at least one of its channels is missing.
    const missing = category.channels.filter((c) => !channelAt.has(normalize(c.name)));
    if (categoryExists) steps.push({ kind: 'category', name: category.name, action: 'exists' });
    else if (missing.length > 0) steps.push({ kind: 'category', name: category.name, action: 'create' });
    else steps.push({ kind: 'category', name: category.name, action: 'skip' });
    for (const channel of category.channels) {
      const at = channelAt.get(normalize(channel.name));
      if (at !== undefined) steps.push({ kind: 'channel', name: channel.name, action: 'exists', where: at });
      else steps.push({ kind: 'channel', name: channel.name, action: 'create', category: category.name });
    }
  }
  return steps;
}

export function summarize(steps) {
  const count = (kind, action) => steps.filter((s) => s.kind === kind && s.action === action).length;
  return {
    rolesToCreate: count('role', 'create'), categoriesToCreate: count('category', 'create'), channelsToCreate: count('channel', 'create'),
    alreadyThere: steps.filter((s) => s.action === 'exists').length,
  };
}
