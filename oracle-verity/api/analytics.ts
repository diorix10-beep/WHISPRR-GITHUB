let EVENTS: Array<any> = [];

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      EVENTS.push({ ...body, ts: Date.now() });
      // In a production app you'd forward this to analytics provider
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'server error' });
    }
  }
  return res.status(405).json({ error: 'method not allowed' });
}
