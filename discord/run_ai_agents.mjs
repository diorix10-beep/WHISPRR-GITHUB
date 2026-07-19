// ═══════════════════════════════════════════════════════════════════════════════
// WHISPRR HQ — Official AI Family Discord Dispatcher
// ═══════════════════════════════════════════════════════════════════════════════
//
// This script runs the WHISPRR Discord Bot as a multi-agent system.
// The bot listens to messages, notices mentions, and routes to the correct
// AI Family member (Oracle, Iris, Aegis, Atlas, Athena) based on channel or context.
//
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { handleGuildMemberAdd, handleRoleInteraction } from './role_manager.mjs';

// 1. ENVIRONMENT VARIABLES LOADER
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
    // Strip quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
}

// Load env files in cascade order (local -> development -> production)
const workspaceDir = path.resolve();
loadEnvFile(path.join(workspaceDir, '.env'));
loadEnvFile(path.join(workspaceDir, '.env.production.local'));

// Merge with process.env
Object.assign(env, process.env);

// CONFIGURATION
const DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
const GEMINI_API_KEY = env.GEMINI_API_KEY;

// Initialize Supabase Client
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://gcknzlnumcryvqjvjnyg.supabase.co';
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_A1KpY1p1S7dh6Z5UVKhAVw_1O5-PARd';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Register automated role event listeners
client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('interactionCreate', handleRoleInteraction);

// Helper: Clean Discord mentions from content
function cleanMessage(content) {
  return content.replace(/<@!\d+>|<@\d+>/g, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER FOR INDIVIDUAL AI HUMANS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER FOR WHISPRR GUIDE
// ─────────────────────────────────────────────────────────────────────────────
function buildAgentSystemPrompt() {
  return `
You are the WHISPRR Guide, the official AI community assistant for the WHISPRR and CHIMERA ecosystem.
Your role is to help users, answer questions about the platform, explain features, and guide creators.

ABOUT WHISPRR & CHIMERA:
WHISPRR is the Home of Creators — a premium, secure, creator-first social platform for sharing stories, profiles, and communities.
CHIMERA is the AI Creation Studio within the ecosystem where creators build AI characters, worlds, lorebooks, and participate in collaborative roleplay.

Ecosystem Rules:
1. One WHISPRR account automatically grants access to both WHISPRR and CHIMERA.
2. CHIMERA does not create independent platform accounts; WHISPRR remains the central identity provider for the entire ecosystem.

Guidelines:
1. Speak with genuine warmth, intelligence, and personality.
2. Treat Anthony (nyny590), the Founder and CEO of WHISPRR, with the utmost respect.
3. Keep your tone concise, engaging, and premium.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT DISPATCHER & LOGIC VIA DIRECT REST API CALL
// ─────────────────────────────────────────────────────────────────────────────
async function generateAIResponse(userPrompt, contextHistory = []) {
  const systemInstruction = buildAgentSystemPrompt();

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Map roles to Gemini format
    const contents = [
      ...contextHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    
    console.error('Unexpected Gemini API response structure:', data);
    return `*The WHISPRR Guide is momentarily reflecting on the architecture...* Let me look into that for you.`;
  } catch (error) {
    console.error(`Error generating response:`, error);
    return `*The WHISPRR Guide is momentarily reflecting on the architecture...* Let me look into that for you.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL ROUTING DICTIONARY
// ─────────────────────────────────────────────────────────────────────────────
function routeAgentByChannel(channelName) {
  const name = channelName.toLowerCase();
  
  if (name.includes('bug') || name.includes('help') || name.includes('faq')) {
    // Athena researches & analyzes bugs/issues
    return 'athena';
  }
  if (name.includes('security') || name.includes('rules') || name.includes('moderation')) {
    // Aegis monitors trust and security
    return 'aegis';
  }
  if (name.includes('deploy') || name.includes('infrastructure') || name.includes('vercel') || name.includes('github') || name.includes('tasks')) {
    // Atlas builds and monitors builds
    return 'atlas';
  }
  if (name.includes('status') || name.includes('latency') || name.includes('database') || name.includes('monitoring')) {
    // Iris manages system infrastructure status
    return 'iris';
  }
  
  // Oracle is the central coordinator for everything else
  return 'oracle';
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCORD EVENTS
// ─────────────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`\n🤖 WHISPRR AI Agents Active! Logged in as ${client.user.tag}`);
  client.user.setActivity('over WHISPRR HQ', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
  // Ignore bot's own messages
  if (message.author.bot) return;

  // ─── BETA INVITE PREFIX COMMANDS ───────────────────────────────────────────
  if (message.content.startsWith('!invite ')) {
    const parts = message.content.split(' ').map(p => p.trim()).filter(Boolean);
    const subCommand = parts[1]?.toLowerCase();

    if (subCommand === 'check') {
      const targetCode = parts[2]?.toUpperCase();
      if (!targetCode) {
        await message.reply('❌ Please specify an invite code to check: `!invite check CODE`');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('beta_invites')
          .select('*')
          .eq('code', targetCode)
          .maybeSingle();

        if (error || !data) {
          await message.reply(`❌ Invite code \`${targetCode}\` is invalid or does not exist.`);
          return;
        }

        if (data.revoked) {
          await message.reply(`❌ Invite code \`${targetCode}\` has been revoked by a founder.`);
          return;
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          await message.reply(`❌ Invite code \`${targetCode}\` has expired.`);
          return;
        }

        const remainingUses = (data.max_uses || 1) - (data.uses_count || 0);
        if (remainingUses <= 0) {
          await message.reply(`❌ Invite code \`${targetCode}\` has reached its usage limit (${data.uses_count}/${data.max_uses}).`);
          return;
        }

        await message.reply(`✅ Invite code \`${targetCode}\` is valid!\nUses: **${data.uses_count}/${data.max_uses}** (${remainingUses} remaining)\nExpires: ${data.expires_at ? new Date(data.expires_at).toLocaleString() : 'Never'}`);
      } catch (err) {
        console.error(err);
        await message.reply('❌ Failed to verify invite code.');
      }
      return;
    }

    if (subCommand === 'generate') {
      // Check if user has permission (Founder, Admin, Dev, Mod roles)
      const allowedRoles = [
        'Founder', 'Administrator', 'Developer', 'Moderator',
        'Fondateur', 'Administrateur', 'Développeur', 'Modérateur'
      ];
      const hasPermission = message.member?.roles.cache.some(r => 
        allowedRoles.some(allowedName => r.name.includes(allowedName))
      );

      if (!hasPermission) {
        await message.reply('❌ You do not have permission to generate invite codes. Only Founders, Admins, Developers, and Moderators can generate codes.');
        return;
      }

      const prefixInput = parts[2] || 'WHISPRR-BETA-';
      const maxUsesInput = parseInt(parts[3]) || 1;

      try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        for (let i = 0; i < 6; i++) {
          randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const generatedCode = `${prefixInput.trim().toUpperCase()}${randomPart}`;

        const { error } = await supabase
          .from('beta_invites')
          .insert({
            code: generatedCode,
            max_uses: maxUsesInput,
            created_by: null
          });

        if (error) throw error;
        await message.reply(`🔑 Generated new invite code: \`${generatedCode}\` (Max uses: **${maxUsesInput}**)`);
      } catch (err) {
        console.error(err);
        await message.reply('❌ Failed to generate invite code.');
      }
      return;
    }

    await message.reply('❓ Unknown invite command. Use:\n`!invite check CODE`\n`!invite generate PREFIX MAX_USES`');
    return;
  }

  const isMentioned = message.mentions.has(client.user);
  const channelName = message.channel.name || '';
  
  // Determine which agent should handle this
  let agentId = 'oracle';
  let triggerResponse = false;

  // Trigger on mentions anywhere, or on any message in specialized channels
  // Trigger on mentions anywhere, or on any message in specialized channels
  if (
    isMentioned ||
    channelName.includes('bug-reports') ||
    channelName.includes('help') ||
    channelName.includes('ideas') ||
    channelName.includes('feature-requests') ||
    channelName.includes('ai-feedback')
  ) {
    await message.channel.sendTyping();

    const cleanedText = cleanMessage(message.content);

    // Fetch conversation history (last 5 messages)
    const messages = await message.channel.messages.fetch({ limit: 5 });
    const history = [...messages.values()]
      .reverse()
      .filter(m => m.id !== message.id)
      .map(m => ({
        role: m.author.id === client.user.id ? 'assistant' : 'user',
        content: cleanMessage(m.content)
      }));

    const reply = await generateAIResponse(cleanedText, history);

    // Format reply with WHISPRR Guide identity
    const formattedReply = `**💜 WHISPRR Guide**:\n${reply}`;
    await message.reply(formattedReply);
  }
});

client.on('error', (error) => {
  console.error('🤖 WHISPRR Bot Error:', error);
});

client.on('shardError', (error) => {
  console.error('🤖 WHISPRR Bot Shard Error:', error);
});

// Global process exception guards to catch raw WebSocket or network errors leaking from discord.js / ws
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception caught by guard:', err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection caught by guard at:', promise, 'reason:', reason);
});

client.login(DISCORD_BOT_TOKEN);
