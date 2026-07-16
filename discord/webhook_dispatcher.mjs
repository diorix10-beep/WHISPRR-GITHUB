import fs from 'fs';
import path from 'path';

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
loadEnvFile(path.join(workspaceDir, '.env'));
loadEnvFile(path.join(workspaceDir, '.env.production.local'));
Object.assign(env, process.env);

// Branded identities for official WHISPRR communication
export const DISCORD_IDENTITIES = {
  guide: {
    username: 'WHISPRR Guide',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/guide.png',
    webhook_url: env.DISCORD_WEBHOOK_GUIDE
  },
  news: {
    username: 'WHISPRR News',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/news.png',
    webhook_url: env.DISCORD_WEBHOOK_NEWS
  },
  updates: {
    username: 'WHISPRR Updates',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/updates.png',
    webhook_url: env.DISCORD_WEBHOOK_UPDATES
  },
  roadmap: {
    username: 'WHISPRR Roadmap',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/roadmap.png',
    webhook_url: env.DISCORD_WEBHOOK_ROADMAP
  },
  journal: {
    username: 'WHISPRR Journal',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/journal.png',
    webhook_url: env.DISCORD_WEBHOOK_JOURNAL
  },
  polls: {
    username: 'WHISPRR Polls',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/polls.png',
    webhook_url: env.DISCORD_WEBHOOK_POLLS
  },
  beta: {
    username: 'WHISPRR Beta',
    avatar_url: 'https://gcknzlnumcryvqjvjnyg.supabase.co/storage/v1/object/public/brand/beta.png',
    webhook_url: env.DISCORD_WEBHOOK_BETA
  }
};

/**
 * Dispatches a message or embed to Discord using a specified branded identity webhook
 * @param {string} identityKey - Key from DISCORD_IDENTITIES ('guide', 'news', 'updates', etc.)
 * @param {object} payload - Message payload (content, embeds)
 */
export async function dispatchToDiscord(identityKey, payload) {
  const identity = DISCORD_IDENTITIES[identityKey];
  if (!identity) {
    throw new Error(`Identity key "${identityKey}" is not defined in DISCORD_IDENTITIES.`);
  }

  const webhookUrl = identity.webhook_url;
  if (!webhookUrl) {
    console.warn(`⚠️ Discord webhook URL for "${identity.username}" is not configured in environment variables.`);
    return { success: false, reason: 'missing_webhook_url' };
  }

  // Convert embeds to raw JSON if they are Discord.js EmbedBuilder instances
  let formattedEmbeds = [];
  if (payload.embeds) {
    formattedEmbeds = payload.embeds.map(embed => {
      return typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
    });
  }

  const body = {
    username: identity.username,
    avatar_url: identity.avatar_url,
    content: payload.content || '',
    embeds: formattedEmbeds
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Discord API returned status ${response.status}: ${errText}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`💥 Failed to dispatch message via webhook for identity "${identity.username}":`, error.message || error);
    return { success: false, error: error.message || error };
  }
}
