// ============================================================
// ORACLE VERITY — TELEGRAM ENGINE v3
// One bot per family member. All bots can share one group chat.
// Each member responds when @mentioned or when their bot is DMed.
// ============================================================

import { useTelegramStore } from '../store/telegram.store';
import { useSettingsStore } from '../store/settings.store';
import { sendToOracle, ChatMessage, parseMultiAgentResponse } from './oracle-engine';
import { setRealActivity } from './activity-engine';
import { generateElevenLabsBuffer } from './audio-engine';
import { detectLanguage } from './language-detector';
import { getMemberById, FAMILY_ROSTER } from './family-roster';

// ── Per-member polling state ────────────────────────────────
type MemberId = string;
const memberIntervals: Record<MemberId, ReturnType<typeof setInterval>> = {};
const memberOffsets: Record<MemberId, number> = {};

// ── Start/Stop ───────────────────────────────────────────────
export function startTelegramPolling() {
  const settings = useSettingsStore.getState();
  const tokens = settings.memberTelegramTokens;

  const uniqueTokens = new Map<string, string>();
  for (const [memberId, token] of Object.entries(tokens)) {
    if (!token) continue;
    if (!uniqueTokens.has(token) || memberId === 'oracle') {
      uniqueTokens.set(token, memberId);
    }
  }

  let anyStarted = false;

  for (const [token, primaryMemberId] of uniqueTokens.entries()) {
    if (memberIntervals[token]) continue;

    if (!memberOffsets[token]) memberOffsets[token] = 0;

    memberIntervals[token] = setInterval(async () => {
      memberOffsets[token] = await pollBotToken(token, primaryMemberId, memberOffsets[token]);
    }, 3000);

    anyStarted = true;
  }

  if (anyStarted) {
    useTelegramStore.getState().setPolling(true);
  }
}

export function stopTelegramPolling() {
  for (const [key, interval] of Object.entries(memberIntervals)) {
    clearInterval(interval);
    delete memberIntervals[key];
  }
  useTelegramStore.getState().setPolling(false);
}

// ── Poll a single bot token ───────────────────────────────
async function pollBotToken(token: string, defaultMemberId: string, lastUpdateId: number): Promise<number> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`
    );
    if (!res.ok) return lastUpdateId;

    const data = await res.json();
    if (!data.ok || !data.result?.length) return lastUpdateId;

    let nextId = lastUpdateId;
    for (const update of data.result) {
      nextId = update.update_id;

      const msg = update.message;
      if (!msg?.text) continue;

      const chatId = msg.chat.id;
      const userName = msg.from?.first_name || msg.from?.username || 'User';
      const text = msg.text;

      const settings = useSettingsStore.getState();
      if (!settings.telegramChatId) {
        settings.setTelegramChatId(chatId.toString());
      }

      const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
      const responderId = resolveResponder(defaultMemberId, text, isGroup);

      // Verify that this responder is configured to use THIS token
      let targetToken = settings.memberTelegramTokens[responderId] || settings.memberTelegramTokens['oracle'];
      if (!targetToken) {
        targetToken = Object.values(settings.memberTelegramTokens).find((t) => !!t) || '';
      }
      
      if (targetToken !== token) {
        continue;
      }

      const lowerText = text.toLowerCase();
      if (
        lowerText.includes('status report') || 
        lowerText.includes('executive board') || 
        lowerText.includes('executive audit') ||
        lowerText.includes('rapport de statut')
      ) {
        if (responderId === 'oracle' && targetToken === token) {
          useTelegramStore.getState().addMessage(chatId, userName, {
            id: msg.message_id,
            chatId,
            senderName: userName,
            text,
            isOracle: responderId === 'oracle',
            timestamp: new Date(msg.date * 1000),
          });
          
          import('./telegram-engine').then(m => {
            m.sendOutboundTelegram('text', 'Initiating full executive board status report across all family members...', 'oracle');
          });
          
          import('./proactive-engine').then(m => {
            m.forceExecutiveAudit();
          });
        }
        continue; // Skip normal LLM processing
      }

      // Add to UI feed exactly once per bot token
      useTelegramStore.getState().addMessage(chatId, userName, {
        id: msg.message_id,
        chatId,
        senderName: userName,
        text,
        isOracle: responderId === 'oracle',
        timestamp: new Date(msg.date * 1000),
      });

      await processMessage(chatId, userName, text, responderId, token);
    }

    return nextId;
  } catch (e) {
    console.error(`[TelegramEngine] Poll error for token ${token.substring(0,6)}...:`, e);
    return lastUpdateId;
  }
}

// ── Determine who should respond ─────────────────────────────
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

  // If in a group chat and no family member is mentioned, default to Oracle
  if (isGroup) {
    return 'oracle';
  }

  return receivingMemberId;
}

// ── Process a message and generate a reply ───────────────────
async function processMessage(
  chatId: number,
  userName: string,
  text: string,
  responderId: string,
  token: string,
) {
  const settings = useSettingsStore.getState();
  const telegramStore = useTelegramStore.getState();
  const companion = getMemberById(responderId) || FAMILY_ROSTER.find(m => m.id === 'oracle')!;

  const chatHistory = telegramStore.chats[chatId]?.messages || [];
  const history: ChatMessage[] = chatHistory.slice(-8).map(m => ({
    role: m.senderName === companion.name ? 'assistant' : 'user',
    content: m.text,
  }));

  const contextualText = `[TELEGRAM MESSAGE FROM ${userName} TO ${companion.name}]: ${text}`;
  setRealActivity(`${companion.name} is typing a Telegram reply...`);

  try {
    const { reply } = await sendToOracle(contextualText, history, {
      groqKey: settings.groqKey || undefined,
      groqUrl: settings.groqUrl || undefined,
      mode: 'developer',
      companionId: responderId,
      lang: detectLanguage(text),
    });

    if (!reply) return;

    // Use parseMultiAgentResponse to break down the reply
    const parsedMessages = parseMultiAgentResponse(reply, responderId);

    // Send each message sequentially using the corresponding bot token
    for (const msgPart of parsedMessages) {
      const partContent = msgPart.content;
      if (!partContent.trim()) continue;

      const voiceMatch = partContent.match(/\[TELEGRAM_VOICE:\s*(.*?)\]/s);
      const isVoice = !!voiceMatch;
      const cleanReply = isVoice ? partContent.replace(voiceMatch![0], '').trim() : partContent;
      
      if (!cleanReply) continue;
      
      const partSenderId = msgPart.senderId;
      const partCompanion = getMemberById(partSenderId) || FAMILY_ROSTER.find(m => m.id === 'oracle')!;
      
      // Determine token for this specific sender
      let partToken = settings.memberTelegramTokens[partSenderId] || settings.memberTelegramTokens['oracle'];
      if (!partToken) {
        partToken = Object.values(settings.memberTelegramTokens).find((t) => !!t) || '';
      }
      
      if (!partToken) {
        console.warn(`[TelegramEngine] Cannot send part from ${partSenderId}: no token found`);
        continue;
      }

      if (isVoice && settings.elevenLabsKey) {
        const voiceId = settings.companionVoices?.[partSenderId] || settings.companionVoices?.['oracle'] || 'EXAVITQu4vr4xnSDxMaL';
        const audioBlob = await generateElevenLabsBuffer(cleanReply, settings.elevenLabsKey, voiceId);
        if (audioBlob) {
          const form = new FormData();
          form.append('chat_id', chatId.toString());
          form.append('voice', audioBlob, 'voice.mp3');
          const vRes = await fetch(`https://api.telegram.org/bot${partToken}/sendVoice`, { method: 'POST', body: form });
          if (vRes.ok) {
            const vData = await vRes.json();
            if (vData.ok && vData.result) {
              telegramStore.addMessage(chatId, partCompanion.name, {
                id: vData.result.message_id,
                chatId,
                senderName: partCompanion.name,
                text: `🎙️ Voice note: ${cleanReply.slice(0, 80)}...`,
                isOracle: partSenderId === 'oracle',
                timestamp: new Date(vData.result.date * 1000),
              });
            }
            await new Promise(r => setTimeout(r, 500));
            continue; // Go to next message part
          }
        }
      }

      const sendRes = await fetch(`https://api.telegram.org/bot${partToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: cleanReply }),
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        if (sendData.ok && sendData.result) {
          telegramStore.addMessage(chatId, partCompanion.name, {
            id: sendData.result.message_id,
            chatId,
            senderName: partCompanion.name,
            text: cleanReply,
            isOracle: partSenderId === 'oracle',
            timestamp: new Date(sendData.result.date * 1000),
          });
        }
      }
      
      // Delay slightly between messages so they appear in correct order naturally
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (e) {
    console.error(`[TelegramEngine] ${companion.name} failed to reply:`, e);
  }
}

// ── Outbound: proactively send a message from any member ──────
export async function sendOutboundTelegram(
  type: 'text' | 'voice',
  message: string,
  companionId: string = 'oracle',
) {
  const settings = useSettingsStore.getState();
  let token = settings.memberTelegramTokens[companionId] || settings.memberTelegramTokens['oracle'];
  
  if (!token) {
    token = Object.values(settings.memberTelegramTokens).find((t) => !!t) || '';
  }

  const chatId = settings.telegramChatId;

  if (!token || !chatId) {
    console.warn(`[TelegramEngine] Cannot send from ${companionId}: missing token or chatId`);
    return;
  }

  try {
    if (type === 'text') {
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
      if (sendRes.ok) {
        const sendData = await sendRes.json();
        if (sendData.ok && sendData.result) {
          const companion = getMemberById(companionId) || FAMILY_ROSTER.find(m => m.id === 'oracle')!;
          useTelegramStore.getState().addMessage(Number(chatId), companion.name, {
            id: sendData.result.message_id,
            chatId: Number(chatId),
            senderName: companion.name,
            text: message,
            isOracle: companionId === 'oracle',
            timestamp: new Date(sendData.result.date * 1000),
          });
        }
      }
      setRealActivity(`${companionId} sent Telegram message`);
    } else if (type === 'voice') {
      const voiceId = settings.companionVoices?.[companionId] || 'EXAVITQu4vr4xnSDxMaL';
      const audioBlob = await generateElevenLabsBuffer(message, settings.elevenLabsKey, voiceId);
      if (!audioBlob) return;
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('voice', audioBlob, 'voice.mp3');
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, { method: 'POST', body: form });
      if (sendRes.ok) {
        const sendData = await sendRes.json();
        if (sendData.ok && sendData.result) {
          const companion = getMemberById(companionId) || FAMILY_ROSTER.find(m => m.id === 'oracle')!;
          useTelegramStore.getState().addMessage(Number(chatId), companion.name, {
            id: sendData.result.message_id,
            chatId: Number(chatId),
            senderName: companion.name,
            text: `🎙️ Voice note: ${message.slice(0, 80)}...`,
            isOracle: companionId === 'oracle',
            timestamp: new Date(sendData.result.date * 1000),
          });
        }
      }
      setRealActivity(`${companionId} sent voice note`);
    }
  } catch (e) {
    console.error(`[TelegramEngine] Outbound error from ${companionId}:`, e);
  }
}
