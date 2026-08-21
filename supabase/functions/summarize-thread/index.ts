Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    return Response.json({ error: 'OPENAI_API_KEY is required' }, { status: 500 });
  }

  try {
    const { threadId, messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages must be a non-empty array' }, { status: 400 });
    }

    const transcript = messages
      .map((message: { sender_id?: string; body?: string; created_at?: string }) => {
        const sender = message.sender_id ?? 'unknown';
        const at = message.created_at ?? 'unknown-time';
        return `[${at}] ${sender}: ${message.body ?? ''}`;
      })
      .join('\n');

    const prompt = [
      'You are a concise assistant that summarizes chat threads.',
      'Return JSON with keys: summary, action_items (array), sentiment, and key_points (array).',
      `Thread ID: ${threadId ?? 'unknown'}`,
      'Messages:',
      transcript,
    ].join('\n\n');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You summarize message threads.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      return Response.json(
        { error: 'OpenAI request failed', details: await aiResponse.text() },
        { status: 502 },
      );
    }

    const aiJson = await aiResponse.json();
    const content = aiJson?.choices?.[0]?.message?.content;
    try {
      return Response.json({ threadId, ...JSON.parse(content) });
    } catch {
      return Response.json({ threadId, summary: content ?? '' });
    }
  } catch (error) {
    return Response.json({ error: 'Invalid request', details: String(error) }, { status: 400 });
  }
});
