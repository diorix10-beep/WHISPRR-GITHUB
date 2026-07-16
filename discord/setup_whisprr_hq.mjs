// ═══════════════════════════════════════════════════════════════════════════════
// WHISPRR HQ — Official Discord Server Automated Setup
// ═══════════════════════════════════════════════════════════════════════════════
//
// This script creates the entire WHISPRR HQ Discord server from scratch:
//   • 15 roles with branded colors and proper hierarchy
//   • 11 categories with 50+ channels
//   • Full permission system (staff-only, founder-only, public)
//   • Country Spaces infrastructure
//   • Onboarding / welcome experience
//   • Bot-ready automation channels
//
// USAGE:
//   1. Create a Discord Application at https://discord.com/developers/applications
//   2. Create a Bot and copy the token
//   3. Enable all Privileged Gateway Intents (Presence, Server Members, Message Content)
//   4. Invite the bot to your server with Administrator permissions:
//      https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
//   5. Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID below
//   6. Run: node discord/setup_whisprr_hq.mjs
//
// ═══════════════════════════════════════════════════════════════════════════════

import { Client, GatewayIntentBits, PermissionsBitField, ChannelType, EmbedBuilder } from 'discord.js';
import { dispatchToDiscord } from './webhook_dispatcher.mjs';
import { setupRoleSelectionMessage } from './role_manager.mjs';

// Helper to send message via webhook with proper identity override, falling back to standard channel.send if not configured
async function sendEmbed(identityKey, channel, embedBuilder) {
  const res = await dispatchToDiscord(identityKey, { embeds: [embedBuilder] });
  if (!res.success) {
    await channel.send({ embeds: [embedBuilder] });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — Set these before running
// ─────────────────────────────────────────────────────────────────────────────
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const DISCORD_GUILD_ID  = process.env.DISCORD_GUILD_ID  || 'YOUR_GUILD_ID_HERE';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS — Ordered from HIGHEST to LOWEST
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  { name: '👑 Founder',            color: '#FFD700', hoist: true,  mentionable: false, permissions: [PermissionsBitField.Flags.Administrator] },
  { name: '🛡️ Administrator',      color: '#FF4D6D', hoist: true,  mentionable: false, permissions: [PermissionsBitField.Flags.Administrator] },
  { name: '⚙️ Developer',          color: '#3B82F6', hoist: true,  mentionable: true,  permissions: [] },
  { name: '🎨 Designer',           color: '#A855F7', hoist: true,  mentionable: true,  permissions: [] },
  { name: '🤖 AI Team',            color: '#8B5CF6', hoist: true,  mentionable: true,  permissions: [] },
  { name: '🛠️ Moderator',          color: '#22C55E', hoist: true,  mentionable: true,  permissions: [
    PermissionsBitField.Flags.KickMembers,
    PermissionsBitField.Flags.BanMembers,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.MuteMembers,
    PermissionsBitField.Flags.DeafenMembers,
    PermissionsBitField.Flags.MoveMembers,
    PermissionsBitField.Flags.ManageNicknames,
  ]},
  { name: '💬 Community Manager',  color: '#06B6D4', hoist: true,  mentionable: true,  permissions: [
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageNicknames,
    PermissionsBitField.Flags.MuteMembers,
  ]},
  { name: '🎉 Event Manager',      color: '#FB7185', hoist: true,  mentionable: true,  permissions: [
    PermissionsBitField.Flags.ManageEvents,
    PermissionsBitField.Flags.ManageMessages,
  ]},
  { name: '🤝 Partner',            color: '#F97316', hoist: true,  mentionable: true,  permissions: [] },
  { name: '🎨 Creator',            color: '#EC4899', hoist: true,  mentionable: true,  permissions: [] },
  { name: '💎 Premium',            color: '#14B8A6', hoist: true,  mentionable: false, permissions: [] },
  { name: '🧪 Beta Tester',        color: '#F59E0B', hoist: true,  mentionable: true,  permissions: [] },
  { name: '🌟 Early Supporter',    color: '#FACC15', hoist: true,  mentionable: false, permissions: [] },
  { name: '✅ Verified',            color: '#60A5FA', hoist: false, mentionable: false, permissions: [] },
  { name: '👤 Member',             color: '#9CA3AF', hoist: false, mentionable: false, permissions: [] },
  { name: '📢 Announcement Pings', color: '#10B981', hoist: false, mentionable: false, permissions: [] },
  { name: '📋 Changelog Pings',    color: '#059669', hoist: false, mentionable: false, permissions: [] },
];

// Staff roles that can access private channels
const STAFF_ROLE_NAMES = [
  '👑 Founder', '🛡️ Administrator', '⚙️ Developer', '🎨 Designer',
  '🤖 AI Team', '🛠️ Moderator', '💬 Community Manager', '🎉 Event Manager',
];

const FOUNDER_ROLE_NAME = '👑 Founder';

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: '📢 INFORMATION',
    visibility: 'public',
    channels: [
      { name: '👋│welcome',          type: 'text',   topic: 'Welcome to WHISPRR HQ! Start your journey here.',                     readonly: true },
      { name: '📜│rules',            type: 'text',   topic: 'Community guidelines and server rules.',                               readonly: true },
      { name: '🎯│get-roles',        type: 'text',   topic: 'Select your roles and country spaces.',                                readonly: true },
      { name: '❓│faq',              type: 'text',   topic: 'Frequently asked questions about WHISPRR.',                            readonly: true },
      { name: '🔗│links',            type: 'text',   topic: 'Official WHISPRR links, website, and resources.',                      readonly: true },
    ],
  },
  {
    name: '📣 WHISPRR NEWS',
    visibility: 'public',
    channels: [
      { name: '📢│announcements',    type: 'announcement', topic: 'Official WHISPRR announcements and updates.',                    readonly: true },
      { name: '📋│changelog',        type: 'text',   topic: 'Every feature release, bug fix, and improvement.',                     readonly: true },
      { name: '🗺️│roadmap',          type: 'text',   topic: 'Public roadmap — where WHISPRR is going.',                             readonly: true },
      { name: '📓│founder-journal',  type: 'text',   topic: 'Behind-the-scenes updates from the WHISPRR founder.',                  readonly: true },
      { name: '🗳️│polls',            type: 'text',   topic: 'Community polls and feature votes.',                                   readonly: false },
    ],
  },
  {
    name: '💬 COMMUNITY',
    visibility: 'public',
    channels: [
      { name: '💬│general',          type: 'text',   topic: 'General conversations about anything WHISPRR.',                        readonly: false },
      { name: '👋│introductions',    type: 'text',   topic: 'Tell us about yourself and what brought you here!',                    readonly: false },
      { name: '💡│ideas',            type: 'text',   topic: 'Share your ideas for WHISPRR features and improvements.',              readonly: false },
      { name: '🖼️│media-share',      type: 'text',   topic: 'Share screenshots, designs, or creative work.',                        readonly: false },
      { name: '🎮│off-topic',        type: 'text',   topic: 'Chat about anything — music, games, life.',                            readonly: false },
      { name: '🔊│voice-lounge',     type: 'voice',  topic: 'Hang out with the community.',                                         readonly: false },
    ],
  },
  {
    name: '🌍 COUNTRY SPACES',
    visibility: 'public',
    channels: [
      { name: '🌍│global-chat',      type: 'text',   topic: 'Where WHISPRR users from every country connect.',                      readonly: false },
      { name: '🇸🇳│senegal',         type: 'text',   topic: 'WHISPRR Senegal — Bienvenue!',                                         readonly: false },
      { name: '🇨🇦│canada',          type: 'text',   topic: 'WHISPRR Canada — Welcome!',                                            readonly: false },
      { name: '🇺🇸│usa',             type: 'text',   topic: 'WHISPRR USA — Welcome!',                                               readonly: false },
      { name: '🇫🇷│france',          type: 'text',   topic: 'WHISPRR France — Bienvenue!',                                           readonly: false },
      { name: '🇯🇵│japan',           type: 'text',   topic: 'WHISPRR Japan — ようこそ!',                                             readonly: false },
      { name: '🇧🇷│brazil',          type: 'text',   topic: 'WHISPRR Brazil — Bem-vindo!',                                           readonly: false },
      { name: '🇬🇧│united-kingdom',  type: 'text',   topic: 'WHISPRR United Kingdom — Welcome!',                                    readonly: false },
      { name: '🇩🇪│germany',         type: 'text',   topic: 'WHISPRR Germany — Willkommen!',                                         readonly: false },
      { name: '🇨🇳│china',           type: 'text',   topic: 'WHISPRR China — 欢迎!',                                                 readonly: false },
    ],
  },
  {
    name: '🎨 CREATORS',
    visibility: 'public',
    channels: [
      { name: '🎨│creator-lounge',   type: 'text',   topic: 'A space for WHISPRR creators to connect.',                             readonly: false },
      { name: '🖌️│showcase',         type: 'text',   topic: 'Show off your latest creations, art, or projects.',                    readonly: false },
      { name: '📸│creator-tips',     type: 'text',   topic: 'Tips, resources, and advice for creators.',                            readonly: false },
      { name: '🎤│creator-voice',    type: 'voice',  topic: 'Voice chat for creators.',                                              readonly: false },
    ],
  },
  {
    name: '🛠 SUPPORT',
    visibility: 'public',
    channels: [
      { name: '🐛│bug-reports',      type: 'forum',  topic: 'Report bugs and technical issues.',                                    readonly: false },
      { name: '💡│feature-requests',  type: 'forum',  topic: 'Suggest new features and improvements.',                               readonly: false },
      { name: '❓│help',             type: 'text',   topic: 'Get help with WHISPRR — ask anything!',                                readonly: false },
      { name: '📖│guides',           type: 'text',   topic: 'Tutorials, guides, and how-tos.',                                      readonly: true },
    ],
  },
  {
    name: '🤖 CHIMERA CREATION',
    visibility: 'public',
    channels: [
      { name: '🤖│ai-characters',    type: 'text',   topic: 'Share, discuss, and test your custom AI characters and personas.',     readonly: false },
      { name: '🗺️│world-studio',     type: 'text',   topic: 'Discuss worldbuilding, lorebooks, and custom maps.',                   readonly: false },
      { name: '✍️│story-studio',     type: 'text',   topic: 'Brainstorm plots, collaborate on stories, and share prompts.',         readonly: false },
      { name: '🧠│chimera-feedback',  type: 'text',   topic: 'Share feedback on CHIMERA models, studio tools, and UX.',              readonly: false },
    ],
  },
  {
    name: '🧪 BETA PROGRAM',
    visibility: 'public',
    channels: [
      { name: '🧪│beta-announcements', type: 'text', topic: 'Announcements for beta testers.',                                      readonly: true },
      { name: '🧪│beta-feedback',      type: 'text', topic: 'Beta tester feedback and discussion.',                                  readonly: false },
      { name: '🧪│beta-bugs',          type: 'text', topic: 'Report beta-specific bugs here.',                                       readonly: false },
    ],
  },
  {
    name: '🎉 EVENTS',
    visibility: 'public',
    channels: [
      { name: '🎉│event-announcements', type: 'text', topic: 'Upcoming community events, AMAs, and hangouts.',                       readonly: true },
      { name: '🎤│ama-stage',           type: 'stage', topic: 'Ask Me Anything — live Q&A sessions.',                                 readonly: false },
      { name: '🎮│game-nights',         type: 'text',  topic: 'Community game nights and fun events.',                                 readonly: false },
    ],
  },
  {
    name: '🔐 STAFF',
    visibility: 'staff',
    channels: [
      { name: '🔐│staff-general',       type: 'text',   topic: 'Internal staff discussion.',                                         readonly: false },
      { name: '📋│staff-tasks',          type: 'text',   topic: 'Task tracking and assignments.',                                     readonly: false },
      { name: '🛡️│moderation-log',      type: 'text',   topic: 'Moderation actions and audit logs.',                                  readonly: false },
      { name: '📊│staff-analytics',      type: 'text',   topic: 'Server analytics, growth metrics, and insights.',                    readonly: false },
      { name: '🔊│staff-voice',          type: 'voice',  topic: 'Private staff voice channel.',                                       readonly: false },
    ],
  },
  {
    name: '👑 FOUNDER',
    visibility: 'founder',
    channels: [
      { name: '👑│founder-private',     type: 'text',   topic: 'Founder-only private notes and strategy.',                            readonly: false },
      { name: '📝│founder-drafts',      type: 'text',   topic: 'Draft announcements, journal entries, and blog posts.',               readonly: false },
      { name: '📊│founder-dashboard',   type: 'text',   topic: 'Platform metrics, server analytics, and system health.',              readonly: false },
      { name: '🔊│founder-voice',       type: 'voice',  topic: 'Founder private voice channel.',                                      readonly: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY ROLES  — For future bot role-assignment
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRY_ROLES = [
  { name: '🇸🇳 Senegal',           color: '#009739' },
  { name: '🇨🇦 Canada',            color: '#FF0000' },
  { name: '🇺🇸 USA',               color: '#3C3B6E' },
  { name: '🇫🇷 France',            color: '#002395' },
  { name: '🇯🇵 Japan',             color: '#BC002D' },
  { name: '🇧🇷 Brazil',            color: '#009C3B' },
  { name: '🇬🇧 United Kingdom',    color: '#012169' },
  { name: '🇩🇪 Germany',           color: '#DD0000' },
  { name: '🇨🇳 China',             color: '#DE2910' },
  { name: '🇮🇳 India',             color: '#FF9933' },
  { name: '🇳🇬 Nigeria',           color: '#008751' },
  { name: '🇲🇽 Mexico',            color: '#006847' },
  { name: '🇰🇷 South Korea',       color: '#003478' },
  { name: '🇦🇺 Australia',         color: '#00008B' },
  { name: '🇮🇹 Italy',             color: '#009246' },
  { name: '🇪🇸 Spain',             color: '#AA151B' },
  { name: '🇵🇹 Portugal',          color: '#006600' },
  { name: '🇹🇷 Turkey',            color: '#E30A17' },
  { name: '🇸🇦 Saudi Arabia',      color: '#006C35' },
  { name: '🇿🇦 South Africa',      color: '#007A4D' },
  { name: '🇵🇭 Philippines',       color: '#0038A8' },
  { name: '🇮🇩 Indonesia',         color: '#FF0000' },
  { name: '🇹🇭 Thailand',          color: '#A51931' },
  { name: '🇻🇳 Vietnam',           color: '#DA251D' },
  { name: '🇦🇷 Argentina',         color: '#74ACDF' },
  { name: '🇨🇴 Colombia',          color: '#FCD116' },
  { name: '🇪🇬 Egypt',             color: '#CE1126' },
  { name: '🇰🇪 Kenya',             color: '#006600' },
  { name: '🇲🇦 Morocco',           color: '#C1272D' },
  { name: '🇵🇱 Poland',            color: '#DC143C' },
];

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME EMBEDS
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmbed() {
  return new EmbedBuilder()
    .setColor(0xC96059)
    .setTitle('✨ Welcome to the WHISPRR Ecosystem')
    .setDescription(
      `**WHISPRR is the Home of Creators.**\n\n` +
      `This is the official community hub for the entire WHISPRR and CHIMERA ecosystem.\n\n` +
      `• **WHISPRR** is where creations live, creators build profiles, and connect with their audience.\n` +
      `• **CHIMERA** is our AI Creation Studio, where creators build AI characters, worlds, lorebooks, and stories.\n\n` +
      `One WHISPRR account provides seamless access to both platforms.`
    )
    .addFields(
      { name: '🚀 Get Started', value: '1. Read the <#rules> channel\n2. Grab your country roles in <#get-roles>\n3. Say hi in <#introductions>\n4. Explore our roadmap in <#roadmap>', inline: false },
      { name: '🔗 Official Links', value: '[WHISPRR Platform](https://whisprr.xyz) • [GitHub](https://github.com/diorix10-beep/WHISPRR-GITHUB)', inline: false },
    )
    .setFooter({ text: 'WHISPRR & CHIMERA — Built in public since 2026' })
    .setTimestamp();
}

function buildRulesEmbed() {
  return new EmbedBuilder()
    .setColor(0xC96059)
    .setTitle('📜 WHISPRR HQ — Community Rules')
    .setDescription(
      `WHISPRR is built on respect, transparency, and genuine connection. ` +
      `These rules ensure everyone has a positive experience.`
    )
    .addFields(
      { name: '1. Be Respectful', value: 'Treat everyone with dignity. No harassment, hate speech, discrimination, or bullying of any kind.', inline: false },
      { name: '2. No Spam', value: 'No spam, excessive self-promotion, or unsolicited DMs. Share meaningfully.', inline: false },
      { name: '3. Stay On Topic', value: 'Use the right channel for your message. Off-topic conversations go in #off-topic.', inline: false },
      { name: '4. No NSFW', value: 'This server is safe for all ages. No explicit, graphic, or inappropriate content.', inline: false },
      { name: '5. Protect Privacy', value: 'Never share someone else\'s personal information without consent.', inline: false },
      { name: '6. Follow Discord TOS', value: 'All Discord Terms of Service and Community Guidelines apply.', inline: false },
      { name: '7. Listen to Staff', value: 'Moderators and admins maintain this space. Respect their decisions.', inline: false },
      { name: '8. Have Fun', value: 'WHISPRR is about genuine connection. Be yourself, share ideas, and help build something meaningful.', inline: false },
    )
    .setFooter({ text: 'Breaking these rules may result in warnings, mutes, or bans.' })
    .setTimestamp();
}

function buildLinksEmbed() {
  return new EmbedBuilder()
    .setColor(0xC96059)
    .setTitle('🔗 Official Ecosystem Links')
    .setDescription('All official links in one place.')
    .addFields(
      { name: '🌐 WHISPRR Social', value: '[whisprr.xyz](https://whisprr.xyz)', inline: true },
      { name: '🤖 CHIMERA Studio', value: '[chimera.whisprr.xyz](https://chimera.whisprr.xyz)', inline: true },
      { name: '💻 GitHub Monorepo', value: '[WHISPRR-GITHUB](https://github.com/diorix10-beep/WHISPRR-GITHUB)', inline: true },
    )
    .setFooter({ text: 'WHISPRR × CHIMERA — The Ecosystem of Creators' });
}

function buildFaqEmbed() {
  return new EmbedBuilder()
    .setColor(0xC96059)
    .setTitle('❓ Frequently Asked Questions')
    .addFields(
      { name: 'What is WHISPRR?', value: 'WHISPRR is the Home of Creators — a premium, secure social platform where creators can build profiles, publish stories, create communities, and connect with their audience.', inline: false },
      { name: 'What is CHIMERA?', value: 'CHIMERA is the AI Creation Studio of the ecosystem. It houses our AI Character Studio, World Studio, Lore Studio, and Story Studio for writing, AI-assisted roleplay, and collaborative creations.', inline: false },
      { name: 'How do accounts work across both platforms?', value: 'A single WHISPRR account grants access to both WHISPRR and CHIMERA. CHIMERA does not host standalone platform accounts; WHISPRR remains the central identity provider.', inline: false },
      { name: 'Is the ecosystem free?', value: 'Yes! The free experience is designed to be fully functional and enjoyable. Advanced creative tools or larger context memories will eventually be offered as premium features via WHISPRR+.', inline: false },
      { name: 'How can I join the beta?', value: 'Apply through the Beta Program on our platform, or ask in #beta-feedback.', inline: false },
      { name: 'Can I contribute?', value: 'Absolutely! Share ideas in #ideas, report bugs in #bug-reports, or request features in #feature-requests.', inline: false },
      { name: 'What are Country Spaces?', value: 'Country Spaces are Regional hubs on WHISPRR that allow users to connect with creators and friends from their specific region first, then expand globally.', inline: false },
    )
    .setFooter({ text: 'More questions? Ask in #help!' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETUP FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function setupWhisprrHQ() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🏗️  WHISPRR HQ — Discord Server Setup');
  console.log('═══════════════════════════════════════════════════════════\n');

  await client.login(DISCORD_BOT_TOKEN);
  console.log(`✅ Bot logged in as ${client.user.tag}\n`);

  const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
  console.log(`✅ Connected to server: ${guild.name} (${guild.id})\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Update server info
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 1: Server Configuration ━━━');
  await guild.edit({
    name: 'WHISPRR HQ',
    description: 'Official WHISPRR Community ✨ WHISPRR is the Home of Creators. 🤖 CHIMERA is the AI Creation Studio. 🌍 Built in public.',
  });
  console.log('  ✅ Server name set to "WHISPRR HQ"');
  console.log('  ✅ Server description updated\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Clean existing channels and roles (except @everyone and bot role)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 2: Cleaning Existing Channels & Roles ━━━');

  // Delete all existing channels
  const existingChannels = await guild.channels.fetch();
  for (const [, ch] of existingChannels) {
    if (ch) {
      try { await ch.delete(); } catch (e) { /* ignore */ }
    }
  }
  console.log(`  ✅ Cleared ${existingChannels.size} existing channels`);

  // Delete all existing roles (except @everyone and managed/bot roles)
  const existingRoles = await guild.roles.fetch();
  for (const [, role] of existingRoles) {
    if (!role.managed && role.name !== '@everyone') {
      try { await role.delete(); } catch (e) { /* ignore */ }
    }
  }
  console.log(`  ✅ Cleared existing custom roles\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Create Roles (highest first for proper hierarchy)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 3: Creating Roles ━━━');

  const roleMap = new Map(); // name -> Role object

  // Create in reverse so we can position them correctly
  // Discord positions: higher number = higher in hierarchy
  for (let i = ROLES.length - 1; i >= 0; i--) {
    const roleDef = ROLES[i];
    const permBits = roleDef.permissions.reduce((acc, perm) => acc | perm, 0n);

    const role = await guild.roles.create({
      name: roleDef.name,
      color: roleDef.color,
      hoist: roleDef.hoist,
      mentionable: roleDef.mentionable,
      permissions: permBits || 0n,
      reason: 'WHISPRR HQ automated setup',
    });

    roleMap.set(roleDef.name, role);
    console.log(`  ✅ Created role: ${roleDef.name} (${roleDef.color})`);
  }

  // Since the bot's own role cannot be repositioned above roles with administrator permissions by itself without manual intervention,
  // we let roles establish their hierarchy naturally by creating them from lowest to highest.
  console.log('  ✅ Role hierarchy established naturally via creation order (Member → Founder)\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Create Country Roles
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 4: Creating Country Roles ━━━');

  const countryRoleMap = new Map();
  for (const cr of COUNTRY_ROLES) {
    const role = await guild.roles.create({
      name: cr.name,
      color: cr.color,
      hoist: false,
      mentionable: false,
      permissions: 0n,
      reason: 'WHISPRR HQ country role',
    });
    countryRoleMap.set(cr.name, role);
  }
  console.log(`  ✅ Created ${COUNTRY_ROLES.length} country roles\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Create Categories & Channels with Permissions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 5: Creating Categories & Channels ━━━');

  const channelMap = new Map(); // channel name -> Channel object (for embed references)
  const everyoneRole = guild.roles.everyone;

  for (const category of CATEGORIES) {
    // Build permission overwrites for the category
    const categoryOverwrites = [];

    if (category.visibility === 'staff') {
      // Staff-only: deny everyone, allow staff roles
      categoryOverwrites.push({
        id: everyoneRole.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      });
      for (const staffRoleName of STAFF_ROLE_NAMES) {
        const staffRole = roleMap.get(staffRoleName);
        if (staffRole) {
          categoryOverwrites.push({
            id: staffRole.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
          });
        }
      }
    } else if (category.visibility === 'founder') {
      // Founder-only: deny everyone, allow only Founder
      categoryOverwrites.push({
        id: everyoneRole.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      });
      const founderRole = roleMap.get(FOUNDER_ROLE_NAME);
      if (founderRole) {
        categoryOverwrites.push({
          id: founderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        });
      }
    }
    // 'public' = no overwrites needed (inherits from @everyone defaults)

    const createdCategory = await guild.channels.create({
      name: category.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryOverwrites,
      reason: 'WHISPRR HQ automated setup',
    });

    console.log(`  📁 ${category.name}`);

    // Create channels inside this category
    for (const ch of category.channels) {
      let channelType;
      switch (ch.type) {
        case 'voice':        channelType = ChannelType.GuildVoice; break;
        case 'stage':        
          // Stage channels (type 13) require Community enabled. Fallback to GuildVoice.
          channelType = ChannelType.GuildVoice; 
          break;
        case 'announcement': 
          // Announcement channels (type 5) require the server to have Community enabled.
          // We fallback to GuildText (type 0) to avoid API errors if Community is not active yet.
          channelType = ChannelType.GuildText; 
          break;
        case 'forum':        channelType = ChannelType.GuildForum; break;
        default:             channelType = ChannelType.GuildText; break;
      }

      // Build per-channel permission overwrites
      const channelOverwrites = [];

      if (ch.readonly && category.visibility === 'public') {
        // Read-only for everyone: allow view, deny send
        channelOverwrites.push({
          id: everyoneRole.id,
          deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions],
        });
        // Staff can still send
        for (const staffRoleName of STAFF_ROLE_NAMES) {
          const staffRole = roleMap.get(staffRoleName);
          if (staffRole) {
            channelOverwrites.push({
              id: staffRole.id,
              allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions],
            });
          }
        }
      }

      const createdChannel = await guild.channels.create({
        name: ch.name,
        type: channelType,
        topic: (ch.type !== 'voice' && ch.type !== 'stage') ? (ch.topic || undefined) : undefined,
        parent: createdCategory.id,
        permissionOverwrites: channelOverwrites.length > 0 ? channelOverwrites : undefined,
        reason: 'WHISPRR HQ automated setup',
      });

      channelMap.set(ch.name, createdChannel);
      console.log(`     ${ch.type === 'voice' || ch.type === 'stage' ? '🔊' : ch.type === 'forum' ? '📋' : '💬'} ${ch.name}`);
    }
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Post Welcome Content
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 6: Posting Welcome Content ━━━');

  const welcomeChannel = channelMap.get('👋│welcome');
  const rulesChannel   = channelMap.get('📜│rules');
  const faqChannel     = channelMap.get('❓│faq');
  const linksChannel   = channelMap.get('🔗│links');

  if (welcomeChannel) {
    await sendEmbed('guide', welcomeChannel, buildWelcomeEmbed());
    console.log('  ✅ Welcome embed posted');
  }
  if (rulesChannel) {
    await sendEmbed('guide', rulesChannel, buildRulesEmbed());
    console.log('  ✅ Rules embed posted');
  }
  if (faqChannel) {
    await sendEmbed('guide', faqChannel, buildFaqEmbed());
    console.log('  ✅ FAQ embed posted');
  }
  if (linksChannel) {
    await sendEmbed('guide', linksChannel, buildLinksEmbed());
    console.log('  ✅ Links embed posted');
  }

  // Post roadmap overview
  const roadmapChannel = channelMap.get('🗺️│roadmap');
  if (roadmapChannel) {
    const roadmapEmbed = new EmbedBuilder()
      .setColor(0xC96059)
      .setTitle('🗺️ WHISPRR Ecosystem Roadmap')
      .setDescription('Track where WHISPRR and CHIMERA are going — from active priorities to future expansion.')
      .addFields(
        { name: '✅ Core Platform Status', value: 'Authentication • Profiles & Bio • Feed & Posting • Communities (Icon & Image Uploads) • Voice Rooms • Group Chats & DMs • Notifications', inline: false },
        { name: '🚀 Active Priorities', value: '1. Rebuilding Discovery flow to focus on creator-first recommendations (replacing interest recommendations)\n2. WHISPRR ↔ CHIMERA single identity/SSO integration\n3. Full WHISPRR Brand Redesign (Home of Creators)\n4. Internal operating center (Founder Dashboard)\n5. Rebuilding the Public Website & Founder Journal', inline: false },
        { name: '🧪 Beta Testing Stage', value: 'Private Beta (staged rollouts for 10 → 25 → 100 creators to test stability & gather creator feedback).', inline: false },
        { name: '🔵 Postponed / Future Phases', value: 'AI Characters & Memory (CHIMERA Studio) • Voice Spaces • Creator Monetization & Marketplace • Native iOS & Android apps • Public API', inline: false },
      )
      .setFooter({ text: 'Ecosystem Roadmap — Q3 2026' })
      .setTimestamp();
    await sendEmbed('roadmap', roadmapChannel, roadmapEmbed);
    console.log('  ✅ Roadmap embed posted');
  }

  // Post role selection guide
  const getRolesChannel = channelMap.get('🎯│get-roles');
  if (getRolesChannel) {
    await setupRoleSelectionMessage(guild);
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Configure @everyone defaults
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 7: Configuring @everyone Defaults ━━━');
  await everyoneRole.setPermissions([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.UseVAD,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.ChangeNickname,
  ]);
  console.log('  ✅ @everyone defaults configured\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: Set system channel
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━ STEP 8: System Channel Configuration ━━━');
  if (welcomeChannel) {
    await guild.edit({
      systemChannel: welcomeChannel.id,
      systemChannelFlags: 0,
    });
    console.log('  ✅ System channel set to #welcome\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const totalChannels = [...channelMap.values()].length;
  const totalRoles = ROLES.length + COUNTRY_ROLES.length;
  const totalCategories = CATEGORIES.length;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎉 WHISPRR HQ — Setup Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📁 ${totalCategories} categories created`);
  console.log(`  💬 ${totalChannels} channels created`);
  console.log(`  🎭 ${totalRoles} roles created (${ROLES.length} hierarchy + ${COUNTRY_ROLES.length} countries)`);
  console.log(`  📜 ${5} welcome embeds posted`);
  console.log('');
  console.log('  Role Hierarchy (top → bottom):');
  ROLES.forEach((r, i) => {
    console.log(`    ${i + 1}. ${r.name} — ${r.color}`);
  });
  console.log('');
  console.log('  Permission Zones:');
  console.log('    🟢 PUBLIC  — Everyone can view & interact');
  console.log('    🟡 STAFF   — Staff roles only');
  console.log('    🔴 FOUNDER — Founder only');
  console.log('');
  console.log('  Next Steps:');
  console.log('    1. Assign the 👑 Founder role to yourself');
  console.log('    2. Build a WHISPRR Discord bot for automation');
  console.log('    3. Set up server icon and banner');
  console.log('    4. Configure Community features in Server Settings');
  console.log('    5. Enable Onboarding in Server Settings > Onboarding');
  console.log('═══════════════════════════════════════════════════════════\n');

  await client.destroy();
  process.exit(0);
}

// Run
setupWhisprrHQ().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
