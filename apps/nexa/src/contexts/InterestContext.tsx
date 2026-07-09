import { createContext, useContext, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type EventType = 'search' | 'profile_visit' | 'community_visit' | 'follow' | 'reaction' | 'comment' | 'post' | 'view_content';
type TargetType = 'whisper' | 'profile' | 'community' | 'search_term';

interface TrackParams {
  eventType: EventType;
  targetType: TargetType;
  targetId?: string;
  interests?: string[];
  mood?: string;
  communityId?: string;
  durationMs?: number;
}

interface InterestContextType {
  track: (params: TrackParams) => void;
  startViewing: (whisperMood?: string, communityId?: string) => () => void;
}

const InterestContext = createContext<InterestContextType | undefined>(undefined);

const BATCH_INTERVAL = 3000;
const SCORE_WEIGHTS: Record<EventType, number> = {
  search: 2.0,
  profile_visit: 1.5,
  community_visit: 2.0,
  follow: 3.0,
  reaction: 2.5,
  comment: 3.0,
  post: 3.5,
  view_content: 1.0,
};

export function InterestProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const batchRef = useRef<TrackParams[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(async () => {
    if (!user || batchRef.current.length === 0) return;

    const batch = [...batchRef.current];
    batchRef.current = [];

    const interactions = batch.map(p => ({
      user_id: user.id,
      event_type: p.eventType,
      target_type: p.targetType,
      target_id: p.targetId || null,
      interests: p.interests || [],
      mood: p.mood || null,
      community_id: p.communityId || null,
      duration_ms: p.durationMs || 0,
    }));

    try {
      await supabase.from('user_interactions').insert(interactions);

      // Update interest scores for each tracked interest
      const scoreUpdates: { interest: string; source: string; weight: number }[] = [];

      batch.forEach(p => {
        const weight = SCORE_WEIGHTS[p.eventType];

        if (p.interests && p.interests.length > 0) {
          p.interests.forEach(interest => {
            scoreUpdates.push({ interest, source: 'organic', weight });
          });
        }

        if (p.mood) {
          scoreUpdates.push({ interest: p.mood, source: 'organic', weight });
        }

        if (p.communityId && p.eventType === 'community_visit') {
          scoreUpdates.push({ interest: p.communityId, source: 'community', weight });
        }

        if (p.eventType === 'follow' && p.interests) {
          p.interests.forEach(interest => {
            scoreUpdates.push({ interest, source: 'follow', weight });
          });
        }

        if (p.eventType === 'search' && p.targetId) {
          scoreUpdates.push({ interest: p.targetId, source: 'search', weight: SCORE_WEIGHTS.search });
        }
      });

      // Batch upsert scores using the postgres function
      for (const update of scoreUpdates) {
        await supabase.rpc('upsert_interest_score', {
          p_user_id: user.id,
          p_interest: update.interest.toLowerCase(),
          p_source: update.source,
          p_weight: update.weight,
        });
      }
    } catch (err) {
      console.error('Interest tracking error:', err);
    }
  }, [user]);

  const scheduleBatch = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flushBatch();
    }, BATCH_INTERVAL);
  }, [flushBatch]);

  const track = useCallback((params: TrackParams) => {
    if (!user) return;
    batchRef.current.push(params);
    scheduleBatch();
  }, [user, scheduleBatch]);

  const startViewing = useCallback((whisperMood?: string, communityId?: string) => {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      if (duration > 2000) {
        track({
          eventType: 'view_content',
          targetType: 'whisper',
          mood: whisperMood || undefined,
          communityId: communityId || undefined,
          durationMs: duration,
          interests: whisperMood ? [whisperMood] : undefined,
        });
      }
    };
  }, [track]);

  return (
    <InterestContext.Provider value={{ track, startViewing }}>
      {children}
    </InterestContext.Provider>
  );
}

export function useInterests() {
  const context = useContext(InterestContext);
  if (!context) throw new Error('useInterests must be used within InterestProvider');
  return context;
}
