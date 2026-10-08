import { createClient } from '@supabase/supabase-js';
import { requireAdultContentAccess } from './_lib/adultContentGate.js';
import { fingerprint, finishRequest, providerFetch, readPayload, requestFailure, RequestError, reserveRequest, serverClient, uuid } from './_lib/requestProtection.js';

export const config = { runtime: 'edge' };

type TurningPointChoice = { id: string; key: string; label: string };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function parseTurningPoint(raw: string): { title: string; scene_prompt: string; choices: TurningPointChoice[] } | null {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (typeof parsed.title !== 'string' || typeof parsed.scene_prompt !== 'string' || !Array.isArray(parsed.choices)) return null;
    const choices: TurningPointChoice[] = parsed.choices.slice(0, 3).map((choice: unknown, index: number) => {
      const value = choice as { label?: unknown };
      return { id: String.fromCharCode(97 + index), key: String.fromCharCode(65 + index), label: String(value.label || '').trim() };
    });
    if (choices.length < 2 || choices.some((choice) => !choice.label || choice.label.length > 240)) return null;
    return { title: parsed.title.trim().slice(0, 120), scene_prompt: parsed.scene_prompt.trim().slice(0, 1200), choices };
  } catch {
    return null;
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
  if (!authHeader || !supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: 'Authentication is required.' }, 401);
  if (!geminiKey) return jsonResponse({ error: 'The CHIMERA story engine is not configured yet.' }, 503);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Authentication is required.' }, 401);

  let reservation: Awaited<ReturnType<typeof reserveRequest>> | undefined;
  let admin: ReturnType<typeof serverClient> | undefined;
  let completed = false;
  try {
    const { conversation_id, bot_user_id } = await readPayload(req);
    if (!uuid(conversation_id) || !uuid(bot_user_id)) throw new RequestError(400, 'Missing roleplay context.');
    const { data: botMember } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversation_id).eq('user_id', bot_user_id).maybeSingle();
    const { data: identity } = await supabase.from('profiles').select('role').eq('user_id', bot_user_id).maybeSingle();
    if (!botMember || identity?.role !== 'ai_character') throw new RequestError(403, 'This character is not in your roleplay.');
    if (!conversation_id || !bot_user_id) return jsonResponse({ error: 'Missing roleplay context.' }, 400);

    const [{ data: conversation, error: conversationError }, { data: character }, { data: botProfile }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('conversations').select('id, type, memory_summary').eq('id', conversation_id).maybeSingle(),
      supabase.from('ai_characters').select('scenario, personality, short_description, content_rating').eq('user_id', bot_user_id).maybeSingle(),
      supabase.from('profiles').select('display_name').eq('user_id', bot_user_id).maybeSingle(),
      supabase.from('messages').select('id, sender_id, content, created_at').eq('conversation_id', conversation_id).is('deleted_at', null).order('created_at', { ascending: false }).limit(12),
    ]);

    if (conversationError || !conversation || conversation.type !== 'dm' || messagesError || !messages || messages.length < 8) {
      return jsonResponse({ error: 'Continue this roleplay a little longer before opening a turning point.' }, 400);
    }

    if (!character) throw new RequestError(404, 'This character is unavailable.');
    await requireAdultContentAccess(supabase, character.content_rating);

    admin = serverClient();
    const requestKey = `turning-point:${messages[0].id}`;
    reservation = await reserveRequest(admin, user.id, 'turning_point', conversation_id, requestKey, await fingerprint({ conversation_id, bot_user_id, requestKey }));
    if (reservation.state === 'completed') { completed = true; return jsonResponse(reservation.result); }
    const transcript = [...messages].reverse().map((message) => `${message.sender_id === bot_user_id ? (botProfile?.display_name || 'Character') : 'Player'}: ${message.content}`).join('\n');
    const prompt = `You are CHIMERA's Guided Story Paths engine. Create one meaningful turning point for the fictional roleplay below. It must reflect the existing scene, give the player genuine agency, and never mention AI, policies, rewards, or game mechanics. Do not use generic fantasy choices unless the scene itself is fantasy. Return ONLY valid JSON in exactly this shape:\n{"title":"short 2-6 word title","scene_prompt":"one atmospheric sentence that introduces the decision","choices":[{"label":"choice one"},{"label":"choice two"},{"label":"choice three"}]}\nUse two or three choices. Each choice must be distinct, plausible, and under 180 characters.\n\nCharacter: ${botProfile?.display_name || 'Unknown'}\nCharacter premise: ${character?.scenario || character?.short_description || ''}\nCharacter personality: ${character?.personality || ''}\nScene canon: ${conversation.memory_summary || 'None yet'}\n\nRecent roleplay:\n${transcript}`;
    if (prompt.length > 100_000) throw new RequestError(413, 'This scene context is too large.');
    const geminiResponse = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, responseMimeType: 'application/json', maxOutputTokens: 2048 } }),
    });
    if (!geminiResponse.ok) return jsonResponse({ error: 'CHIMERA could not shape a turning point right now.' }, 502);

    const geminiData = await geminiResponse.json();
    const generated = parseTurningPoint(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '');
    if (!generated || !generated.title || !generated.scene_prompt) return jsonResponse({ error: 'CHIMERA could not shape a clear enough turning point. Please try again.' }, 502);

    const { data: point, error: createError } = await admin.rpc('complete_guarded_chimera_turning_point', {
      p_request_id: reservation.id, p_lease: reservation.lease,
      p_conversation_id: conversation_id,
      p_title: generated.title,
      p_scene_prompt: generated.scene_prompt,
      p_choices: generated.choices,
    });
    if (createError) throw new RequestError(400, 'This turning point could not be saved.');
    completed = true;
    return jsonResponse(point);
  } catch (error) {
    return requestFailure(error);
  } finally {
    if (admin && reservation?.state === 'reserved' && !completed) {
      await finishRequest(admin, reservation.id, reservation.lease, null, true).catch(() => undefined);
    }
  }
}
