// Keep the retry ID on the RequestInit for transport-level retries of the same
// deliberate operation. Normal chat turns also have server-side message dedupe.
export function requestAiChat(init: RequestInit) {
  const headers = new Headers(init.headers);
  if (!headers.has('Idempotency-Key')) headers.set('Idempotency-Key', crypto.randomUUID());
  return fetch('/api/ai-chat', { ...init, headers });
}
