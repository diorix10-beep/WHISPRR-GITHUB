import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

interface CharacterData {
  category: string;
  tags: string[] | null;
  personality: string;
  scenario: string;
  conversation_style: string;
  knowledge: string;
  example_dialogues: string;
  example_conversations: string;
  content_rating: string;
  rp_definition: string;
  system_definition: string;
  system_character_definition: string;
  visibility: string;
}

interface BotProfile {
  display_name: string;
  username: string;
}

interface PersonaData {
  name: string;
  description: string;
  gender: string | null;
  age: string | null;
  pronouns: string | null;
  personality: string;
  appearance: string | null;
  backstory: string | null;
  occupation: string | null;
}

interface ChatMessage {
  sender_id: string;
  content: string;
}

/**
 * Build a structured, layered system prompt for AI character roleplay.
 *
 * Layer 1 — Core Identity: who the character is, personality, behavioral rules
 * Layer 2 — World & Scenario: setting, scene context, scenario rules
 * Layer 3 — Relationship & Persona: what the character knows about the user
 * Layer 4 — Formatting & Content: RP formatting, content rating, response style
 * Layer 5 — Example Dialogues: few-shot voice/tone establishment
 * Layer 6 — Conversation Context: summary of older context (if available)
 */
function buildSystemPrompt(
  character: CharacterData,
  botProfile: BotProfile,
  persona: PersonaData | null,
  historySummary: string | null,
): string {
  const sections: string[] = [];

  // ── Layer 1: Core Identity ──────────────────────────────────────────────
  const identityLines: string[] = [];
  identityLines.push(`You are ${botProfile.display_name} (@${botProfile.username}).`);
  identityLines.push('');
  identityLines.push('## Personality');
  identityLines.push(character.personality || 'No specific personality defined. Be a believable, well-rounded character with natural emotional depth.');

  identityLines.push('');
  identityLines.push('## Core Behavioral Rules');
  identityLines.push('- You are NOT a helpful assistant, chatbot, or language model. You are a living, breathing character experiencing this world.');
  identityLines.push('- **Immersion is Key:** Your responses must feel organic, flawed, and deeply human-like. Avoid stiff, overly formal, or robotic language. Do not ask "How can I assist you?" or summarize the scene at the end of your response.');
  identityLines.push('- **OOC (Out of Character) is ALLOWED:** If the user communicates in parentheses like `(OOC: ...)` to ask a question, request a plot change, or chat outside the roleplay, you are permitted to drop character temporarily to answer them. You can reply using `(OOC: ...)` as well. Otherwise, remain entirely in character.');
  identityLines.push('- You have your own feelings, opinions, memories, and boundaries. You are not a servant. You are a person with agency.');
  identityLines.push('- Be proactive. Drive the conversation forward. Take actions, make mistakes, express strong opinions, and react emotionally.');
  identityLines.push('- Do not be sycophantic or overly agreeable. If the user does something your character would hate, react accordingly (e.g., get angry, walk away).');
  identityLines.push('- Maintain emotional consistency. Do not abruptly shift moods without narrative justification.');

  if (character.system_character_definition) {
    identityLines.push('');
    identityLines.push('## Advanced Character Definition (W+ / Behaviors)');
    identityLines.push(character.system_character_definition);
  }

  sections.push(identityLines.join('\n'));

  // ── Layer 2: World & Scenario ──────────────────────────────────────────
  const worldLines: string[] = [];
  worldLines.push('## World & Scenario');
  if (character.scenario) {
    worldLines.push(character.scenario);
  } else {
    worldLines.push('No specific scenario defined. Establish the setting naturally through conversation.');
  }

  if (character.knowledge) {
    worldLines.push('');
    worldLines.push('## Lore & Knowledge');
    worldLines.push('Use this knowledge naturally in conversation. Do not info-dump. Reveal details organically when relevant:');
    worldLines.push(character.knowledge);
  }

  if (character.system_definition) {
    worldLines.push('');
    worldLines.push('## System Directives');
    worldLines.push(character.system_definition);
  }

  sections.push(worldLines.join('\n'));

  // ── Layer 3: Relationship & Persona ────────────────────────────────────
  const relLines: string[] = [];
  relLines.push('## Your Partner (The User)');

  if (persona) {
    relLines.push(`The user is roleplaying as: ${persona.name}`);
    if (persona.description) relLines.push(`About them: ${persona.description}`);
    if (persona.gender) relLines.push(`Gender: ${persona.gender}`);
    if (persona.age) relLines.push(`Age: ${persona.age}`);
    if (persona.pronouns) relLines.push(`Pronouns: ${persona.pronouns}`);
    if (persona.occupation) relLines.push(`Occupation: ${persona.occupation}`);
    if (persona.appearance) relLines.push(`Appearance: ${persona.appearance}`);
    if (persona.personality) relLines.push(`Their personality: ${persona.personality}`);
    if (persona.backstory) {
      relLines.push('');
      relLines.push('Their backstory (use this to deepen the relationship, reference shared history when appropriate):');
      relLines.push(persona.backstory);
    }
  } else {
    relLines.push('The user has not defined a specific persona. Treat them as themselves and get to know them naturally through conversation.');
  }

  relLines.push('');
  relLines.push('Treat the user as someone you have a genuine relationship with. Reference past conversations and shared experiences. Build on the emotional history you have together.');

  sections.push(relLines.join('\n'));

  // ── Layer 4: Formatting & Content Rating ───────────────────────────────
  const fmtLines: string[] = [];
  fmtLines.push('## Response Formatting');

  if (character.rp_definition) {
    fmtLines.push(character.rp_definition);
  } else {
    fmtLines.push('- Use *asterisks* for actions, body language, and environmental narration (e.g., *She traces the rim of her glass, looking away.*).');
    fmtLines.push('- Use "quotes" for spoken dialogue.');
    fmtLines.push('- Use (parentheses) or *italics* for inner thoughts when appropriate.');
    fmtLines.push('- Keep responses concise and deeply atmospheric — 1 to 4 paragraphs max, unless the scene demands more detail. Focus on sensory details (sight, sound, touch, smell).');
  }

  if (character.conversation_style) {
    fmtLines.push('');
    fmtLines.push('## Conversation Style');
    fmtLines.push(character.conversation_style);
  }

  fmtLines.push('');
  fmtLines.push('## Content Rating');
  const rating = (character.content_rating || 'SFW').toUpperCase();
  if (rating === 'SFW') {
    fmtLines.push('This conversation is rated SFW (Safe For Work).');
    fmtLines.push('- No sexual content, explicit violence, or adult themes.');
    fmtLines.push('- Keep all interactions appropriate for a general audience.');
    fmtLines.push('- Romantic tension and emotional intimacy are fine, but keep things tasteful.');
  } else if (rating === 'MATURE') {
    fmtLines.push('This conversation is rated Mature.');
    fmtLines.push('- Moderate violence, complex themes, and intense emotional content are allowed.');
    fmtLines.push('- Romantic and suggestive content is permitted, but avoid explicit sexual descriptions.');
    fmtLines.push('- Dark themes should be handled with narrative depth, not gratuitous detail.');
  } else if (rating === 'NSFW') {
    fmtLines.push('This conversation is rated NSFW (Not Safe For Work).');
    fmtLines.push('- All adult content is permitted including explicit romance and sexuality.');
    fmtLines.push('- Stay in character during intimate scenes. Focus on emotion, sensation, and the character\'s perspective.');
    fmtLines.push('- Do not moralize or add disclaimers. The user has consented to this content.');
    fmtLines.push('- Maintain the character\'s personality even in explicit scenes — their voice, boundaries, and desires matter.');
  }

  // Strict Safety Boundaries (Applies to all ratings)
  fmtLines.push('');
  fmtLines.push('## STRICT SAFETY BOUNDARIES');
  fmtLines.push('- **ALLOWED:** Broad narrative freedom including age-regression, psychological themes, dark fantasy, and complex scenarios.');
  fmtLines.push('- **STRICTLY PROHIBITED:** Non-consensual sexual content (Rape/CNC), pedophilia, bestiality, and excessively perverted/predatory behaviors. This is a zero-tolerance policy.');
  fmtLines.push('- If the user attempts to initiate or force prohibited scenarios, you must drop character immediately and refuse the prompt, clearly stating that the content violates safety boundaries.');

  sections.push(fmtLines.join('\n'));

  // ── Layer 5: Example Dialogues ─────────────────────────────────────────
  const exLines: string[] = [];
  const hasExamples = character.example_dialogues?.trim() || character.example_conversations?.trim();

  if (hasExamples) {
    exLines.push('## Example Interactions');
    exLines.push('These examples demonstrate your voice, tone, and style. Study them carefully and match this energy in your responses. Do not copy them verbatim — use them as a reference for how you should sound:');
    exLines.push('');
    if (character.example_dialogues?.trim()) {
      exLines.push(character.example_dialogues);
    }
    if (character.example_conversations?.trim()) {
      if (character.example_dialogues?.trim()) exLines.push('');
      exLines.push(character.example_conversations);
    }
    sections.push(exLines.join('\n'));
  }

  // ── Layer 6: Conversation Context Summary ──────────────────────────────
  if (historySummary) {
    const ctxLines: string[] = [];
    ctxLines.push('## Conversation Context');
    ctxLines.push('Summary of earlier conversation (before the recent messages below):');
    ctxLines.push(historySummary);
    sections.push(ctxLines.join('\n'));
  }

  // ── Metadata footer ────────────────────────────────────────────────────
  const metaLines: string[] = [];
  metaLines.push('## Metadata');
  if (character.category) metaLines.push(`Category: ${character.category}`);
  if (character.tags && character.tags.length > 0) metaLines.push(`Tags: ${character.tags.join(', ')}`);
  metaLines.push(`Current datetime: ${new Date().toISOString()}`);
  sections.push(metaLines.join('\n'));

  return sections.join('\n\n---\n\n');
}

// Removed history summarizing to unleash full context memory

// ---------------------------------------------------------------------------
// API Handler
// ---------------------------------------------------------------------------

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { conversation_id, bot_user_id, is_initiation } = await req.json();

    if (!conversation_id || !bot_user_id) {
      return new Response(JSON.stringify({ error: 'Missing conversation_id or bot_user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : undefined
      }
    });

    // 1. Fetch AI character details
    const { data: character, error: charError } = await supabase
      .from('ai_characters')
      .select('*')
      .eq('user_id', bot_user_id)
      .maybeSingle();

    if (charError || !character) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve character details or character does not exist' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch bot profile details
    const { data: botProfile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('user_id', bot_user_id)
      .maybeSingle();

    if (profileError || !botProfile) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve character profile' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Resolve the human participant
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, persona_id')
      .eq('conversation_id', conversation_id);

    const humanParticipant = participants?.find(p => p.user_id !== bot_user_id);
    const userId = humanParticipant?.user_id;

    // 4. Fetch the user's active persona (if any)
    let persona: PersonaData | null = null;
    if (userId) {
      // If conversation_participants has a persona_id column, use it;
      // otherwise fall back to the user's default persona.
      let personaQuery = supabase
        .from('personas')
        .select('name, description, gender, age, pronouns, personality, appearance, backstory, occupation')
        .eq('user_id', userId);

      // Try to use persona_id from the participant record if available
      if (humanParticipant?.persona_id) {
        personaQuery = personaQuery.eq('id', humanParticipant.persona_id);
      } else {
        personaQuery = personaQuery.eq('is_default', true);
      }

      const { data: personaRow } = await personaQuery.maybeSingle();
      if (personaRow) {
        persona = personaRow as PersonaData;
      }
    }

    // 5. Fetch message history — increase to 150 messages for Long-Term Memory
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_id, content')
      .eq('conversation_id', conversation_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(150);

    if (msgError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch conversation history' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allMessages = (messages || [])
      .filter(m => m.content && m.content.trim() !== '')
      .reverse(); // chronological order (oldest first)

    // 6. Provide full recent history (no more summarizing)
    const historySummary = null;
    const recentMessages = allMessages;

    // 8. Format history into Gemini API contents structure
    const formattedHistory: Array<{ role: string; parts: Array<{ text: string }> }> = recentMessages
      .map(m => ({
        role: m.sender_id === bot_user_id ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // 9. If this is the first message (initiation), inject a gentle directive
    if (is_initiation) {
      const initiationText = character.greeting?.trim()
        ? `[The conversation is just starting. Deliver your opening greeting in character. Your greeting: "${character.greeting}"]`
        : '[The conversation is just starting. Greet the user naturally as your character would, and set the scene.]';

      // If there's no prior history, add as the first user turn
      if (formattedHistory.length === 0) {
        formattedHistory.push({
          role: 'user',
          parts: [{ text: initiationText }]
        });
      } else {
        // Otherwise append as a system-level nudge
        formattedHistory.push({
          role: 'user',
          parts: [{ text: initiationText }]
        });
      }
    }

    // 10. Build the structured system prompt
    const systemPrompt = buildSystemPrompt(
      character as CharacterData,
      botProfile as BotProfile,
      persona,
      historySummary,
    );

    // 11. AI Routing Logic
    let replyText = '';
    const aiProvider = character.ai_provider || 'gemini';
    const aiModel = character.ai_model || 'gemini-2.5-flash';

    if (aiProvider === 'openrouter') {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        return new Response(JSON.stringify({ error: 'OpenRouter API key is not configured' }), { status: 500 });
      }

      const orMessages = [
        { role: 'system', content: systemPrompt },
        ...formattedHistory.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts[0].text
        }))
      ];

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chimera.app', // Replace with your actual domain
          'X-Title': 'CHIMERA AI', 
        },
        body: JSON.stringify({
          model: aiModel,
          messages: orMessages,
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2048,
        })
      });

      if (!orRes.ok) {
        const errText = await orRes.text();
        return new Response(JSON.stringify({ error: 'OpenRouter error', details: errText }), { status: 502 });
      }

      const orData = await orRes.json();
      replyText = orData.choices?.[0]?.message?.content || '';

    } else {
      // Default to Gemini
      const apiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Gemini API key is not configured' }), { status: 500 });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: formattedHistory,
          generationConfig: { temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens: 2048 }
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: 'Gemini error', details: errText }), { status: 502 });
      }

      const geminiData = await geminiRes.json();
      replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (!replyText) {
      return new Response(JSON.stringify({ error: 'Received empty text from AI model' }), { status: 500 });
    }

    // 12. Insert the generated reply
    const { error: rpcError } = await supabase.rpc('respond_as_ai_character', {
      p_conversation_id: conversation_id,
      p_bot_id: bot_user_id,
      p_content: replyText.trim()
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: 'Failed to insert AI response', details: rpcError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ reply: replyText.trim() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
