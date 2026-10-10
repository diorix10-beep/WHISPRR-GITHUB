import {
  authenticate,
  fingerprint,
  finishRequest,
  jsonResponse,
  readPayload,
  requestFailure,
  RequestError,
  reserveRequest,
  serverClient,
  uuid,
} from './_lib/requestProtection.js';
import { pickRecalledMemories, type RecalledMemory } from './_lib/memory.js';
import { cleanOpenings, openingUsed } from './_lib/openings.js';
import { LOREBOOK_BUDGET_CHARACTERS, LOREBOOK_MAX_ENTRIES_READ, LOREBOOK_READ_PAGE, lorebookBlock, selectLorebookEntries, validBudget, validDepth, type LorebookEntry } from './_lib/lorebook.js';
import { generateReply, providerKeys } from './_lib/modelProviders.js';
import { resolveModel } from '../src/lib/chatModels.js';
import { chargeForReply, refundUndeliveredReply } from './_lib/replyBilling.js';
import { isAdultRating, requireAdultContentAccess } from './_lib/adultContentGate.js';
import {
  buildSystemPrompt,
  cleanReply,
  maxOutputTokensFor,
  normalizeResponseLength,
  personaAgeIsUnder18,
  selectRecentHistory,
  type PinnedLine,
  type SceneSettings,
  type BotProfile,
  type CharacterData,
  type ChatMessage,
  type PersonaData,
} from './_lib/roleplayPrompt.js';

export const config = { runtime: 'edge' };

const MAX_PROMPT_CHARACTERS = 100_000;
/** How many approved memories are read before they are sorted by certainty and cut to what the prompt can carry (the app keeps at most 100). */
const MAX_MEMORIES_READ = 100;

interface MessageRow extends ChatMessage {
  id: string;
  persona_id: string | null;
}

interface GeminiTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * The player's own choices for this scene (reply length, words to avoid, pinned messages).
 * Optional by design: if they cannot be read the character still answers with the defaults.
 */
async function loadSceneSettings(input: {
  supabase: Awaited<ReturnType<typeof authenticate>>['supabase'];
  userId: string;
  conversationId: string;
  personaId: string | null;
  botId: string;
  botName: string;
  playerName: string;
  inWindow: Set<string>;
}): Promise<SceneSettings> {
  try {
    const { data, error } = await input.supabase
      .from('chimera_scene_settings')
      .select('response_length, banned_words, pinned_message_ids')
      .eq('conversation_id', input.conversationId)
      .eq('user_id', input.userId)
      .maybeSingle();
    if (error || !data) return {};
    const settings: SceneSettings = {
      responseLength: normalizeResponseLength(data.response_length),
      bannedWords: typeof data.banned_words === 'string' ? data.banned_words : '',
    };
    const ids = (Array.isArray(data.pinned_message_ids) ? data.pinned_message_ids : [])
      .filter((id: unknown): id is string => uuid(id))
      .filter((id: string) => !input.inWindow.has(id));
    if (ids.length > 0) {
      // Same persona scope as the history, so a pin never carries another persona's story into this one.
      let pinQuery = input.supabase
        .from('messages')
        .select('id, sender_id, content')
        .eq('conversation_id', input.conversationId)
        .is('deleted_at', null)
        .in('id', ids)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
      pinQuery = input.personaId ? pinQuery.eq('persona_id', input.personaId) : pinQuery.is('persona_id', null);
      const { data: rows } = await pinQuery;
      settings.pinned = ((rows ?? []) as Array<{ sender_id: string; content: string }>).map(
        (row): PinnedLine => ({ speaker: row.sender_id === input.botId ? input.botName : input.playerName, content: row.content }),
      );
    }
    return settings;
  } catch {
    return {};
  }
}

/**
 * The world the player described for this scene (genre, technology, how people reach each other, calendar, customs).
 * Read on its own, apart from the other settings, so that a database without the column yet (or a failed read) only
 * loses these rules and never the reply length, word list or pins.
 */
async function loadUniverseRules(input: {
  supabase: Awaited<ReturnType<typeof authenticate>>['supabase'];
  userId: string;
  conversationId: string;
}): Promise<unknown> {
  try {
    const { data, error } = await input.supabase
      .from('chimera_scene_settings')
      .select('universe_rules')
      .eq('conversation_id', input.conversationId)
      .eq('user_id', input.userId)
      .maybeSingle();
    return error || !data ? null : data.universe_rules;
  } catch {
    return null;
  }
}

/**
 * Facts the player approved as long-term memory for this character and persona: the ones tied to this
 * scene and the ones kept for every scene. Optional: if they cannot be read the character still answers.
 *
 * Two rules about what the character may be told:
 *  - a memory the player marked "only me" is never read here (the character does not know it);
 *  - confirmed memories are picked first, then temporary ones, then assumptions, so a pile of rumours cannot push out facts.
 * Rows are read with `*` and filtered here, not in the query: a database that does not have the new columns yet must still
 * give the character every memory it had before (they all count as confirmed and known).
 */
async function loadApprovedMemories(input: {
  supabase: Awaited<ReturnType<typeof authenticate>>['supabase'];
  userId: string;
  conversationId: string;
  characterId: string;
  personaId: string | null;
}): Promise<RecalledMemory[]> {
  try {
    let query = input.supabase
      .from('character_memories')
      .select('*')
      .eq('user_id', input.userId)
      .eq('character_id', input.characterId)
      .eq('approval_status', 'approved')
      .is('session_id', null)
      .or(`conversation_id.eq.${input.conversationId},conversation_id.is.null`)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(MAX_MEMORIES_READ);
    query = input.personaId ? query.eq('persona_id', input.personaId) : query.is('persona_id', null);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];
    return pickRecalledMemories(data);
  } catch {
    return [];
  }
}

/**
 * The creator's lorebook entries for this character, with how many messages each lorebook searches. Only lorebooks owned
 * by the character's creator and linked to it are read (with the server key, so a private lorebook still works for the
 * people who chat with the character). Optional: if anything fails the character still answers, without a lorebook.
 */
async function loadLorebookEntries(
  characterId: string,
  creatorId: string | null,
): Promise<{ entries: LorebookEntry[]; bookDepths: Map<string, number>; budget: number }> {
  const none = { entries: [] as LorebookEntry[], bookDepths: new Map<string, number>(), budget: LOREBOOK_BUDGET_CHARACTERS };
  if (!creatorId) return none;
  try {
    const reader = serverClient();
    const { data: links, error: linkError } = await reader.from('lorebook_characters').select('lorebook_id').eq('character_id', characterId);
    if (linkError || !Array.isArray(links) || links.length === 0) return none;
    // All columns, so a lorebook without a depth of its own (before it existed) simply uses the default.
    const { data: books, error: bookError } = await reader
      .from('lorebooks')
      .select('*')
      .in('id', links.map((link: { lorebook_id: string }) => link.lorebook_id))
      .eq('user_id', creatorId);
    if (bookError || !Array.isArray(books) || books.length === 0) return none;
    const bookIds = books.map((book: { id: string }) => book.id);
    const bookDepths = new Map<string, number>();
    // How much lorebook text one reply may carry: the largest size asked for by the character's lorebooks (the default if none asks).
    let budget = LOREBOOK_BUDGET_CHARACTERS;
    let asked = false;
    for (const book of books as Array<{ id: string; scan_depth?: unknown; reply_budget?: unknown }>) {
      const depth = validDepth(book.scan_depth);
      if (depth) bookDepths.set(book.id, depth);
      const size = validBudget(book.reply_budget);
      if (size && (!asked || size > budget)) {
        budget = size;
        asked = true;
      }
    }
    // Read page by page, highest priority first, so a very large lorebook is cut from the bottom, never at random.
    const entries: LorebookEntry[] = [];
    for (let from = 0; from < LOREBOOK_MAX_ENTRIES_READ; from += LOREBOOK_READ_PAGE) {
      const { data, error } = await reader
        .from('lorebook_entries')
        .select('*')
        .in('lorebook_id', bookIds)
        .eq('enabled', true)
        .order('priority', { ascending: false })
        .order('insertion_order', { ascending: true })
        .order('id', { ascending: true })
        .range(from, Math.min(from + LOREBOOK_READ_PAGE, LOREBOOK_MAX_ENTRIES_READ) - 1);
      // A page that fails means no lorebook at all: half of the lore would give inconsistent replies.
      if (error || !Array.isArray(data)) return none;
      entries.push(...(data as LorebookEntry[]));
      if (data.length < LOREBOOK_READ_PAGE) break;
    }
    return { entries, bookDepths, budget };
  } catch {
    return none;
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let admin: ReturnType<typeof serverClient> | undefined;
  let reservation: Awaited<ReturnType<typeof reserveRequest>> | undefined;
  let completed = false;
  let chargeAttempted = false;
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

    // The member's Model House choice, then the character's recommendation, then the default.
    // Only catalog models that are available and free can ever be picked, whatever is stored.
    const { data: modelPreference } = await supabase
      .from('chimera_user_preferences')
      .select('default_ai_model')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((result) => result, () => ({ data: null }));
    // Models still being tried are only for members in chimera_model_testers (read with the member's own session).
    // A missing table or a failed read means "not a tester", never an error.
    const { data: testerRow } = await supabase
      .from('chimera_model_testers')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((result) => result, () => ({ data: null }));
    const chatModel = resolveModel(
      { member: modelPreference?.default_ai_model, character: (character as { ai_model?: string | null }).ai_model },
      { adultVerified: isAdultRating(character.content_rating), tester: !!testerRow },
    );
    const keys = providerKeys();
    // Fail before any capacity is reserved when the chosen model's provider is not set up.
    if (!keys[chatModel.provider]) {
      throw new RequestError(503, chatModel.provider === 'gemini'
        ? 'The CHIMERA story engine is not configured yet.'
        : `${chatModel.name} is not available right now. Choose another model in the Model House.`);
    }

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
    // Zero tolerance: no adult scene with a persona that says it is under 18.
    if (isAdultRating(character.content_rating) && personaAgeIsUnder18((persona as { age?: string | null } | null)?.age)) {
      throw new RequestError(400, 'Your persona is listed as under 18, so adult scenes are not available with it. Choose another persona or change its age.');
    }

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
    const sceneSettings = await loadSceneSettings({
      supabase,
      userId: user.id,
      conversationId,
      personaId,
      botId,
      botName: character.chat_name?.trim() || botProfile.display_name,
      playerName: persona?.name || 'Player',
      inWindow: new Set(history.map((m) => (m as MessageRow).id)),
    });
    sceneSettings.universeRules = await loadUniverseRules({ supabase, userId: user.id, conversationId });
    sceneSettings.memories = await loadApprovedMemories({
      supabase,
      userId: user.id,
      conversationId,
      characterId: character.id,
      personaId,
    });
    const lore = await loadLorebookEntries(character.id, (character as { creator_id?: string | null }).creator_id ?? null);
    sceneSettings.lorebook = lorebookBlock(selectLorebookEntries(lore.entries, chronological.map((m) => m.content), { bookDepths: lore.bookDepths, budget: lore.budget }), lore.budget);
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

    // A character with several openings: the tone baseline in the prompt is the one this scene really began with.
    const openings = cleanOpenings(character.greeting, (character as { alternate_greetings?: unknown }).alternate_greetings);
    let promptCharacter = character;
    if (openings.length > 1) {
      const { data: firstMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .eq('sender_id', botId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then((result) => result, () => ({ data: null }));
      promptCharacter = { ...character, greeting: openingUsed(openings, (firstMessage as { content?: string | null } | null)?.content) };
    }

    const systemPrompt = buildSystemPrompt(promptCharacter, botProfile, persona, conversation.memory_summary, sceneSettings);
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
        model: chatModel.id,
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

    // A paid model is charged before it is called, and refunded below if no reply is delivered.
    const charged = await chargeForReply(admin, reservation, chatModel, () => { chargeAttempted = true; });

    const replyText = await generateReply({
      model: chatModel,
      systemPrompt,
      turns: contents.map((turn) => ({ role: turn.role, text: turn.parts[0].text })),
      maxOutputTokens: Math.min(maxOutputTokensFor(sceneSettings.responseLength ?? 'medium') + (chatModel.thinkingHeadroom ?? 0), chatModel.maxOutputTokens ?? Infinity),
      keys,
    });
    const reply = cleanReply(replyText);
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
    return jsonResponse({ reply, model: chatModel.name, charged });
  } catch (error) {
    return requestFailure(error);
  } finally {
    if (admin && reservation?.state === 'reserved' && !completed) {
      // No reply was delivered: give back anything taken for it. A refund that cannot run now is
      // picked up by the stale-charge sweep the next time the member is charged.
      if (chargeAttempted) {
        await refundUndeliveredReply(admin, reservation);
      }
      await finishRequest(admin, reservation.id, reservation.lease, null, true).catch(() => undefined);
    }
  }
}
