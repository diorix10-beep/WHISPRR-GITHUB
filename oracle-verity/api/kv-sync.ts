export const config = {
  runtime: 'edge', // Use Edge runtime for maximum speed
};

export default async function handler(req: Request) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'KV database credentials not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { method } = req;
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), { status: 400 });
  }

  try {
    if (method === 'GET') {
      const response = await fetch(`${KV_REST_API_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
      });
      const data = await response.json();
      return new Response(JSON.stringify({ result: data.result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } 
    
    if (method === 'POST') {
      const body = await req.json();
      // Vercel KV accepts a JSON string payload to set
      const response = await fetch(`${KV_REST_API_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
        body: JSON.stringify(body.value),
      });
      const data = await response.json();
      return new Response(JSON.stringify({ result: data.result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
