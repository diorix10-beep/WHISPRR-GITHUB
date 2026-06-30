export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'KV database credentials not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const event = req.headers.get('x-github-event') || 'unknown';
    const payload = await req.json();
    
    const repo = payload.repository?.full_name;
    if (!repo) {
      return new Response(JSON.stringify({ error: 'No repository found in payload' }), { status: 400 });
    }

    // Retrieve existing events for this repo
    const key = `github:events:${repo}`;
    const getRes = await fetch(`${KV_REST_API_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    });
    
    let events = [];
    if (getRes.ok) {
      const getData = await getRes.json();
      if (getData.result) {
        let parsed = getData.result;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) {}
        }
        if (Array.isArray(parsed)) {
          events = parsed;
        }
      }
    }

    // Add new event to the beginning of the list
    events.unshift({
      id: payload.action || event + '-' + Date.now(),
      type: event,
      payload: payload,
      timestamp: new Date().toISOString()
    });

    // Keep only the latest 50 events
    events = events.slice(0, 50);

    // Save back to KV
    const setRes = await fetch(`${KV_REST_API_URL}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
      body: JSON.stringify(JSON.stringify(events)), // Vercel KV requires stringified JSON payload
    });

    if (!setRes.ok) {
      throw new Error('Failed to save to KV');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
