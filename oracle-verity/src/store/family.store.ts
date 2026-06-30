import { create } from 'zustand';

export type CompanionId = 'oracle' | 'anthony' | 'iris' | 'athena' | 'atlas' | 'aegis' | 'whisprr';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  senderId?: CompanionId;
}

interface FamilyState {
  histories: Record<CompanionId, ChatMessage[]>;
  addMessage: (companionId: CompanionId, message: ChatMessage) => void;
  clearHistory: (companionId: CompanionId) => void;
  getHistory: (companionId: CompanionId) => ChatMessage[];
  syncWithSupabase: () => Promise<void>;
}

const INITIAL_HISTORIES: Record<CompanionId, ChatMessage[]> = {
  oracle: [],
  anthony: [],
  iris: [],
  athena: [],
  atlas: [],
  aegis: [],
  whisprr: []
};

function loadHistories(): Record<CompanionId, ChatMessage[]> {
  try {
    const raw = localStorage.getItem('oracle_family_histories');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all roster keys exist
      return {
        ...INITIAL_HISTORIES,
        ...parsed
      };
    }
  } catch {}
  return INITIAL_HISTORIES;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  histories: loadHistories(),
  
  addMessage: (companionId, message) => {
    set((state) => {
      const updated = {
        ...state.histories,
        [companionId]: [...(state.histories[companionId] || []), message]
      };
      localStorage.setItem('oracle_family_histories', JSON.stringify(updated));
      
      // Async write to Supabase
      import('../core/supabase').then(({ dbAddMessage }) => {
        dbAddMessage(companionId, message.role, message.content, message.timestamp, message.senderId);
      });

      return { histories: updated };
    });
  },

  clearHistory: (companionId) => {
    set((state) => {
      const updated = {
        ...state.histories,
        [companionId]: []
      };
      localStorage.setItem('oracle_family_histories', JSON.stringify(updated));
      
      // Async clear in Supabase
      import('../core/supabase').then(({ dbClearHistory }) => {
        dbClearHistory(companionId);
      });

      return { histories: updated };
    });
  },

  getHistory: (companionId) => {
    return get().histories[companionId] || [];
  },

  syncWithSupabase: async () => {
    try {
      const { getSupabaseClient, dbLoadHistory } = await import('../core/supabase');
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const histories = { ...get().histories };
      const memberIds: CompanionId[] = ['iris', 'oracle', 'anthony', 'atlas', 'athena', 'aegis', 'whisprr'];

      for (const id of memberIds) {
        const dbHistory = await dbLoadHistory(id);
        if (dbHistory && dbHistory.length > 0) {
          histories[id] = dbHistory;
        }
      }

      set({ histories });
      localStorage.setItem('oracle_family_histories', JSON.stringify(histories));
      console.log('[Supabase] Chat history synchronized.');
    } catch (e) {
      console.error('[Supabase] Chat history sync failed:', e);
    }
  }
}));
