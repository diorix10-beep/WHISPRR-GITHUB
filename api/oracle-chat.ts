export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text, conv_id } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide a message to send.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = process.env.QUICKCHAT_API_TOKEN;
    const scenarioId = process.env.QUICKCHAT_SCENARIO_ID || '5isdyzru54';

    if (!apiToken) {
      console.error('QUICKCHAT_API_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'Oracle is currently unavailable. Please try again later.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build request body for Quickchat Chat API
    const body: Record<string, string> = {
      scenario_id: scenarioId,
      text: text.trim(),
    };

    // Include conv_id for conversation continuity
    if (conv_id && typeof conv_id === 'string') {
      body.conv_id = conv_id;
    }

    const quickchatRes = await fetch('https://app.quickchat.ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!quickchatRes.ok) {
      const errorText = await quickchatRes.text();
      console.error('Quickchat API error:', quickchatRes.status, errorText);

      if (quickchatRes.status === 401 || quickchatRes.status === 403) {
        return new Response(
          JSON.stringify({ error: "Oracle's session has expired. Please contact support." }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (quickchatRes.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Oracle is thinking too fast! Please wait a moment and try again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Oracle encountered an issue. Please try again in a moment.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await quickchatRes.json();

    // Quickchat returns { response: string, conv_id: string }
    return new Response(
      JSON.stringify({
        response: data.response || data.text || '',
        conv_id: data.conv_id || conv_id || '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Oracle chat proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong while reaching Oracle. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
