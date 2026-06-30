import { createClient } from '@supabase/supabase-js';
import { buildCompanionPrompt } from '../src/core/persona';
import { FAMILY_ROSTER } from '../src/core/family-roster';
import { detectLanguage } from '../src/core/language-detector';

export const config = {
  runtime: 'edge',
};

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Bot Token Helper ──────────────────────────────────────────
function getBotToken(companionId: string): string {
  const envName = `VITE_TELEGRAM_TOKEN_${companionId.toUpperCase()}`;
  let token = process.env[envName];

  // Try fallbacks
  if (!token) {
    token = process.env.VITE_TELEGRAM_TOKEN_ORACLE || process.env.VITE_TELEGRAM_TOKEN;
  }

  return token || '';
}

// ── Database Helpers ─────────────────────────────────────────
async function getOrCreateSession(companionId: string, chatId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('companion_id', companionId)
      .eq('chat_id', chatId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data.id;

    const { data: newSession, error: createError } = await supabase
      .from('chat_sessions')
      .insert({
        companion_id: companionId,
        chat_id: chatId,
        user_id: 'anthony'
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newSession?.id || null;
  } catch (e) {
    console.error('[Supabase Webhook] getOrCreateSession error:', e);
    return null;
  }
}

async function dbLoadHistory(companionId: string, chatId: string): Promise<any[]> {
  try {
    const sessionId = await getOrCreateSession(companionId, chatId);
    if (!sessionId) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(8);

    if (error) throw error;

    return data.map(m => ({
      role: m.role,
      content: m.content,
    }));
  } catch (e) {
    console.error('[Supabase Webhook] dbLoadHistory failed:', e);
    return [];
  }
}

async function dbAddMessage(companionId: string, chatId: string, role: string, content: string, senderId?: string) {
  try {
    const sessionId = await getOrCreateSession(companionId, chatId);
    if (!sessionId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        sender_id: senderId || (role === 'user' ? 'user' : companionId),
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase Webhook] dbAddMessage failed:', e);
  }
}

// ── Utility Helpers ──────────────────────────────────────────
function resolveResponder(receivingMemberId: string, text: string, isGroup: boolean): string {
  const lower = text.toLowerCase();
  for (const member of FAMILY_ROSTER) {
    const nameLower = member.name.toLowerCase();
    if (
      lower.includes(`@${nameLower}`) ||
      lower.startsWith(nameLower) ||
      lower.includes(` ${nameLower} `) ||
      lower.includes(` ${nameLower},`) ||
      lower.includes(` ${nameLower}!`) ||
      lower.includes(` ${nameLower}?`)
    ) {
      return member.id;
    }
  }

  if (isGroup) {
    return 'oracle';
  }

  return receivingMemberId;
}

interface ParsedMessage {
  senderId: string;
  content: string;
}

function parseMultiAgentResponse(text: string, defaultId: string): ParsedMessage[] {
  const regex = /\[SENDER:\s*(\w+)\]/g;
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return [{ senderId: defaultId, content: text.trim() }];
  }

  const results: ParsedMessage[] = [];
  let lastIndex = 0;
  let currentSender = defaultId;

  for (const match of matches) {
    const matchIndex = match.index!;
    const contentBefore = text.substring(lastIndex, matchIndex).trim();
    if (contentBefore) {
      results.push({ senderId: currentSender, content: contentBefore });
    }

    currentSender = match[1].toLowerCase();
    lastIndex = matchIndex + match[0].length;
  }

  const contentAfter = text.substring(lastIndex).trim();
  if (contentAfter) {
    results.push({ senderId: currentSender, content: contentAfter });
  }

  return results;
}

// ── Webhook Handler ──────────────────────────────────────────
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const defaultBot = url.searchParams.get('bot') || 'oracle';

  try {
    const update = await req.json();
    const msg = update.message;

    // Ignore non-text messages
    if (!msg || !msg.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = msg.chat.id;
    const text = msg.text;
    const userName = msg.from?.first_name || msg.from?.username || 'User';
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

    const responderId = resolveResponder(defaultBot, text, isGroup);
    const dbChatId = `telegram-${chatId}`;

    // Get Groq credentials
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_KEY;
    if (!groqKey) {
      console.error('[Supabase Webhook] Missing Groq API Key environment variable.');
      return new Response('Groq API Key not configured', { status: 500 });
    }

    // 1. Save user's message to Supabase
    await dbAddMessage(responderId, dbChatId, 'user', text, 'user');

    // 2. Load context history
    const history = await dbLoadHistory(responderId, dbChatId);

    // 3. Detect language and build prompts
    const lang = detectLanguage(text);
    const systemPrompt = buildCompanionPrompt(responderId, lang);

    // 4. Call Groq
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: `[TELEGRAM MESSAGE FROM ${userName}]: ${text}` }
    ];

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.75,
        max_tokens: 1500
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq HTTP error: ${groqResponse.status} - ${errText}`);
    }

    const groqData = await groqResponse.json();
    const replyText = groqData.choices?.[0]?.message?.content || '';

    if (!replyText.trim()) {
      return new Response('OK', { status: 200 });
    }

    // 5. Parse multi-agent replies
    const parsedReplies = parseMultiAgentResponse(replyText, responderId);

    // 6. Send each reply to Telegram and save to DB
    for (const part of parsedReplies) {
      const companion = FAMILY_ROSTER.find(m => m.id === part.senderId) || FAMILY_ROSTER.find(m => m.id === 'oracle')!;
      
      // Strip any voice tags if present
      const cleanText = part.content
        .replace(/\[TELEGRAM_VOICE:\s*(.*?)\]/gs, '$1')
        .trim();

      if (!cleanText) continue;

      const botToken = getBotToken(part.senderId);
      if (!botToken) {
        console.warn(`[Telegram Webhook] Token missing for bot ${part.senderId}`);
        continue;
      }

      // Send to Telegram
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: cleanText
        })
      });

      if (tgRes.ok) {
        // Save reply back to Supabase
        await dbAddMessage(part.senderId, dbChatId, 'assistant', cleanText, part.senderId);
      } else {
        const tgErr = await tgRes.text();
        console.error(`[Telegram Webhook] Failed to send message via bot ${part.senderId}:`, tgErr);
      }

      // Delay slightly between messages
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Telegram Webhook] Handler error:', error.message || error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
