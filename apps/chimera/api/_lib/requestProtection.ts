import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function readPayload(req: Request, maxBytes = 24_000): Promise<Record<string, unknown>> {
  if (Number(req.headers.get('content-length')) > maxBytes) throw new RequestError(413, 'This request is too large.');
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError(400, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new RequestError(413, 'This request is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw new Error();
    return payload as Record<string, unknown>;
  } catch { throw new RequestError(400, 'Please send a valid request.'); }
}

export function uuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function authenticate(req: Request) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const authorization = req.headers.get('Authorization');
  if (!url || !key) throw new RequestError(503, 'CHIMERA is temporarily unavailable.');
  if (!authorization?.startsWith('Bearer ')) throw new RequestError(401, 'Please sign in to continue.');
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new RequestError(401, 'Please sign in to continue.');
  return { supabase, user: data.user };
}

export function serverClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new RequestError(503, 'CHIMERA request protection is not configured yet.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function fingerprint(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function reserveRequest(admin: SupabaseClient, userId: string, operation: string, resource: string, key: string, hash: string) {
  if (key.length > 200 || !key.trim()) throw new RequestError(400, 'A valid retry identifier is required.');
  const { data, error } = await admin.rpc('reserve_chimera_ai_request', {
    p_user_id: userId, p_operation: operation, p_resource: resource, p_request_key: key, p_fingerprint: hash,
  });
  if (error || !data) throw new RequestError(503, 'CHIMERA request protection is temporarily unavailable.');
  if (data.state === 'conflict') throw new RequestError(409, 'This retry identifier belongs to a different request.');
  if (data.state === 'busy') throw new RequestError(409, 'A response is already being prepared. Please wait before retrying.');
  if (data.state === 'limited') throw new RequestError(429, 'Please allow a moment before requesting another response.');
  return data as { state: 'reserved' | 'completed'; id: string; lease: string; result: Record<string, unknown> | null };
}

export async function finishRequest(admin: SupabaseClient, id: string, lease: string, result: unknown, failed = false) {
  const { error } = await admin.rpc('finish_chimera_ai_request', {
    p_request_id: id, p_lease: lease, p_result: result, p_failed: failed,
  });
  if (error) throw new RequestError(503, 'The response could not be confirmed. Please retry the same request.');
}

export async function providerFetch(url: string, init: RequestInit, timeoutMs = 45_000) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

export function requestFailure(error: unknown) {
  if (error instanceof RequestError) return jsonResponse({ error: error.message }, error.status);
  // Do not return provider payloads, SQL details, URLs or credentials.
  return jsonResponse({ error: 'CHIMERA could not prepare this response. Your saved work is safe; please retry.' }, 502);
}
