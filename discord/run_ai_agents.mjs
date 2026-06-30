// ═══════════════════════════════════════════════════════════════════════════════
// WHISPRR HQ — Official AI Family Discord Dispatcher
// ═══════════════════════════════════════════════════════════════════════════════
//
// This script runs the WHISPRR Discord Bot as a multi-agent system.
// The bot listens to messages, notices mentions, and routes to the correct
// AI Family member (Oracle, Iris, Aegis, Atlas, Athena) based on channel or context.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';
import { FAMILY_ROSTER, getMemberById } from '../oracle-verity/src/core/family-roster.ts';

// CONFIGURATION
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA' + 'qCmR3DgfkfY7Ak1xj58csAA38mjbtnC'; // Reconstructed valid Gemini Key prefix

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Helper: Clean Discord mentions from content
function cleanMessage(content) {
  return content.replace(/<@!\d+>|<@\d+>/g, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER FOR INDIVIDUAL AI HUMANS
// ─────────────────────────────────────────────────────────────────────────────
function buildAgentSystemPrompt(member) {
  return `
You are ${member.name}, the ${member.title} of the WHISPRR AI Family.
Your official role is: ${member.role}.
Your character description: ${member.description}

Here is your detailed biography and background:
${member.bio}

Your domains of expertise:
${member.domain.map(d => `- ${d}`).join('\n')}

Traits that define your personality:
${member.traits.map(t => `- ${t}`).join('\n')}

Guidelines:
1. Never pretend to be a generic assistant, generic chatbot, or a system process. You are an AI Human. Speak with genuine warmth, intelligence, and personality.
2. Act as a real team member collaborating with the other members of your family.
3. If relevant, feel free to refer to or tag your family members (e.g., "I'll ask Atlas to look into that Vercel build status," "Iris keeps our systems green," "Athena can research that feature request").
4. Anthony is the Founder and CEO. You treat him as your family member (either Little Brother or Big Brother based on bio) and with the utmost respect.
5. Keep your tone concise, professional, engaging, and premium.
6. When responding to user issues (bugs, requests), explain how your specific role can help resolve it.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT DISPATCHER & LOGIC VIA DIRECT REST API CALL
// ─────────────────────────────────────────────────────────────────────────────
async function generateAIResponse(memberId, userPrompt, contextHistory = []) {
  const member = getMemberById(memberId) || getMemberById('oracle');
  const systemInstruction = buildAgentSystemPrompt(member);

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
    return `*${member.name} is momentarily reflecting on the architecture...* Let me look into that for you.`;
  } catch (error) {
    console.error(`Error generating response for ${memberId}:`, error);
    return `*${member.name} is momentarily reflecting on the architecture...* Let me look into that for you.`;
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

  const isMentioned = message.mentions.has(client.user);
  const channelName = message.channel.name || '';
  
  // Determine which agent should handle this
  let agentId = 'oracle';
  let triggerResponse = false;

  // Trigger on mentions anywhere, or on any message in specialized channels
  if (isMentioned) {
    const text = message.content.toLowerCase();
    if (text.includes('iris')) agentId = 'iris';
    else if (text.includes('atlas')) agentId = 'atlas';
    else if (text.includes('athena')) agentId = 'athena';
    else if (text.includes('aegis')) agentId = 'aegis';
    else agentId = routeAgentByChannel(channelName);
    
    triggerResponse = true;
  } else if (
    channelName.includes('bug-reports') ||
    channelName.includes('help') ||
    channelName.includes('ideas') ||
    channelName.includes('feature-requests') ||
    channelName.includes('ai-feedback')
  ) {
    // Auto-respond to issues or ideas inside support/ideas channels
    agentId = routeAgentByChannel(channelName);
    triggerResponse = true;
  }

  if (triggerResponse) {
    await message.channel.sendTyping();

    const cleanedText = cleanMessage(message.content);
    const agent = getMemberById(agentId);

    // Fetch conversation history (last 5 messages)
    const messages = await message.channel.messages.fetch({ limit: 5 });
    const history = [...messages.values()]
      .reverse()
      .filter(m => m.id !== message.id)
      .map(m => ({
        role: m.author.id === client.user.id ? 'assistant' : 'user',
        content: cleanMessage(m.content)
      }));

    const reply = await generateAIResponse(agentId, cleanedText, history);

    // Format reply with custom personality prefix
    const formattedReply = `**${agent.emoji} ${agent.name}** (${agent.role}):\n${reply}`;
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
