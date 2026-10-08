import {
  authenticate,
  fingerprint,
  finishRequest,
  jsonResponse,
  providerFetch,
  readPayload,
  requestFailure,
  RequestError,
  reserveRequest,
  serverClient,
  uuid,
} from './_lib/requestProtection.js';
import { requireAdultContentAccess } from './_lib/adultContentGate.js';
import {
  buildSystemPrompt,
  cleanReply,
  selectRecentHistory,
  type BotProfile,
  type CharacterData,
  type ChatMessage,
  type PersonaData,
} from './_lib/roleplayPrompt.js';

export const config = { runtime: 'edge' };

const CHAT_MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_CHARACTERS = 100_000;

interface MessageRow extends ChatMessage {
  id: string;
  persona_id: string | null;
}

interface GeminiTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let admin: ReturnType<typeof serverClient> | undefined;
  let reservation: Awaited<ReturnType<typeof reserveRequest>> | undefined;
  let completed = false;
  try {
    const { supabase, user } = await authenticate(req);
    const payload = await readPayload(req);
    const conversationId = payload.conversation_id;
    const botId = payload.bot_user_id;
    const isInitiation = payload.is_initiation === true;
    const isSwipe = payload.is_swipe === true;
    const targetMessageId = payload.target_message_id;
    const expectedContent = payload.expected_content;

    if (!uuid(conversationId) || !uuid(botId)) throw new RequestError(400, 'Missing conversation or character.');
    if (isInitiation && isSwipe) throw new RequestError(400, 'Choose one action at a time.');
    if (isSwipe) {
      if (typeof expectedContent !== 'string' || expectedContent.length > 32_000) {
        throw new RequestError(400, 'The original response is required for safe regeneration.');
      }
      if (!uuid(targetMessageId)) throw new RequestError(400, 'Choose the response to regenerate.');
    }
    const retryId = req.headers.get('Idempotency-Key');
    if (isSwipe && !retryId) throw new RequestError(400, 'A retry identifier is required for regeneration.');

    const geminiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new RequestError(503, 'The CHIMERA story engine is not configured yet.');

    // Check membership before any model call: RLS protects the reads below too,
    // but this stops a direct API call from spending capacity on someone else's scene.
    const { data: membership, error: membershipError } = await supabase
      .from('conversation_participants')
      .select('user_id, persona_id, persona_selected')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipError || !membership) throw new RequestError(403, 'You do not have access to this roleplay.');

    const [conversationResult, characterResult, botMemberResult, identityResult, profileResult] = await Promise.all([
      supabase.from('conversations').select('type, memory_summary').eq('id', conversationId).maybeSingle(),
      supabase.from('ai_characters').select('*').eq('user_id', botId).maybeSingle(),
      supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversationId).eq('user_id', botId).maybeSingle(),
      supabase.from('profiles').select('role').eq('user_id', botId).maybeSingle(),
      supabase.from('profiles').select('display_name, username').eq('user_id', botId).maybeSingle(),
    ]);
    const conversation = conversationResult.data;
    const character = characterResult.data as (CharacterData & { id: string }) | null;
    if (conversationResult.error || !conversation) throw new RequestError(404, 'This scene is unavailable.');
    if (conversation.type !== 'dm') throw new RequestError(400, 'Group scenes are not available yet.');
    if (characterResult.error || !character) throw new RequestError(404, 'This character is unavailable.');
    if (botMemberResult.error || !botMemberResult.data || identityResult.data?.role !== 'ai_character') {
      throw new RequestError(403, 'This character is not part of your roleplay.');
    }
    if (profileResult.error || !profileResult.data) throw new RequestError(404, 'This character is unavailable.');
    const botProfile = profileResult.data as BotProfile;

    // Mature / NSFW characters need a verified adult who opted in. Fails closed.
    await requireAdultContentAccess(supabase, character.content_rating);

    // Same rule the database uses to pick the scene persona.
    let persona: (PersonaData & { id: string }) | null = null;
    if (!(membership.persona_selected && !membership.persona_id)) {
      let personaQuery = supabase
        .from('personas')
        .select('id, name, description, gender, age, pronouns, personality, appearance, backstory, occupation')
        .eq('user_id', user.id);
      personaQuery = membership.persona_id ? personaQuery.eq('id', membership.persona_id) : personaQuery.eq('is_default', true);
      const { data: personaRow } = await personaQuery.maybeSingle();
      persona = (personaRow as (PersonaData & { id: string }) | null) ?? null;
    }
    const personaId = persona?.id ?? null;

    let historyQuery = supabase
      .from('messages')
      .select('id, sender_id, content, persona_id')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(80);
    historyQuery = personaId ? historyQuery.eq('persona_id', personaId) : historyQuery.is('persona_id', null);
    const { data: rawMessages, error: messagesError } = await historyQuery;
    if (messagesError) throw new RequestError(500, 'The conversation could not be loaded.');
    const newestFirst = (rawMessages ?? []) as MessageRow[];

    const targetMessage = isSwipe ? newestFirst.find((m) => m.id === targetMessageId && m.sender_id === botId) : null;
    if (isSwipe && !targetMessage) throw new RequestError(409, 'That response is unavailable. Refresh before regenerating.');
    if (isSwipe && newestFirst[0]?.id !== targetMessageId) {
      throw new RequestError(409, 'Only the latest response can be regenerated.');
    }
    const chronological = newestFirst
      .filter((m) => m.content?.trim() && (!isSwipe || m.id !== targetMessageId))
      .reverse();
    if (isInitiation && chronological.length > 0) throw new RequestError(409, 'This scene has already begun.');

    const history = selectRecentHistory(chronological);
    const playerLabel = persona?.name || 'Player';
    const contents: GeminiTurn[] = history.map((m) => ({
      role: m.sender_id === botId ? 'model' : 'user',
      parts: [{ text: m.sender_id === botId ? m.content : `[${playerLabel}] ${m.content}` }],
    }));
    if (isInitiation) {
      contents.push({
        role: 'user',
        parts: [{
          text: character.greeting?.trim()
            ? `[The scene is just starting. Open it in character. Your opening: "${character.greeting}"]`
            : '[The scene is just starting. Open it in character and set the scene.]',
        }],
      });
    } else if (contents[0]?.role === 'model') {
      // The model requires the first turn to come from the player.
      contents.unshift({ role: 'user', parts: [{ text: '[The scene begins.]' }] });
    }
    if (contents.length === 0) throw new RequestError(409, 'There is nothing to answer yet.');

    const systemPrompt = buildSystemPrompt(character, botProfile, persona, conversation.memory_summary);
    const promptSize = systemPrompt.length + contents.reduce((size, turn) => size + turn.parts[0].text.length, 0);
    if (promptSize > MAX_PROMPT_CHARACTERS) throw new RequestError(413, 'This character context is too large to generate safely.');

    const latestPlayerMessage = [...chronological].reverse().find((m) => m.sender_id !== botId);
    const turn = isInitiation
      ? `opening:${personaId || 'self'}`
      : isSwipe
        ? `swipe:${targetMessageId}:${retryId}`
        : `turn:${latestPlayerMessage?.id || 'empty'}:${personaId || 'self'}`;

    admin = serverClient();
    reservation = await reserveRequest(
      admin,
      user.id,
      'chat',
      `${conversationId}:${botId}`,
      turn,
      await fingerprint({
        conversation_id: conversationId,
        bot_user_id: botId,
        turn,
        model: CHAT_MODEL,
        persona_id: personaId,
        expected: isSwipe ? expectedContent : undefined,
      }),
    );
    if (reservation.state === 'completed') {
      completed = true;
      return jsonResponse(reservation.result);
    }

    if (isSwipe && targetMessage!.content !== expectedContent) {
      throw new RequestError(409, 'The response changed. Refresh before requesting a new variation.');
    }
    if (!isInitiation && !isSwipe && (!latestPlayerMessage || newestFirst[0]?.sender_id === botId)) {
      throw new RequestError(409, 'There is nothing new to answer yet.');
    }

    const { error: scopeError } = await admin.rpc('bind_chimera_persona_request', {
      p_request_id: reservation.id,
      p_lease: reservation.lease,
      p_persona_id: personaId,
    });
    if (scopeError) throw new RequestError(409, 'Your persona changed. Please retry in the current scene.');

    const geminiResponse = await providerFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens: 2048 },
        }),
      },
    );
    if (!geminiResponse.ok) throw new RequestError(502, 'The character provider is temporarily unavailable.');
    const geminiData = await geminiResponse.json();
    const parts: Array<{ text?: string }> = geminiData.candidates?.[0]?.content?.parts ?? [];
    const reply = cleanReply(parts.map((part) => part.text ?? '').join(''));
    if (!reply) throw new RequestError(502, 'The character could not answer this time. Please try again.');

    const { error: completeError } = isSwipe
      ? await admin.rpc('complete_chimera_regeneration', {
          p_request_id: reservation.id,
          p_lease: reservation.lease,
          p_conversation_id: conversationId,
          p_bot_id: botId,
          p_message_id: targetMessageId,
          p_expected_content: expectedContent,
          p_content: reply,
        })
      : await admin.rpc('complete_chimera_chat_request', {
          p_request_id: reservation.id,
          p_lease: reservation.lease,
          p_conversation_id: conversationId,
          p_bot_id: botId,
          p_content: reply,
        });
    if (completeError) {
      throw new RequestError(500, 'Your message is saved, but the reply could not be confirmed. Please retry.');
    }

    completed = true;
    return jsonResponse({ reply });
  } catch (error) {
    return requestFailure(error);
  } finally {
    if (admin && reservation?.state === 'reserved' && !completed) {
      await finishRequest(admin, reservation.id, reservation.lease, null, true).catch(() => undefined);
    }
  }
}
