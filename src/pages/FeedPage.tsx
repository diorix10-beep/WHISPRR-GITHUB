import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';
import type { Whisper, Profile, Reaction } from '../types';
import { MOODS, type Mood } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { WhisperCard } from '../components/feed/WhisperCard';
import { ComposeWhisper } from '../components/feed/ComposeWhisper';
import { WhisperSkeleton } from '../components/feed/WhisperSkeleton';
import { useIntersectionObserver } from 'react-intersection-observer';

type FeedMode = 'for_you' | 'following';

interface WhisperWithRelations extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
  feed_source?: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [whispers, setWhispers] = useState<WhisperWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('for_you');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [hasInterestData, setHasInterestData] = useState(false);
  const moodScrollRef = useRef<HTMLDivElement>(null);

  // Fetch followed user IDs once
  useEffect(() => {
    if (!user) return;
    const fetchFollowing = async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      if (data) setFollowedIds(data.map(f => f.following_id));
    };
    fetchFollowing();
  }, [user]);

  // Check if user has interest data for personalization
  useEffect(() => {
    if (!user) return;
    const checkInterests = async () => {
      const { count } = await supabase
        .from('user_interest_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setHasInterestData((count || 0) > 0);
    };
    checkInterests();
  }, [user]);

  // Load personalized feed using the Postgres function
  const loadPersonalizedFeed = useCallback(async (filterMood: Mood | null) => {
    if (!user) return;

    try {
      setError(null);

      // Call the personalized feed function
      const { data: feedIds, error: feedError } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user.id,
        p_limit: 50,
        p_mood_filter: filterMood || null,
      });

      if (feedError) throw feedError;

      if (!feedIds || feedIds.length === 0) {
        // Fall back to chronological if no personalized results
        return loadChronologicalFeed(filterMood, 'for_you');
      }

      const whisperIds = feedIds.map((f: any) => f.whisper_id);
      const sourceMap = new Map(feedIds.map((f: any) => [f.whisper_id, f.feed_source]));

      // Fetch full whisper data for the ranked IDs
      const { data: whispersData, error: fetchError } = await supabase
        .from('whispers')
        .select(`
          *,
          profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges),
          reactions(id, whisper_id, user_id, type, created_at)
        `)
        .in('id', whisperIds);

      if (fetchError) throw fetchError;

      if (whispersData && whispersData.length > 0) {
        // Fetch comment counts
        const { data: commentData } = await supabase
          .from('comments')
          .select('whisper_id')
          .in('whisper_id', whisperIds);

        const countMap = new Map<string, number>();
        if (commentData) {
          commentData.forEach(c => {
            countMap.set(c.whisper_id, (countMap.get(c.whisper_id) || 0) + 1);
          });
        }

        // Maintain the ranked order from the function
        const orderMap = new Map(whisperIds.map((id: string, idx: number) => [id, idx]));
        const sorted = [...whispersData].sort((a, b) =>
          (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0)
        );

        const result: WhisperWithRelations[] = sorted.map((w: any) => ({
          ...w,
          profiles: w.profiles,
          reactions: w.reactions || [],
          comment_count: countMap.get(w.id) || 0,
          feed_source: sourceMap.get(w.id) || 'discovery',
        }));

        setWhispers(result);
      } else {
        setWhispers([]);
      }
    } catch (err) {
      console.error('Error loading personalized feed:', err);
      // Fall back to chronological
      await loadChronologicalFeed(filterMood, 'for_you');
    }
  }, [user]);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const { ref: loadMoreRef, inView } = useIntersectionObserver({
    threshold: 0.1,
  });

  // Load chronological feed (fallback for "For You" or used for "Following")
  const loadChronologicalFeed = useCallback(async (filterMood: Mood | null, mode: FeedMode, pageNum: number = 0, isAppend = false) => {
    try {
      setError(null);
      const limit = 20;
      let query = supabase
        .from('whispers')
        .select(`
          *,
          profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges),
          reactions(id, whisper_id, user_id, type, created_at)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      if (filterMood) query = query.eq('mood', filterMood);

      if (mode === 'following' && user) {
        const ids = [...followedIds, user.id];
        query = query.in('user_id', ids);
      }

      const { data: whispersData, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (whispersData && whispersData.length > 0) {
        const whisperIds = whispersData.map(w => w.id);
        const { data: commentData } = await supabase
          .from('comments')
          .select('whisper_id')
          .in('whisper_id', whisperIds);

        const countMap = new Map<string, number>();
        if (commentData) {
          commentData.forEach(c => {
            countMap.set(c.whisper_id, (countMap.get(c.whisper_id) || 0) + 1);
          });
        }

        const result: WhisperWithRelations[] = whispersData.map((w: any) => ({
          ...w,
          profiles: w.profiles,
          reactions: w.reactions || [],
          comment_count: countMap.get(w.id) || 0,
        }));

        if (isAppend) {
          setWhispers(prev => {
            // Deduplicate
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = result.filter(r => !existingIds.has(r.id));
            return [...prev, ...newItems];
          });
        } else {
          setWhispers(result);
        }
        setHasMore(whispersData.length === limit);
      } else {
        if (!isAppend) setWhispers([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load whispers.');
    }
  }, [user, followedIds]);

  const loadWhispers = useCallback(async (filterMood: Mood | null, mode: FeedMode, pageNum: number = 0, isAppend = false) => {
    if (mode === 'for_you' && hasInterestData && pageNum === 0) {
      await loadPersonalizedFeed(filterMood);
      // We don't have pagination for personalized feed yet, so we'll just stop here
      // To properly paginate, we'd fall back to chronological for page > 0, but for simplicity
      // we'll just set hasMore to false for personalized for now, or fetch chronological if they scroll.
      // Actually, let's fetch chronological if pageNum > 0:
      if (pageNum > 0) {
        await loadChronologicalFeed(filterMood, mode, pageNum, isAppend);
      }
    } else {
      await loadChronologicalFeed(filterMood, mode, pageNum, isAppend);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setIsFetchingMore(false);
  }, [hasInterestData, loadPersonalizedFeed, loadChronologicalFeed]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setIsLoading(true);
    loadWhispers(selectedMood, feedMode, 0, false);

    const channel = supabase
      .channel('feed-whispers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whispers' }, () => {
        // Option to show a "New posts available" button instead of auto-refresh
        // For now, auto-refresh page 0
        setPage(0);
        loadWhispers(selectedMood, feedMode, 0, false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedMood, feedMode, loadWhispers]);

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isFetchingMore) {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadWhispers(selectedMood, feedMode, nextPage, true);
    }
  }, [inView, hasMore, isLoading, isFetchingMore, page, selectedMood, feedMode, loadWhispers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Re-check interest data on refresh
    if (user) {
      const { count } = await supabase
        .from('user_interest_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setHasInterestData((count || 0) > 0);
    }
    await loadWhispers(selectedMood, feedMode);
  };

  const handleWhisperDeleted = () => loadWhispers(selectedMood, feedMode);
  const handleReactionChange = () => loadWhispers(selectedMood, feedMode);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="section-title">Your Feed</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors disabled:opacity-50"
          aria-label="Refresh feed"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Feed Mode Toggle */}
      <div className="flex gap-1 mb-4 bg-warm-100 dark:bg-warm-800 p-1 rounded-xl">
        <button
          onClick={() => setFeedMode('for_you')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            feedMode === 'for_you'
              ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm'
              : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
          }`}
          aria-pressed={feedMode === 'for_you'}
        >
          {hasInterestData && <Sparkles size={14} className="text-primary-500" />}
          For You
        </button>
        <button
          onClick={() => setFeedMode('following')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            feedMode === 'following'
              ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm'
              : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
          }`}
          aria-pressed={feedMode === 'following'}
        >
          Following
        </button>
      </div>

      {/* Personalization indicator */}
      {feedMode === 'for_you' && hasInterestData && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <Sparkles size={14} className="text-primary-500 flex-shrink-0" />
          <p className="text-xs text-primary-700 dark:text-primary-300">
            Personalized based on your activity
          </p>
        </div>
      )}

      {/* Mood Filter Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4" ref={moodScrollRef}>
          <button
            onClick={() => setSelectedMood(null)}
            aria-pressed={selectedMood === null}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
              selectedMood === null
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200'
            }`}
          >
            All
          </button>
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              aria-pressed={selectedMood === mood}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                selectedMood === mood
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-warm-100 text-warm-700 dark:bg-warm-700 dark:text-warm-200'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl">
          <p className="mb-3">{error}</p>
          <button onClick={handleRefresh} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && whispers.length === 0 ? (
        <div className="space-y-4 py-4">
          <WhisperSkeleton />
          <WhisperSkeleton />
          <WhisperSkeleton />
        </div>
      ) : whispers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🤫</div>
          <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
            {feedMode === 'following' ? 'Nothing here yet' : 'No whispers yet'}
          </h2>
          <p className="text-warm-600 dark:text-warm-400 mb-6">
            {feedMode === 'following'
              ? 'Follow people from the Discover page to see their whispers here.'
              : selectedMood
                ? `No whispers with the "${selectedMood}" mood. Try a different filter or share one!`
                : 'Be the first to share your thoughts!'}
          </p>
          {feedMode === 'following' ? (
            <a href="/discover" className="btn-primary">Discover People</a>
          ) : (
            <button onClick={() => setShowCompose(true)} className="btn-primary">Share a Whisper</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {whispers.map((whisper) => (
            <WhisperCard
              key={whisper.id}
              whisper={whisper}
              onWhisperDeleted={handleWhisperDeleted}
              onReactionChange={handleReactionChange}
            />
          ))}
          
          {/* Infinite Scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-6 flex justify-center">
              {isFetchingMore ? (
                <div className="flex gap-2 items-center text-primary-500">
                  <div className="animate-bounce w-2 h-2 bg-primary-500 rounded-full" />
                  <div className="animate-bounce w-2 h-2 bg-primary-500 rounded-full" style={{ animationDelay: '100ms' }} />
                  <div className="animate-bounce w-2 h-2 bg-primary-500 rounded-full" style={{ animationDelay: '200ms' }} />
                </div>
              ) : (
                <div className="h-4 w-4" /> // Invisible trigger
              )}
            </div>
          )}
          
          {!hasMore && whispers.length > 0 && (
            <div className="text-center py-8 text-warm-400 text-sm">
              You've reached the end of the feed.
            </div>
          )}
        </div>
      )}

      {/* Floating Compose Button */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 active:scale-95 z-40"
        aria-label="Compose new whisper"
      >
        <Plus size={24} />
      </button>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeWhisper
          onClose={() => setShowCompose(false)}
          onWhisperCreated={() => {
            setShowCompose(false);
            loadWhispers(selectedMood, feedMode);
          }}
        />
      )}
    </div>
  );
}
