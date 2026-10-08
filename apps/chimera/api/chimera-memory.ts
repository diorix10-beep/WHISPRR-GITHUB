import {
  authenticate,
  jsonResponse,
  providerFetch,
  readPayload,
  requestFailure,
  RequestError,
  uuid,
} from './_lib/requestProtection.js';
import { requireAdultContentAccess } from './_lib/adultContentGate.js';
import {
  EXTRACTION_SCHEMA,
  buildExcerpt,
  buildExtractionPrompt,
  parseExtraction,
  selectWindowMessages,
  MAX_WINDOW_MESSAGES,
  type WindowMessage,
} from './_lib/memory.js';

export const config = { runtime: 'edge' };

const MEMORY_MODEL = 'gemini-2.5-flash';

interface Window {
  from: string | null;
  to: string;
  persona_id: string | null;
}

/**
 * Looks at the newest part of a scene and PROPOSES a few long-term memories. Nothing it writes is used
 * by the character until the player approves it in the Memory panel.
 *
 * Cheap to call: unless the player has written at least 8 new messages since the last look (and has
 * fewer than 10 suggestions waiting, and has not switched suggestions off), the database hands out
 * no window and this returns at once without calling the model.
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let release: (() => Promise<void>) | undefined;
  try {
    const { supabase, user } = await authenticate(req);
    const payload = await readPayload(req);
    const conversationId = payload.conversation_id;
    const botId = payload.bot_user_id;
    if (!uuid(conversationId) || !uuid(botId)) throw new RequestError(400, 'Missing conversation or character.');

    const geminiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new RequestError(503, 'The CHIMERA story engine is not configured yet.');

    const { data: membership, error: membershipError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipError || !membership) throw new RequestError(403, 'You do not have access to this roleplay.');

    const [conversationResult, characterResult, botMemberResult, identityResult, profileResult] = await Promise.all([
      supabase.from('conversations').select('type').eq('id', conversationId).maybeSingle(),
      supabase.from('ai_characters').select('id, chat_name, content_rating').eq('user_id', botId).maybeSingle(),
      supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversationId).eq('user_id', botId).maybeSingle(),
      supabase.from('profiles').select('role').eq('user_id', botId).maybeSingle(),
      supabase.from('profiles').select('display_name').eq('user_id', botId).maybeSingle(),
    ]);
    const character = characterResult.data as { id: string; chat_name: string | null; content_rating: string | null } | null;
    if (conversationResult.error || conversationResult.data?.type !== 'dm') throw new RequestError(404, 'This scene is unavailable.');
    if (characterResult.error || !character) throw new RequestError(404, 'This character is unavailable.');
    if (botMemberResult.error || !botMemberResult.data || identityResult.data?.role !== 'ai_character') {
      throw new RequestError(403, 'This character is not part of your roleplay.');
    }
    // Same rule as the chat itself: Mature / NSFW scenes need a verified adult who opted in.
    await requireAdultContentAccess(supabase, character.content_rating);

    const { data: claimed, error: claimError } = await supabase.rpc('claim_chimera_memory_window', { p_conversation_id: conversationId });
    if (claimError) throw new RequestError(503, 'Memory suggestions are not available right now.');
    const window = claimed as Window | null;
    if (!window) return jsonResponse({ proposed: 0 });
    release = async () => {
      await supabase
        .rpc('release_chimera_memory_window', { p_conversation_id: conversationId, p_claimed: window.to, p_previous: window.from })
        .then(() => undefined, () => undefined);
    };

    const botName = character.chat_name?.trim() || profileResult.data?.display_name || 'the character';
    let playerName = 'Player';
    if (window.persona_id) {
      const { data: persona } = await supabase.from('personas').select('name').eq('id', window.persona_id).eq('user_id', user.id).maybeSingle();
      if (persona?.name) playerName = persona.name;
    }

    let messageQuery = supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .lte('created_at', window.to)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MAX_WINDOW_MESSAGES + 1);
    if (window.from) messageQuery = messageQuery.gt('created_at', window.from);
    messageQuery = window.persona_id ? messageQuery.eq('persona_id', window.persona_id) : messageQuery.is('persona_id', null);
    const { data: rawMessages, error: messagesError } = await messageQuery;
    if (messagesError) throw new RequestError(500, 'The conversation could not be loaded.');
    const { messages, omittedReply } = selectWindowMessages(((rawMessages ?? []) as WindowMessage[]).reverse(), botId);
    if (messages.length === 0) return jsonResponse({ proposed: 0 });

    let knownQuery = supabase
      .from('character_memories')
      .select('content')
      .eq('user_id', user.id)
      .eq('character_id', character.id)
      .is('session_id', null)
      .or(`conversation_id.eq.${conversationId},conversation_id.is.null`)
      .order('updated_at', { ascending: false })
      .limit(40);
    knownQuery = window.persona_id ? knownQuery.eq('persona_id', window.persona_id) : knownQuery.is('persona_id', null);
    const { data: knownRows } = await knownQuery;
    const known = ((knownRows ?? []) as Array<{ content: string }>).map((row) => row.content).filter((text) => typeof text === 'string');

    const excerpt = buildExcerpt(messages, { botId, botName, playerName });
    const geminiResponse = await providerFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MEMORY_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildExtractionPrompt(known, { botName, playerName }) }] },
          contents: [{ role: 'user', parts: [{ text: `Excerpt:\n${excerpt.text}` }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            responseSchema: EXTRACTION_SCHEMA,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    if (!geminiResponse.ok) throw new RequestError(502, 'Memory suggestions are temporarily unavailable.');
    const geminiData = await geminiResponse.json();
    const parts: Array<{ text?: string }> = geminiData.candidates?.[0]?.content?.parts ?? [];
    const candidates = parseExtraction(parts.map((part) => part.text ?? '').join(''), excerpt.ids, known);

    let proposed = 0;
    for (const candidate of candidates) {
      const { error } = await supabase.rpc('propose_chimera_memory', {
        p_conversation_id: conversationId,
        p_character_id: character.id,
        p_content: candidate.fact,
        p_source_ids: candidate.sourceIds,
        p_memory_type: candidate.type,
      });
      if (!error) proposed += 1;
    }
    // Every suggestion failed to save (a database hiccup): give the window back so it is looked at again.
    // Some saved and some did not: keep it read, the next look skips what is already there.
    if (candidates.length > 0 && proposed === 0) {
      throw new RequestError(503, 'Memory suggestions could not be saved. They will be tried again.');
    }

    // The window counts as read, even if the model had nothing to suggest. The newest reply was left
    // out of the excerpt (it can still be regenerated), so move the cursor back to just before it: the
    // next look then starts with that reply instead of skipping it for good.
    release = undefined;
    const resume = omittedReply ? messages[messages.length - 1]?.created_at : undefined;
    if (omittedReply && resume) {
      await supabase
        .rpc('release_chimera_memory_window', { p_conversation_id: conversationId, p_claimed: window.to, p_previous: resume })
        .then(() => undefined, () => undefined);
    }
    return jsonResponse({ proposed });
  } catch (error) {
    // Reading the window failed before anything was proposed: give the messages back for next time.
    if (release) await release();
    return requestFailure(error);
  }
}
