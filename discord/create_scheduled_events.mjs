import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } from 'discord.js';

const env = {};
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
}

const workspaceDir = path.resolve();
const envPath = path.join(workspaceDir, '.env.production.local');
loadEnvFile(envPath);
Object.assign(env, process.env);

const BOT_TOKEN = env.DISCORD_BOT_TOKEN;
const GUILD_ID = env.DISCORD_GUILD_ID || '1521345241150521486'; // Real guild ID from logs

if (!BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is missing in env files.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents]
});

// Helper to calculate upcoming day date-time object
function getNextDayOfWeek(dayOfWeek, hour, minute) {
  const resultDate = new Date();
  resultDate.setDate(resultDate.getDate() + ((7 + dayOfWeek - resultDate.getDay()) % 7));
  resultDate.setHours(hour, minute, 0, 0);
  // If it is today but the hour has already passed, schedule for next week
  if (resultDate < new Date()) {
    resultDate.setDate(resultDate.getDate() + 7);
  }
  return resultDate;
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}. Creating scheduled community events...`);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      throw new Error(`Guild with ID ${GUILD_ID} not found.`);
    }
    console.log(`🏰 Connected to Guild: ${guild.name}`);

    // Fetch channels to get voice/stage IDs
    const channels = await guild.channels.fetch();
    console.log("Found channels:");
    for (const c of channels.values()) {
      if (c.type === 2 || c.type === 13) { // 2 = GuildVoice, 13 = GuildStageVoice
        console.log(`- #${c.name} (ID: ${c.id}, Type: ${c.type})`);
      }
    }

    const voiceLounge = channels.find(c => c.name && c.name.includes('voice-lounge'));
    const creatorVoice = channels.find(c => c.name && c.name.includes('creator-voice'));
    const amaStage = channels.find(c => c.name && c.name.includes('ama-stage'));

    if (!voiceLounge || !creatorVoice || !amaStage) {
      throw new Error("Required voice or stage channels not found on the guild.");
    }

    // Diagnostics
    const botMember = await guild.members.fetch(client.user.id);
    console.log(`\nDiagnostics for Bot (${client.user.tag}):`);
    console.log(`- Bot Roles: ${botMember.roles.cache.map(r => r.name).join(', ')}`);
    
    const permissions = voiceLounge.permissionsFor(botMember);
    console.log(`- Permissions in #voice-lounge:`);
    console.log(`  * ViewChannel: ${permissions.has('ViewChannel')}`);
    console.log(`  * Connect: ${permissions.has('Connect')}`);
    console.log(`  * ManageEvents: ${permissions.has('ManageEvents')}`);
    console.log(`  * Administrator: ${permissions.has('Administrator')}\n`);

    const eventsToCreate = [
      {
        name: '🎶 Friday Music Session',
        description: 'Join the community for a synchronized Spotify Listen Along session. Chat, discover new music, and relax together.',
        scheduledStartTime: getNextDayOfWeek(5, 20, 0), // Friday at 8:00 PM
        scheduledEndTime: new Date(getNextDayOfWeek(5, 22, 0)),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        location: `#🔊│voice-lounge`
      },
      {
        name: '🎤 Michael Jackson Night',
        description: 'Celebrating the King of Pop! A synchronized listening party playing the greatest MJ tracks.',
        scheduledStartTime: getNextDayOfWeek(6, 21, 0), // Saturday at 9:00 PM
        scheduledEndTime: new Date(getNextDayOfWeek(6, 23, 0)),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        location: `#🔊│voice-lounge`
      },
      {
        name: '💻 Creator Coworking Session',
        description: 'Focus and build together. Hop into the voice channel to cowork with other creators in the ecosystem.',
        scheduledStartTime: getNextDayOfWeek(1, 14, 0), // Monday at 2:00 PM
        scheduledEndTime: new Date(getNextDayOfWeek(1, 16, 0)),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        location: `#🎤│creator-voice`
      },
      {
        name: '🎙️ Creator Talks & AMAs',
        description: 'Tune in on the AMA Stage as we interview featured creators about their writing process, lore building, and roleplay projects.',
        scheduledStartTime: getNextDayOfWeek(3, 18, 0), // Next Wednesday at 6:00 PM
        scheduledEndTime: new Date(getNextDayOfWeek(3, 19, 30)),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        location: `#🎤│ama-stage`
      }
    ];

    for (const event of eventsToCreate) {
      console.log(`📅 Creating event: "${event.name}" starting at ${event.scheduledStartTime}...`);
      
      await guild.scheduledEvents.create({
        name: event.name,
        description: event.description,
        scheduledStartTime: event.scheduledStartTime.toISOString(),
        scheduledEndTime: event.scheduledEndTime.toISOString(),
        privacyLevel: event.privacyLevel,
        entityType: event.entityType,
        entityMetadata: { location: event.location },
        reason: 'Auto-scheduled by WHISPRR community event bootstrapper'
      });
      console.log(`   ✅ Successful!`);
    }

    console.log('\n🎉 All community events successfully scheduled!');

  } catch (err) {
    console.error("💥 Failed to create scheduled events:", err.message || err);
  } finally {
    client.destroy();
  }
});

client.login(BOT_TOKEN);
