import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MemoryEntry {
  id: string;
  type: 'project' | 'decision' | 'milestone' | 'update';
  content: string;
  timestamp: string;
}

export interface MemoryState {
  memories: MemoryEntry[];
  addMemory: (type: MemoryEntry['type'], content: string) => void;
  removeMemory: (id: string) => void;
  clearMemories: () => void;
  syncWithSupabase: () => Promise<void>;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [
        {
          id: 'mem-1',
          type: 'project',
          content: 'Oracle Systems established as central AI hub.',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'mem-2',
          type: 'decision',
          content: 'Migrated Support Email to Vercel Edge Functions to bypass CORS.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'mem-3',
          type: 'milestone',
          content: 'Telegram Integration Live.',
          timestamp: new Date().toISOString(),
        }
      ],

      addMemory: (type, content) => {
        const id = `mem-${Date.now()}`;
        set((state) => ({
          memories: [
            {
              id,
              type,
              content,
              timestamp: new Date().toISOString(),
            },
            ...state.memories
          ].slice(0, 50)
        }));

        // Async write to Supabase
        import('../core/supabase').then(({ dbAddMemory }) => {
          dbAddMemory('oracle', type, content);
        });
      },

      removeMemory: (id) => {
        set((state) => ({
          memories: state.memories.filter(m => m.id !== id)
        }));

        // Async remove in Supabase
        import('../core/supabase').then(({ dbRemoveMemory }) => {
          dbRemoveMemory(id);
        });
      },

      clearMemories: () => {
        set({ memories: [] });

        // Async clear in Supabase
        import('../core/supabase').then(({ dbClearMemories }) => {
          dbClearMemories();
        });
      },

      syncWithSupabase: async () => {
        try {
          const { getSupabaseClient, dbLoadMemories } = await import('../core/supabase');
          const supabase = getSupabaseClient();
          if (!supabase) return;

          const dbMemories = await dbLoadMemories();
          if (dbMemories && dbMemories.length > 0) {
            set({ memories: dbMemories });
          }
          console.log('[Supabase] Memories synchronized.');
        } catch (e) {
          console.error('[Supabase] Memories sync failed:', e);
        }
      }
    }),
    {
      name: 'oracle-memory-storage',
    }
  )
);
