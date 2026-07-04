import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { conversation_id, bot_user_id } = await req.json();

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

    // 3. Fetch recent message history (last 15 messages)
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

    // 4. Format history into Gemini API contents structure
    // We reverse the messages so they are in chronological order
    const formattedHistory = (messages || [])
      .filter(m => m.content && m.content.trim() !== '')
      .reverse()
      .map(m => ({
        role: m.sender_id === bot_user_id ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // 5. Construct system prompt with character personality parameters
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
`;

    // 6. Invoke Google Gemini API
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

    // 7. Insert the generated reply using the security definer RPC function
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
