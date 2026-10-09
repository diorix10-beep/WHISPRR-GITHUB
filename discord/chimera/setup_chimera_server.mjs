// Adds the missing CHIMERA roles, categories and channels to an EXISTING server. It only ever ADDS:
// it never renames, moves, edits or deletes anything that is already there, never touches @everyone, and
// never creates a role with administrator rights.
//
// By default it only PRINTS the plan. To apply it:
//   DISCORD_BOT_TOKEN=... CHIMERA_DISCORD_GUILD_ID=... CONFIRM_SERVER_NAME="exact server name" \
//     node discord/chimera/setup_chimera_server.mjs --apply
//
// The bot needs: Manage Roles, Manage Channels, View Channels, Send Messages, Embed Links.
// Its own role must sit ABOVE the roles it creates (Discord rule) for the 🛡️ Moderator role to be created.
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder, OverwriteType } from 'discord.js';
import { readConfig, snapshot } from './lib.mjs';
import { CATEGORIES, ROLES, STAFF_ROLE, BETA_ROLE, planChanges, summarize, normalize } from './plan.mjs';
import { RULES, WELCOME, FAQ, LINKS } from './texts.mjs';
import { mergeOverwrites } from './overwrites.mjs';

const apply = process.argv.includes('--apply');
const { token, guildId } = readConfig();
const TYPES = { text: ChannelType.GuildText, announcement: ChannelType.GuildAnnouncement, forum: ChannelType.GuildForum };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const shot = await snapshot(guild);
    const steps = planChanges(shot);
    console.log(`Server: ${guild.name} (${guild.memberCount} members)`);
    for (const s of steps) {
      const mark = s.action === 'create' ? '+ create' : s.action === 'skip' ? '  skip  ' : '  exists ';
      console.log(`${mark}  ${s.kind.padEnd(8)} ${s.name}${s.where ? `  (already in ${s.where})` : ''}`);
    }
    console.log('\nSummary:', JSON.stringify(summarize(steps)));
    if (!apply) {
      console.log('\nDRY RUN: nothing was changed. Add --apply (and CONFIRM_SERVER_NAME) to apply.');
      return;
    }
    if (process.env.CONFIRM_SERVER_NAME !== guild.name) {
      throw new Error(`Refusing to apply: set CONFIRM_SERVER_NAME to the exact server name, "${guild.name}".`);
    }

    // Roles
    const roleByName = new Map();
    for (const role of guild.roles.cache.values()) roleByName.set(normalize(role.name), role);
    for (const def of ROLES) {
      if (roleByName.has(normalize(def.name))) continue;
      const created = await guild.roles.create({
        name: def.name, color: def.color, hoist: def.hoist, mentionable: def.mentionable,
        permissions: def.permissions.map((p) => PermissionFlagsBits[p]), reason: 'CHIMERA server setup',
      });
      roleByName.set(normalize(def.name), created);
      console.log('created role', def.name);
    }
    const staffRole = roleByName.get(normalize(STAFF_ROLE));
    const betaRole = roleByName.get(normalize(BETA_ROLE));
    const everyone = guild.roles.everyone;
    const VIEW = PermissionFlagsBits.ViewChannel;
    const SEND = PermissionFlagsBits.SendMessages;
    const THREADS = PermissionFlagsBits.CreatePublicThreads | PermissionFlagsBits.CreatePrivateThreads;
    const botAccess = { id: client.user.id, type: OverwriteType.Member, allow: VIEW | SEND | PermissionFlagsBits.EmbedLinks, deny: 0n };

    // Categories and channels
    const categories = new Map(shot.categories.map((c) => [normalize(c.name), c.id]));
    const existingChannels = new Set(shot.channels.map((c) => normalize(c.name)));
    const posted = {};
    for (const cat of CATEGORIES) {
      const missing = cat.channels.filter((c) => !existingChannels.has(normalize(c.name)));
      if (missing.length === 0) continue;
      let parent = categories.get(normalize(cat.name)) ? await guild.channels.fetch(categories.get(normalize(cat.name))) : null;
      if (!parent) {
        const overwrites = [];
        if (cat.visibility !== 'public') {
          overwrites.push({ id: everyone.id, type: OverwriteType.Role, allow: 0n, deny: VIEW });
          if (staffRole) overwrites.push({ id: staffRole.id, type: OverwriteType.Role, allow: VIEW, deny: 0n });
          if (cat.visibility === 'beta' && betaRole) overwrites.push({ id: betaRole.id, type: OverwriteType.Role, allow: VIEW, deny: 0n });
          // The bot must keep seeing the category it just hid from @everyone, or it cannot create channels in it.
          overwrites.push(botAccess);
        }
        parent = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites.length ? overwrites : undefined, reason: 'CHIMERA server setup' });
        console.log('created category', cat.name);
      }
      // A new channel copies its category's permissions (so a private category's channels stay private) and adds only what it needs.
      const inherited = [...parent.permissionOverwrites.cache.values()].map((o) => ({ id: o.id, type: o.type, allow: o.allow.bitfield, deny: o.deny.bitfield }));
      for (const def of missing) {
        const extras = [];
        if (def.readonly) {
          extras.push({ id: everyone.id, type: OverwriteType.Role, allow: 0n, deny: SEND | THREADS });
          if (staffRole) extras.push({ id: staffRole.id, type: OverwriteType.Role, allow: SEND, deny: 0n });
          // The @everyone deny above also applies to the bot, so it needs its own allow to post the texts.
          extras.push(botAccess);
        }
        const overwrites = mergeOverwrites(inherited, extras);
        const make = (type) => guild.channels.create({ name: def.name, type, parent: parent.id, topic: def.topic, permissionOverwrites: overwrites, reason: 'CHIMERA server setup' });
        let channel;
        try {
          channel = await make(TYPES[def.type]);
        } catch (error) {
          // Announcement and forum channels need the "Community" feature. Without it, a plain text channel does the job.
          if (def.type === 'text') throw error;
          console.log(`  (${def.name}: ${def.type} channels need the Community feature, creating a text channel instead)`);
          channel = await make(TYPES.text);
        }
        posted[def.name] = channel;
        console.log('created channel', def.name);
      }
    }

    // Texts go only into channels created just now, never into an existing one.
    const rulesChannel = Object.entries(posted).find(([n]) => normalize(n) === 'rules')?.[1];
    const embed = (t) => new EmbedBuilder().setTitle(t.title).setDescription(t.description.replace('<#RULES>', rulesChannel ? `<#${rulesChannel.id}>` : '#rules')).setColor(0x8b5cf6);
    for (const [name, text] of [['rules', RULES], ['welcome', WELCOME], ['faq', FAQ], ['links', LINKS]]) {
      const channel = Object.entries(posted).find(([n]) => normalize(n) === name)?.[1];
      if (!channel) continue;
      try {
        await channel.send({ embeds: [embed(text)], allowedMentions: { parse: [] } });
      } catch (error) {
        // The channel exists now, so a rerun will not seed it: say so, and where the text lives.
        console.log(`  Could not post the ${name} text (${error.message}). Paste it by hand from discord/chimera/texts.mjs.`);
      }
    }
    console.log('\nDone. Nothing that already existed was changed.');
  } finally {
    await client.destroy();
  }
});
client.login(token).catch((error) => { console.error('Could not log in:', error.message); process.exit(1); });
process.on('unhandledRejection', (error) => { console.error('Failed:', error.message ?? error); process.exit(1); });
