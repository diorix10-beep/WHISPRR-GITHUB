import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

/* ── Spirit Stage Definitions ── */
export interface SpiritStage {
  stage: number;
  name: string;
  image: string;
  xpRequired: number;
  description: string;
}

export const SPIRIT_STAGES: SpiritStage[] = [
  { stage: 1, name: 'Spark',    image: '/spirits/spark.png',    xpRequired: 0,   description: 'A newborn digital entity. Curious and fragile.' },
  { stage: 2, name: 'Ember',    image: '/spirits/ember.png',    xpRequired: 50,  description: 'Growing limbs and warmth. Eager and enthusiastic.' },
  { stage: 3, name: 'Flame',    image: '/spirits/ember.png',    xpRequired: 150, description: 'Defined form with flowing energy. Confident and alive.' },
  { stage: 4, name: 'Nova',     image: '/spirits/ascended.png', xpRequired: 350, description: 'Radiant form with rune symbols. Powerful and creative.' },
  { stage: 5, name: 'Ascended', image: '/spirits/ascended.png', xpRequired: 500, description: 'Majestic entity with halo crown. Legendary status.' },
];

/* ── Context Type ── */
export interface NexaSpirit {
  id: string;
  stage: number;
  xp: number;
  name: string | null;
}

interface NexaSpiritContextType {
  spirit: NexaSpirit | null;
  loading: boolean;
  currentStage: SpiritStage;
  nextStage: SpiritStage | null;
  progressToNext: number; // 0-100
  refreshSpirit: () => Promise<void>;
}

const NexaSpiritContext = createContext<NexaSpiritContextType | undefined>(undefined);

/* ── Provider ── */
export function NexaSpiritProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [spirit, setSpirit] = useState<NexaSpirit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreate = useCallback(async () => {
    if (!user) { setSpirit(null); setLoading(false); return; }

    try {
      // Try to fetch existing spirit
      const { data, error } = await supabase
        .from('nexa_spirits')
        .select('id, stage, xp, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[NexaSpirit] fetch error:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setSpirit(data);
      } else {
        // Auto-create stage 1 spirit for new users
        const { data: created, error: createErr } = await supabase
          .from('nexa_spirits')
          .insert({ user_id: user.id, stage: 1, xp: 0 })
          .select('id, stage, xp, name')
          .single();

        if (createErr) {
          // Could be a race condition — try fetching again
          const { data: retry } = await supabase
            .from('nexa_spirits')
            .select('id, stage, xp, name')
            .eq('user_id', user.id)
            .maybeSingle();
          setSpirit(retry || null);
        } else {
          setSpirit(created);
        }
      }
    } catch (err) {
      console.error('[NexaSpirit] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrCreate(); }, [fetchOrCreate]);

  // Derived values
  const stageIndex = Math.max(0, Math.min((spirit?.stage ?? 1) - 1, SPIRIT_STAGES.length - 1));
  const currentStage = SPIRIT_STAGES[stageIndex];
  const nextStage = stageIndex < SPIRIT_STAGES.length - 1 ? SPIRIT_STAGES[stageIndex + 1] : null;

  let progressToNext = 100;
  if (nextStage && spirit) {
    const currentMin = currentStage.xpRequired;
    const nextMin = nextStage.xpRequired;
    const range = nextMin - currentMin;
    progressToNext = range > 0 ? Math.min(100, Math.max(0, ((spirit.xp - currentMin) / range) * 100)) : 100;
  }

  return (
    <NexaSpiritContext.Provider value={{
      spirit,
      loading,
      currentStage,
      nextStage,
      progressToNext,
      refreshSpirit: fetchOrCreate,
    }}>
      {children}
    </NexaSpiritContext.Provider>
  );
}

/* ── Hook ── */
export function useNexaSpirit() {
  const ctx = useContext(NexaSpiritContext);
  if (!ctx) throw new Error('useNexaSpirit must be used within NexaSpiritProvider');
  return ctx;
}
