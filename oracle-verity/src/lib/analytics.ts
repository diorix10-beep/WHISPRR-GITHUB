// Minimal analytics helper. Attempts to POST events to /api/analytics, falls back to console.log.
export async function sendEvent(name: string, payload: Record<string, any> = {}) {
  const body = { name, payload, ts: Date.now() };
  try {
    // try server endpoint if available
    const res = await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('analytics endpoint responded ' + res.status);
  } catch (err) {
    // fallback to console so events are still visible during development
    // keep payload small for readability
    // eslint-disable-next-line no-console
    console.log('[analytics]', name, payload);
  }
}
