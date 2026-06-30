// ============================================================
// ORACLE VERITY — EMAIL AUDIT ENGINE
// Provides real inbox status to Oracle and Iris.
// Never simulates. Reports actual state.
// ============================================================

export interface InboxStatus {
  connected: boolean;
  configured: boolean;
  ticketCount: number;
  openCount: number;
  pendingCount: number;
  resolvedCount: number;
  lastChecked: Date | null;
  lastTicketAt: Date | null;
  error: string | null;
  source: 'live-kv' | 'local-cache' | 'unconfigured';
}

export interface SupportTicketRaw {
  id: string;
  subject: string;
  userEmail: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: string;
    text: string;
    timestamp: string;
  }>;
}

const CACHE_KEY = 'oracle_support_inbox_cache';
const CACHE_META_KEY = 'oracle_support_inbox_meta';

export interface InboxCache {
  tickets: SupportTicketRaw[];
  fetchedAt: string;
  source: 'live-kv';
}

/**
 * Checks the real inbox status by querying the Vercel KV backend.
 * Returns structured status — never fabricates data.
 */
export async function checkInboxStatus(): Promise<InboxStatus> {
  try {
    const res = await fetch('/api/support-email', {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `API returned ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg = errJson.error;
      } catch {}

      localStorage.setItem(CACHE_META_KEY, JSON.stringify({
        lastChecked: new Date().toISOString(),
        error: errMsg,
        configured: false,
      }));

      return {
        connected: false,
        configured: false,
        ticketCount: 0,
        openCount: 0,
        pendingCount: 0,
        resolvedCount: 0,
        lastChecked: new Date(),
        lastTicketAt: null,
        error: errMsg.includes('KV database credentials')
          ? 'Vercel KV is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN to your .env.local.'
          : errMsg,
        source: 'unconfigured',
      };
    }

    const tickets: SupportTicketRaw[] = await res.json();

    const cache: InboxCache = { tickets, fetchedAt: new Date().toISOString(), source: 'live-kv' };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(CACHE_META_KEY, JSON.stringify({
      lastChecked: new Date().toISOString(), error: null, configured: true,
    }));

    const openCount = tickets.filter(t => t.status === 'open').length;
    const pendingCount = tickets.filter(t => t.status === 'pending').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    const dates = tickets.map(t => new Date(t.createdAt)).sort((a, b) => b.getTime() - a.getTime());

    return {
      connected: true,
      configured: true,
      ticketCount: tickets.length,
      openCount,
      pendingCount,
      resolvedCount,
      lastChecked: new Date(),
      lastTicketAt: dates.length > 0 ? dates[0] : null,
      error: null,
      source: 'live-kv',
    };
  } catch (err: any) {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (rawCache) {
      try {
        const cache: InboxCache = JSON.parse(rawCache);
        const tickets = cache.tickets;
        const openCount = tickets.filter(t => t.status === 'open').length;
        const pendingCount = tickets.filter(t => t.status === 'pending').length;
        const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
        const dates = tickets.map(t => new Date(t.createdAt)).sort((a, b) => b.getTime() - a.getTime());
        return {
          connected: false, configured: true,
          ticketCount: tickets.length, openCount, pendingCount, resolvedCount,
          lastChecked: new Date(cache.fetchedAt),
          lastTicketAt: dates.length > 0 ? dates[0] : null,
          error: `Live check failed (${err.message}) — showing cached data from ${new Date(cache.fetchedAt).toLocaleString()}`,
          source: 'local-cache',
        };
      } catch {}
    }

    return {
      connected: false, configured: false,
      ticketCount: 0, openCount: 0, pendingCount: 0, resolvedCount: 0,
      lastChecked: new Date(), lastTicketAt: null,
      error: err.name === 'TimeoutError'
        ? 'Request timed out. The API server may not be running locally. Deploy to Vercel for full functionality.'
        : `Cannot reach inbox API: ${err.message}`,
      source: 'unconfigured',
    };
  }
}

export async function getInboxStatusSummary(): Promise<string> {
  const status = await checkInboxStatus();
  if (status.source === 'unconfigured') {
    return `I cannot access the support inbox right now. The backend KV database is not configured (${status.error}). Once you add your Vercel KV credentials, I will have real-time access to all support emails.`;
  }
  if (status.source === 'local-cache') {
    return `I am showing cached inbox data (last refreshed ${status.lastChecked?.toLocaleString()}). Live connection is temporarily unavailable. Cached data shows ${status.openCount} open, ${status.pendingCount} pending, and ${status.resolvedCount} resolved tickets.`;
  }
  if (status.ticketCount === 0) {
    return `The support inbox (help@whisprr.xyz) is connected and empty. No tickets on record as of ${status.lastChecked?.toLocaleString()}.`;
  }
  return `Live inbox status as of ${status.lastChecked?.toLocaleString()}: ${status.ticketCount} total ticket${status.ticketCount !== 1 ? 's' : ''} — ${status.openCount} open, ${status.pendingCount} pending, ${status.resolvedCount} resolved.${status.lastTicketAt ? ` Most recent ticket arrived ${status.lastTicketAt.toLocaleString()}.` : ''}`;
}

export function loadCachedTickets(): SupportTicketRaw[] | null {
  const rawCache = localStorage.getItem(CACHE_KEY);
  if (!rawCache) return null;
  try {
    const cache: InboxCache = JSON.parse(rawCache);
    return cache.tickets;
  } catch {
    return null;
  }
}
