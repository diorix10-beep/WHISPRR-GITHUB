import { ALLOWED_ELEVENLABS_VOICE_IDS } from '../src/lib/voiceCatalog.js';
import { authenticate, fingerprint, finishRequest, jsonResponse, providerFetch, readPayload, requestFailure, RequestError, reserveRequest, serverClient } from './_lib/requestProtection.js';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);
  let reserved: Awaited<ReturnType<typeof reserveRequest>> | undefined;
  let admin: ReturnType<typeof serverClient> | undefined;
  try {
    const { user } = await authenticate(req);
    const payload = await readPayload(req);
    const voiceId = payload.voice_id;
    if (typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 8000 ||
      typeof voiceId !== 'string' || !ALLOWED_ELEVENLABS_VOICE_IDS.some((id) => id === voiceId)) {
      throw new RequestError(400, 'Choose a supported voice and a shorter passage.');
    }
    const providerKey = process.env.ELEVENLABS_API_KEY;
    if (!providerKey) throw new RequestError(503, 'This voice is not configured yet.');
    admin = serverClient();
    reserved = await reserveRequest(admin, user.id, 'voice', voiceId, req.headers.get('Idempotency-Key') || '', await fingerprint(payload));
    if (reserved.state === 'completed') throw new RequestError(409, 'This voice request has already finished.');
    const text = payload.text.replace(/\*.*?\*/g, '').replace(/[#_*`~]/g, '').trim() || payload.text;
    const response = await providerFetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': providerKey },
      body: JSON.stringify({
        text, model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true },
      }),
    });
    if (!response.ok) throw new RequestError(502, 'Voice audio is temporarily unavailable.');
    const audio = await response.arrayBuffer();
    await finishRequest(admin, reserved.id, reserved.lease, { completed: true });
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (admin && reserved?.state === 'reserved') {
      await finishRequest(admin, reserved.id, reserved.lease, null, true).catch(() => undefined);
    }
    return requestFailure(error);
  }
}
