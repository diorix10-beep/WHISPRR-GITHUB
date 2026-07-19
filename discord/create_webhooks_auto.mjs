import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';

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
const GUILD_ID = env.DISCORD_GUILD_ID || '1148719266157834310'; // Fallback or look up active guild

if (!BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is missing in env files.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Map of desired webhook keys to channel name search queries
const WEBHOOK_MAPPING = {
  DISCORD_WEBHOOK_GUIDE: 'welcome',
  DISCORD_WEBHOOK_NEWS: 'announcements',
  DISCORD_WEBHOOK_UPDATES: 'changelog',
  DISCORD_WEBHOOK_ROADMAP: 'roadmap',
  DISCORD_WEBHOOK_JOURNAL: 'founder-journal',
  DISCORD_WEBHOOK_POLLS: 'polls',
  DISCORD_WEBHOOK_BETA: 'beta-announcements'
};

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}. Starting automatic webhook creation...`);
  
  try {
    let guild;
    if (GUILD_ID && GUILD_ID !== 'YOUR_GUILD_ID_HERE') {
      guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
    }
    
    if (!guild) {
      guild = client.guilds.cache.first();
    }

    if (!guild) {
      throw new Error(`The bot is not connected to any guild. Please invite the bot first.`);
    }
    console.log(`🏰 Connected to Guild: ${guild.name}`);

    const channels = await guild.channels.fetch();
    const webhooksCreated = {};

    for (const [envKey, channelQuery] of Object.entries(WEBHOOK_MAPPING)) {
      const channel = channels.find(c => c.name && c.name.toLowerCase().includes(channelQuery));
      if (!channel) {
        console.warn(`⚠️ Could not find channel matching query: "${channelQuery}"`);
        continue;
      }

      console.log(`⚙️ Checking webhooks for channel: #${channel.name}`);
      const existingWebhooks = await channel.fetchWebhooks();
      let webhook = existingWebhooks.find(wh => wh.name.startsWith('WHISPRR'));

      if (!webhook) {
        console.log(`   ➕ Creating new webhook in #${channel.name}...`);
        webhook = await channel.createWebhook({
          name: `WHISPRR Webhook (${channelQuery})`,
          reason: 'Auto-created by WHISPRR setup script for multi-identity updates'
        });
      } else {
        console.log(`   ✅ Existing webhook found in #${channel.name}`);
      }

      webhooksCreated[envKey] = webhook.url;
    }

    // Update the .env.production.local file
    let envContent = fs.readFileSync(envPath, 'utf-8');
    let updated = false;

    for (const [key, url] of Object.entries(webhooksCreated)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${url}`);
        updated = true;
      } else {
        envContent += `\n${key}=${url}`;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`\n🎉 Webhooks successfully written to ${envPath}!`);
    }

  } catch (err) {
    console.error("💥 Failed to auto-create webhooks:", err.message || err);
  } finally {
    client.destroy();
  }
});

client.login(BOT_TOKEN);
