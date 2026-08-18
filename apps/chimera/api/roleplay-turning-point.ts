import { createClient } from '@supabase/supabase-js';

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
    const choices = parsed.choices.slice(0, 3).map((choice: unknown, index: number) => {
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

  try {
    const { conversation_id, bot_user_id } = await req.json();
    if (!conversation_id || !bot_user_id) return jsonResponse({ error: 'Missing roleplay context.' }, 400);

    const [{ data: conversation, error: conversationError }, { data: character }, { data: botProfile }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('conversations').select('id, type, memory_summary').eq('id', conversation_id).maybeSingle(),
      supabase.from('ai_characters').select('scenario, personality, short_description').eq('user_id', bot_user_id).maybeSingle(),
      supabase.from('profiles').select('display_name').eq('user_id', bot_user_id).maybeSingle(),
      supabase.from('messages').select('sender_id, content, created_at').eq('conversation_id', conversation_id).is('deleted_at', null).order('created_at', { ascending: false }).limit(12),
    ]);

    if (conversationError || !conversation || conversation.type !== 'dm' || messagesError || !messages || messages.length < 8) {
      return jsonResponse({ error: 'Continue this roleplay a little longer before opening a turning point.' }, 400);
    }

    const transcript = [...messages].reverse().map((message) => `${message.sender_id === bot_user_id ? (botProfile?.display_name || 'Character') : 'Player'}: ${message.content}`).join('\n');
    const prompt = `You are CHIMERA's Guided Story Paths engine. Create one meaningful turning point for the fictional roleplay below. It must reflect the existing scene, give the player genuine agency, and never mention AI, policies, rewards, or game mechanics. Do not use generic fantasy choices unless the scene itself is fantasy. Return ONLY valid JSON in exactly this shape:\n{"title":"short 2-6 word title","scene_prompt":"one atmospheric sentence that introduces the decision","choices":[{"label":"choice one"},{"label":"choice two"},{"label":"choice three"}]}\nUse two or three choices. Each choice must be distinct, plausible, and under 180 characters.\n\nCharacter: ${botProfile?.display_name || 'Unknown'}\nCharacter premise: ${character?.scenario || character?.short_description || ''}\nCharacter personality: ${character?.personality || ''}\nScene canon: ${conversation.memory_summary || 'None yet'}\n\nRecent roleplay:\n${transcript}`;
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, responseMimeType: 'application/json' } }),
    });
    if (!geminiResponse.ok) return jsonResponse({ error: 'CHIMERA could not shape a turning point right now.' }, 502);

    const geminiData = await geminiResponse.json();
    const generated = parseTurningPoint(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '');
    if (!generated || !generated.title || !generated.scene_prompt) return jsonResponse({ error: 'CHIMERA could not shape a clear enough turning point. Please try again.' }, 502);

    const { data: point, error: createError } = await supabase.rpc('create_my_roleplay_turning_point', {
      p_conversation_id: conversation_id,
      p_title: generated.title,
      p_scene_prompt: generated.scene_prompt,
      p_choices: generated.choices,
    });
    if (createError) return jsonResponse({ error: createError.message }, 400);
    return jsonResponse({ turning_point: point });
  } catch (error) {
    console.error('Roleplay turning point failed', error);
    return jsonResponse({ error: 'CHIMERA could not open a turning point right now.' }, 500);
  }
}
