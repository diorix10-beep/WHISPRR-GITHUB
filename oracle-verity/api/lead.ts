// Simple serverless handler to accept leads. Stores to in-memory list for dev.
import { IncomingMessage, ServerResponse } from 'http';

let LEADS: Array<{ email: string, ts: number }> = [];

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'missing email' });
      LEADS.push({ email, ts: Date.now() });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'server error' });
    }
  }
  return res.status(405).json({ error: 'method not allowed' });
}
