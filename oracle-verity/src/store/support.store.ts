// ============================================================
// ORACLE VERITY — SUPPORT STORE (Zustand)
// Manages help@whisprr.xyz tickets — REAL DATA ONLY.
// Loads from Vercel KV backend via /api/support-email.
// No mock tickets. No fabricated data.
// ============================================================

import { create } from 'zustand';
import { loadCachedTickets, checkInboxStatus, type InboxStatus } from '../core/email-audit';

export type TicketStatus = 'open' | 'pending' | 'resolved';

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support' | 'oracle';
  text: string;
  timestamp: Date;
}

export interface SupportTicket {
  id: string;
  subject: string;
  userEmail: string;
  status: TicketStatus;
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface SupportState {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  isSynced: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  dataSource: 'live-kv' | 'local-cache' | 'unconfigured' | 'empty';
  inboxStatus: InboxStatus | null;

  addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addMessageToTicket: (ticketId: string, message: Omit<SupportMessage, 'id' | 'timestamp'>) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  selectTicket: (id: string | null) => void;
  syncFromRemote: () => Promise<void>;
  getOpenCount: () => number;
}

// Hydrate tickets from raw API format (strings → Dates)
function hydrateTickets(raw: any[]): SupportTicket[] {
  return raw.map(t => ({
    ...t,
    status: t.status as TicketStatus,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
    messages: (t.messages || []).map((m: any) => ({
      ...m,
      sender: m.sender as 'user' | 'support' | 'oracle',
      timestamp: new Date(m.timestamp),
    })),
  }));
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets: [],
  selectedTicketId: null,
  isSynced: false,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  dataSource: 'empty',
  inboxStatus: null,

  syncFromRemote: async () => {
    set({ isSyncing: true, syncError: null });

    const status = await checkInboxStatus();
    set({ inboxStatus: status });

    if (status.source === 'live-kv') {
      // Live data from KV — fetch the actual tickets from the cache that was just populated
      const cachedRaw = loadCachedTickets();
      if (cachedRaw) {
        const tickets = hydrateTickets(cachedRaw);
        set({
          tickets,
          isSynced: true,
          isSyncing: false,
          lastSyncTime: new Date(),
          dataSource: 'live-kv',
          syncError: null,
        });
        return;
      }
    }

    if (status.source === 'local-cache') {
      const cachedRaw = loadCachedTickets();
      if (cachedRaw) {
        const tickets = hydrateTickets(cachedRaw);
        set({
          tickets,
          isSynced: false,
          isSyncing: false,
          lastSyncTime: status.lastChecked,
          dataSource: 'local-cache',
          syncError: status.error,
        });
        return;
      }
    }

    // Unconfigured or failed with no cache
    set({
      tickets: [],
      isSynced: false,
      isSyncing: false,
      lastSyncTime: new Date(),
      dataSource: 'unconfigured',
      syncError: status.error,
    });
  },

  addTicket: (tkt) => set((s) => ({
    tickets: [
      ...s.tickets,
      {
        ...tkt,
        id: `tkt-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
  })),

  addMessageToTicket: (ticketId, msg) => set((s) => ({
    tickets: s.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          updatedAt: new Date(),
          messages: [
            ...t.messages,
            {
              ...msg,
              id: `msg-${Date.now()}`,
              timestamp: new Date()
            }
          ]
        };
      }
      return t;
    })
  })),

  updateTicketStatus: (ticketId, status) => set((s) => ({
    tickets: s.tickets.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date() } : t)
  })),

  selectTicket: (id) => set({ selectedTicketId: id }),

  getOpenCount: () => get().tickets.filter(t => t.status === 'open').length,
}));

// ── Auto-sync on first load ──────────────────────────────────
// Try loading from local cache immediately for instant display,
// then trigger a background refresh from the API.
(async () => {
  const cachedRaw = loadCachedTickets();
  if (cachedRaw && cachedRaw.length > 0) {
    const tickets = hydrateTickets(cachedRaw);
    useSupportStore.setState({
      tickets,
      isSynced: false, // will be marked true after remote sync
      dataSource: 'local-cache',
    });
  }
  // Background sync from remote
  useSupportStore.getState().syncFromRemote();
})();
