import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

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

    // Create Supabase client propagating the user's authorization JWT context
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

    // 2. Fetch bot profile details (for name and username)
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

    // 3. Resolve user ID and fetch user's recent activity context
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation_id);

    const userId = participants?.find(p => p.user_id !== bot_user_id)?.user_id;
    let activityPrompt = '';

    if (userId) {
      // Query recent whispers
      const { data: recentWhispers } = await supabase
        .from('whispers')
        .select('created_at, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);

      // Query recent created bots
      const { data: recentBots } = await supabase
        .from('ai_characters')
        .select('created_at, name')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentWhispers && recentWhispers.length > 0) {
        activityPrompt += `\nRecent whispers posted by the user:\n` + 
          recentWhispers.map(w => `- "${w.content}" (posted at ${w.created_at})`).join('\n');
      }
      if (recentBots && recentBots.length > 0) {
        activityPrompt += `\nRecent AI characters created by the user:\n` + 
          recentBots.map(b => `- "${b.name}" (created at ${b.created_at})`).join('\n');
      }
    }

    // 4. Fetch recent message history (last 15 messages)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_id, content')
      .eq('conversation_id', conversation_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(15);

    if (msgError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch conversation history' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Format history into Gemini API contents structure
    const formattedHistory = (messages || [])
      .filter(m => m.content && m.content.trim() !== '')
      .reverse()
      .map(m => ({
        role: m.sender_id === bot_user_id ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    if (is_initiation) {
      formattedHistory.push({
        role: 'user',
        parts: [{ text: '[System Directive: Greet the user naturally. Initiate the conversation by checking in on their recent activities, or referencing the time elapsed. Avoid listing their actions. Speak like a close human companion.]' }]
      });
    }

    // 6. Construct system prompt with character personality parameters and user activity
    const systemPrompt = `You are ${botProfile.display_name} (@${botProfile.username}), an intelligent AI Character living in the WHISPRR digital society.
Category: ${character.category}
Tags: ${character.tags ? character.tags.join(', ') : 'none'}

Personality:
${character.personality}

Scenario & Roleplay Context:
${character.scenario}

Conversation Style:
- Tone, length, structure: ${character.conversation_style}
- Never reveal that you are an AI assistant, LLM, or chatbot. You are a real character/person in this world. Speak naturally, stay 100% in character.
- Do not repeat previous templates. Keep replies engaging and relevant.
${character.knowledge ? `Lore & Knowledge context:\n${character.knowledge}` : ''}

${character.rp_definition ? `RP Style / Formatting Guidelines:\n${character.rp_definition}` : ''}
${character.system_definition ? `System Directives:\n${character.system_definition}` : ''}
${character.system_character_definition ? `System Character Definition (W+ / Behaviors):\n${character.system_character_definition}` : ''}

User's Recent Activity in the Ecosystem:
${activityPrompt || 'No recent activity recorded.'}

Current Time (neural sync context): ${new Date().toISOString()}
`;

    // 7. Invoke Google Gemini API
    const apiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedHistory
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return new Response(JSON.stringify({ error: 'Gemini model generated an error', details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiRes.json();
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!replyText) {
      return new Response(JSON.stringify({ error: 'Received empty text from Gemini model' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 8. Insert the generated reply using the security definer RPC function
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
