import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, RefreshCw, Sparkles, Users, MessageSquare } from 'lucide-react';
import type { Whisper, Profile, Reaction } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { WhisperCard } from '../components/feed/WhisperCard';
import { ComposeWhisper } from '../components/feed/ComposeWhisper';
import { WhisperSkeleton } from '../components/feed/WhisperSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useInView } from 'react-intersection-observer';

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
  const [showCompose, setShowCompose] = useState(false);
  const [initialComposeContent, setInitialComposeContent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [hasInterestData, setHasInterestData] = useState(false);

  // Detect incoming post text from CHIMERA ecosystem share flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newPostText = params.get('newPostText');
    if (newPostText) {
      setInitialComposeContent(newPostText);
      setShowCompose(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
  const loadPersonalizedFeed = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Call the personalized feed function
      const { data: feedIds, error: feedError } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user.id,
        p_limit: 50,
      });

      if (feedError) throw feedError;

      if (!feedIds || feedIds.length === 0) {
        // Fall back to chronological if no personalized results
        return loadChronologicalFeed('for_you');
      }

      const whisperIds = feedIds.map((f: any) => f.whisper_id);
      const sourceMap = new Map(feedIds.map((f: any) => [f.whisper_id, f.feed_source]));

      // Fetch full whisper data for the ranked IDs
      const { data: whispersData, error: fetchError } = await supabase
        .from('whispers')
        .select(`
          *,
          profiles:user_id(id, user_id, display_name, username, photo_url, bio, badges),
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
      await loadChronologicalFeed('for_you');
    }
  }, [user]);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });

  // Load chronological feed (fallback for "For You" or used for "Following")
  const loadChronologicalFeed = useCallback(async (mode: FeedMode, pageNum: number = 0, isAppend = false) => {
    try {
      setError(null);
      const limit = 20;
      let query = supabase
        .from('whispers')
        .select(`
          *,
          profiles:user_id(id, user_id, display_name, username, photo_url, bio, badges),
          reactions(id, whisper_id, user_id, type, created_at)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

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

  const loadWhispers = useCallback(async (mode: FeedMode, pageNum: number = 0, isAppend = false) => {
    if (mode === 'for_you' && hasInterestData && pageNum === 0) {
      await loadPersonalizedFeed();
      // We don't have pagination for personalized feed yet, so we'll just stop here
      // To properly paginate, we'd fall back to chronological for page > 0, but for simplicity
      // we'll just set hasMore to false for personalized for now, or fetch chronological if they scroll.
      // Actually, let's fetch chronological if pageNum > 0:
      if (pageNum > 0) {
        await loadChronologicalFeed(mode, pageNum, isAppend);
      }
    } else {
      await loadChronologicalFeed(mode, pageNum, isAppend);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setIsFetchingMore(false);
  }, [hasInterestData, loadPersonalizedFeed, loadChronologicalFeed]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setIsLoading(true);
    loadWhispers(feedMode, 0, false);

    const channel = supabase
      .channel('feed-whispers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whispers' }, () => {
        // Option to show a "New posts available" button instead of auto-refresh
        // For now, auto-refresh page 0
        setPage(0);
        loadWhispers(feedMode, 0, false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [feedMode, loadWhispers]);

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isFetchingMore) {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadWhispers(feedMode, nextPage, true);
    }
  }, [inView, hasMore, isLoading, isFetchingMore, page, feedMode, loadWhispers]);

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
    await loadWhispers(feedMode);
  };

  const handleWhisperDeleted = () => loadWhispers(feedMode);
  const handleReactionChange = () => loadWhispers(feedMode);

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Your Feed</h1>
          <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">Discover discussions, stories, and updates from creators</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 bg-white/80 dark:bg-warm-850/80 backdrop-blur-md border border-warm-200/80 dark:border-warm-750/70 hover:border-primary-500/50 rounded-xl transition-all shadow-sm text-warm-600 dark:text-warm-300 disabled:opacity-50"
          aria-label="Refresh feed"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary-500' : ''} />
        </button>
      </div>

      {/* Quick Compose Trigger Box */}
      {user && (
        <div 
          onClick={() => setShowCompose(true)}
          className="glass-card p-4 mb-6 rounded-2xl cursor-pointer hover:border-primary-500/40 transition-all group flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <Plus size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-400 dark:text-warm-500 group-hover:text-warm-600 dark:group-hover:text-warm-300 transition-colors">
              Share a whisper, story, or project update...
            </p>
          </div>
          <span className="btn-primary text-xs py-1.5 px-3.5 rounded-xl hidden sm:inline-flex items-center gap-1.5 shadow-sm">
            <span>Post</span>
          </span>
        </div>
      )}

      {/* Feed Mode Toggle */}
      <div className="flex gap-1.5 mb-6 bg-white/60 dark:bg-warm-900/60 p-1.5 rounded-2xl backdrop-blur-md border border-warm-200/60 dark:border-warm-750/60 shadow-sm">
        <button
          onClick={() => setFeedMode('for_you')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            feedMode === 'for_you'
              ? 'bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-primary-500/25'
              : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white hover:bg-warm-100/50 dark:hover:bg-warm-800/50'
          }`}
          aria-pressed={feedMode === 'for_you'}
        >
          <Sparkles size={15} className={feedMode === 'for_you' ? 'text-white' : 'text-primary-500'} />
          <span>For You</span>
        </button>
        <button
          onClick={() => setFeedMode('following')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            feedMode === 'following'
              ? 'bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-primary-500/25'
              : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white hover:bg-warm-100/50 dark:hover:bg-warm-800/50'
          }`}
          aria-pressed={feedMode === 'following'}
        >
          <Users size={15} />
          <span>Following</span>
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



      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl">
          <p className="mb-3">{error}</p>
          <button onClick={handleRefresh} className="text-sm font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {isLoading && whispers.length === 0 ? (
        <div className="space-y-4 py-4">
          <WhisperSkeleton />
          <WhisperSkeleton />
          <WhisperSkeleton />
        </div>
      ) : whispers.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={feedMode === 'following' ? Users : MessageSquare}
            title={feedMode === 'following' ? 'Nothing here yet' : 'No whispers yet'}
            description={
              feedMode === 'following'
                ? 'Follow people from the Discover page to see their whispers here.'
                : 'Be the first to share your thoughts!'
            }
            actionLabel={feedMode === 'following' ? undefined : 'Share a Whisper'}
            onAction={feedMode === 'following' ? undefined : () => setShowCompose(true)}
          />
          {feedMode === 'following' && (
            <div className="flex justify-center mt-4">
              <a href="/discover">
                <Button>Discover People</Button>
              </a>
            </div>
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
        className="fixed bottom-24 right-4 lg:bottom-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 active:scale-95 z-50"
        aria-label="Compose new whisper"
      >
        <Plus size={24} />
      </button>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeWhisper
          initialContent={initialComposeContent}
          onClose={() => {
            setShowCompose(false);
            setInitialComposeContent(undefined);
          }}
          onWhisperCreated={() => {
            setShowCompose(false);
            setInitialComposeContent(undefined);
            loadWhispers(feedMode);
          }}
        />
      )}
    </div>
  );
}
