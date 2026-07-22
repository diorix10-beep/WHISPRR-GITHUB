import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search, X, Users, ChevronRight, Sparkles,
  Loader2, RefreshCw, Heart, MessageSquare, ExternalLink,
  TrendingUp, Star, BookOpen, Settings2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { supabase } from '../lib/supabase';
import type { Profile, Community, Whisper, Reaction } from '../types';
import { UserCard } from '../components/discover/UserCard';
import { Avatar } from '../components/common/Avatar';
import { WhisperCard } from '../components/feed/WhisperCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton, WhisperSkeleton } from '../components/common/LoadingSkeleton';
import { CommunityAvatar } from '../components/communities/CommunityAvatar';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

type SearchTab = 'users' | 'communities' | 'posts' | 'stories' | 'characters' | 'worlds';

interface CommunityWithCount extends Community {
  member_count?: number;
}

interface WhisperWithRelations extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const { user, profile } = useAuth();
  const { track } = useInterests();

  // Search state
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [searchTab, setSearchTab] = useState<SearchTab>('users');
  const [isSearchActive, setIsSearchActive] = useState(!!qParam);
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityWithCount[]>([]);
  const [postResults, setPostResults] = useState<WhisperWithRelations[]>([]);
  const [storyResults, setStoryResults] = useState<any[]>([]);
  const [characterResults, setCharacterResults] = useState<any[]>([]);
  const [worldResults, setWorldResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Discovery data
  const [trendingCreators, setTrendingCreators] = useState<Profile[]>([]);
  const [recommendedCreators, setRecommendedCreators] = useState<Profile[]>([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityWithCount[]>([]);
  const [popularPosts, setPopularPosts] = useState<WhisperWithRelations[]>([]);
  const [chimeraStories, setChimeraStories] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchFollowingStatus = useCallback(async (userIds: string[]) => {
    if (!user || userIds.length === 0) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', userIds);
    if (data) {
      const map: Record<string, boolean> = {};
      userIds.forEach(id => { map[id] = data.some(f => f.following_id === id); });
      setFollowingMap(prev => ({ ...prev, ...map }));
    }
  }, [user]);

  // Trending Creators — most followed accounts the user isn't following yet
  const loadTrendingCreators = useCallback(async () => {
    if (!user) return;
    try {
      const { data: followedData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followedIds = followedData?.map(f => f.following_id) || [];

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .order('follower_count', { ascending: false })
        .limit(12);

      if (data) {
        const unfollowed = data.filter(p => !followedIds.includes(p.user_id));
        setTrendingCreators(unfollowed.slice(0, 8));
        await fetchFollowingStatus(unfollowed.map(p => p.user_id));
      }
    } catch (err) {
      console.error('Error loading trending creators:', err);
    }
  }, [user, fetchFollowingStatus]);

  // Recommended Creators — personalized by shared interests
  const loadRecommendedCreators = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const userInterests = profile.interests || [];
      if (userInterests.length === 0) return;

      const { data: followedData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followedIds = followedData?.map(f => f.following_id) || [];

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .contains('interests', [userInterests[0]])
        .limit(10);

      if (data) {
        const filtered = data.filter(p => !followedIds.includes(p.user_id));
        setRecommendedCreators(filtered.slice(0, 6));
        await fetchFollowingStatus(filtered.map(p => p.user_id));
      }
    } catch (err) {
      console.error('Error loading recommended creators:', err);
    }
  }, [user, profile, fetchFollowingStatus]);

  // Recommended Communities
  const loadRecommendedCommunities = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const { data: recData } = await supabase.rpc('get_recommended_communities', {
        p_user_id: user.id,
        p_limit: 6,
      });

      const mutedComms = profile.muted_communities || [];
      let finalIds: string[] = [];
      if (recData && recData.length > 0) {
        finalIds = recData.map((r: any) => r.community_id).filter((id: string) => !mutedComms.includes(id));
      }

      if (finalIds.length > 0) {
        const { data } = await supabase
          .from('communities')
          .select('*, community_members(count)')
          .in('id', finalIds);
        if (data) {
          const orderMap = new Map(finalIds.map((id: string, idx: number) => [id, idx]));
          const sorted = [...data].sort((a, b) => (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0));
          setRecommendedCommunities(sorted.map((c: any) => ({
            ...c, member_count: c.community_members?.[0]?.count || 0,
          })));
          return;
        }
      }

      // Fallback to recent communities
      const { data } = await supabase
        .from('communities')
        .select('*, community_members(count)')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) {
        const filtered = data.filter(c => !mutedComms.includes(c.id));
        setRecommendedCommunities(filtered.map((c: any) => ({
          ...c, member_count: c.community_members?.[0]?.count || 0,
        })));
      }
    } catch (err) {
      console.error('Error loading communities:', err);
    }
  }, [user, profile]);

  // Popular Posts — trending by reactions + comments
  const loadPopularPosts = useCallback(async () => {
    try {
      const { data: trendData, error } = await supabase.rpc('get_trending_discussions', {
        p_limit: 6,
      });
      if (error) throw error;

      if (trendData && trendData.length > 0) {
        const whisperIds = trendData.map((t: any) => t.whisper_id);
        const { data: whispers } = await supabase
          .from('whispers')
          .select(`
            *,
            profiles:user_id(id, user_id, display_name, username, photo_url, bio, badges),
            reactions(id, whisper_id, user_id, type, created_at)
          `)
          .in('id', whisperIds);

        if (whispers) {
          const orderMap = new Map(whisperIds.map((id: string, idx: number) => [id, idx]));
          const sorted = [...whispers].sort((a, b) => (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0));
          const trendMap = new Map(trendData.map((t: any) => [t.whisper_id, t.comment_count]));
          setPopularPosts(sorted.map((w: any) => ({
            ...w,
            comment_count: Number(trendMap.get(w.id)) || 0,
          })));
        }
      }
    } catch (err) {
      console.error('Error loading popular posts:', err);
    }
  }, []);

  // CHIMERA Stories
  const loadChimeraStories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setChimeraStories(data);
    } catch (err) {
      console.error('Error loading stories:', err);
    }
  }, []);

  const loadAllDiscoveryData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadTrendingCreators(),
      loadRecommendedCreators(),
      loadRecommendedCommunities(),
      loadPopularPosts(),
      loadChimeraStories(),
    ]);
    setLoading(false);
  }, [loadTrendingCreators, loadRecommendedCreators, loadRecommendedCommunities, loadPopularPosts, loadChimeraStories]);

  useEffect(() => {
    loadAllDiscoveryData();
  }, [loadAllDiscoveryData]);

  // Search logic
  const executeSearch = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setPostResults([]);
      setStoryResults([]);
      setCharacterResults([]);
      setWorldResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();

    const [usersRes, communitiesRes, postsRes, storiesRes, charactersRes, worldsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%`)
        .limit(15),
      supabase
        .from('communities')
        .select('*, community_members(count)')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,interest.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('whispers')
        .select(`
          *,
          profiles:user_id(id, user_id, display_name, username, photo_url, bio, badges),
          reactions(id, whisper_id, user_id, type, created_at)
        `)
        .ilike('content', `%${q}%`)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('stories')
        .select('*')
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
        .limit(8),
      supabase
        .from('ai_characters')
        .select('*')
        .or(`short_description.ilike.%${q}%,greeting.ilike.%${q}%`)
        .limit(8),
      supabase
        .from('worlds')
        .select('*')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(8),
    ]);

    if (usersRes.data) {
      setUserResults(usersRes.data);
      await fetchFollowingStatus(usersRes.data.map((u: Profile) => u.user_id));
    }
    if (communitiesRes.data) {
      setCommunityResults(communitiesRes.data.map((c: any) => ({
        ...c, member_count: c.community_members?.[0]?.count || 0,
      })));
    }
    if (postsRes.data) {
      setPostResults(postsRes.data.map((w: any) => ({ ...w, comment_count: 0 })));
    }
    if (storiesRes.data) setStoryResults(storiesRes.data);
    if (charactersRes.data) setCharacterResults(charactersRes.data);
    if (worldsRes.data) setWorldResults(worldsRes.data);

    track({ eventType: 'search', targetType: 'search_term', targetId: q });
    setSearchLoading(false);
  }, [user, track, fetchFollowingStatus]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setPostResults([]);
      setStoryResults([]);
      setCharacterResults([]);
      setWorldResults([]);
      setIsSearchActive(false);
      return;
    }
    setIsSearchActive(true);
    searchTimeoutRef.current = setTimeout(() => executeSearch(searchQuery), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, executeSearch]);

  const handleFollowToggle = useCallback(async (targetUserId: string) => {
    if (!user || !profile) return;
    const isCurrentlyFollowing = followingMap[targetUserId] || false;
    try {
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', user.id).eq('following_id', targetUserId);
        setFollowingMap(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
        try {
          await supabase.from('notifications').insert({
            user_id: targetUserId, actor_id: user.id, type: 'follow', reference_id: null,
          });
        } catch { /* ignore notification failure */ }
        setFollowingMap(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  }, [user, profile, followingMap]);

  if (!user || !profile) return null;

  if (loading) {
    return (
      <div className="page-container max-w-4xl space-y-8">
        <LoadingSkeleton height={48} width="60%" className="mb-4" />
        <LoadingSkeleton height={52} width="100%" className="mb-6 rounded-2xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4].map(i => <LoadingSkeleton key={i} height={160} width={140} className="rounded-2xl flex-shrink-0" />)}
        </div>
        <WhisperSkeleton />
        <WhisperSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="section-title">Discover</h1>
          <p className="text-sm text-warm-500 mt-0.5">Creators, communities, and stories</p>
        </div>
        <Link
          to="/settings?section=discovery"
          className="flex items-center gap-1.5 text-xs font-semibold text-warm-500 hover:text-warm-800 dark:hover:text-warm-200 transition-colors px-3 py-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800"
          title="Discovery Preferences"
        >
          <Settings2 size={15} />
          <span className="hidden sm:inline">Preferences</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search creators, communities, posts, stories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── SEARCH RESULTS ─── */}
      {isSearchActive ? (
        <div className="space-y-4">
          {/* Search tabs */}
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-1 p-1 bg-warm-100 dark:bg-warm-850 rounded-xl">
            {([
              { key: 'users' as SearchTab, label: 'People', count: userResults.length },
              { key: 'communities' as SearchTab, label: 'Communities', count: communityResults.length },
              { key: 'posts' as SearchTab, label: 'Posts', count: postResults.length },
              { key: 'stories' as SearchTab, label: 'Stories', count: storyResults.length },
              { key: 'characters' as SearchTab, label: 'Characters', count: characterResults.length },
              { key: 'worlds' as SearchTab, label: 'Worlds', count: worldResults.length },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setSearchTab(tab.key)}
                className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  searchTab === tab.key
                    ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {searchLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : searchTab === 'users' ? (
            <div className="grid gap-3">
              {userResults.length > 0 ? userResults.map(p => (
                <UserCard
                  key={p.user_id}
                  profile={p}
                  currentUserId={user.id}
                  currentInterests={profile.interests || []}
                  isFollowing={followingMap[p.user_id] || false}
                  onFollowToggle={() => handleFollowToggle(p.user_id)}
                />
              )) : (
                <div className="text-center py-12 text-warm-500">No people found matching "{searchQuery}"</div>
              )}
            </div>
          ) : searchTab === 'communities' ? (
            <div className="space-y-2">
              {communityResults.length > 0 ? communityResults.map(c => (
                <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
              )) : (
                <div className="text-center py-12 text-warm-500">No communities found matching "{searchQuery}"</div>
              )}
            </div>
          ) : searchTab === 'posts' ? (
            <div className="space-y-3">
              {postResults.length > 0 ? postResults.map(w => (
                <WhisperCard key={w.id} whisper={w} />
              )) : (
                <div className="text-center py-12 text-warm-500">No posts found matching "{searchQuery}"</div>
              )}
            </div>
          ) : searchTab === 'stories' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {storyResults.length > 0 ? storyResults.map(s => (
                <StoryCard key={s.id} story={s} chimeraUrl={chimeraUrl} />
              )) : (
                <div className="text-center py-12 text-warm-500 col-span-2">No stories found matching "{searchQuery}"</div>
              )}
            </div>
          ) : searchTab === 'characters' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {characterResults.length > 0 ? characterResults.map(c => (
                <div key={c.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-white mb-1">🎭 {c.short_description || 'Unnamed Character'}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">AI Character · CHIMERA</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{c.greeting}</p>
                  </div>
                  <a href={`${chimeraUrl}/chat/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Open in CHIMERA <ExternalLink size={12} />
                  </a>
                </div>
              )) : (
                <div className="text-center py-12 text-warm-500 col-span-2">No characters found matching "{searchQuery}"</div>
              )}
            </div>
          ) : searchTab === 'worlds' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {worldResults.length > 0 ? worldResults.map(w => (
                <div key={w.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-warm-900 dark:text-white mb-1">🗺️ {w.name}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">World · CHIMERA</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{w.description}</p>
                  </div>
                  <a href={`${chimeraUrl}/worlds`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Explore in CHIMERA <ExternalLink size={12} />
                  </a>
                </div>
              )) : (
                <div className="text-center py-12 text-warm-500 col-span-2">No worlds found matching "{searchQuery}"</div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        /* ─── DISCOVERY CONTENT ─── */
        <div className="space-y-10">

          {/* Trending Creators */}
          {trendingCreators.length > 0 && (
            <section>
              <SectionHeader
                icon={<TrendingUp size={16} className="text-rose-500" />}
                title="Trending Creators"
                subtitle="Creators making waves right now"
              />
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {trendingCreators.map(p => (
                  <CreatorCard
                    key={p.user_id}
                    profile={p}
                    isFollowing={followingMap[p.user_id] || false}
                    onFollowToggle={() => handleFollowToggle(p.user_id)}
                    onClick={() => navigate(`/profile/${p.username}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Creators */}
          {recommendedCreators.length > 0 && (
            <section>
              <SectionHeader
                icon={<Sparkles size={16} className="text-primary-500" />}
                title="Recommended For You"
                subtitle="Creators you might enjoy based on your activity"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedCreators.map(p => (
                  <UserCard
                    key={p.user_id}
                    profile={p}
                    currentUserId={user.id}
                    currentInterests={profile.interests || []}
                    isFollowing={followingMap[p.user_id] || false}
                    onFollowToggle={() => handleFollowToggle(p.user_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Communities */}
          {recommendedCommunities.length > 0 && (
            <section>
              <SectionHeader
                icon={<Users size={16} className="text-indigo-500" />}
                title="Communities to Join"
                subtitle="Find your creative tribe"
                action={{ label: 'Browse All', href: '/communities' }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedCommunities.map(c => (
                  <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Popular Posts */}
          {popularPosts.length > 0 && (
            <section>
              <SectionHeader
                icon={<Heart size={16} className="text-pink-500" />}
                title="Popular Right Now"
                subtitle="Posts generating the most conversations"
                action={{ label: 'Refresh', onClick: loadPopularPosts }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularPosts.map(w => (
                  <div
                    key={w.id}
                    onClick={() => navigate(`/whisper/${w.id}`)}
                    className="cursor-pointer group bg-white dark:bg-warm-800 p-4 rounded-3xl border border-warm-200/50 dark:border-warm-700/50 hover:shadow-md hover:border-warm-300 dark:hover:border-warm-600 transition-all"
                  >
                    <p className="font-serif text-warm-800 dark:text-warm-100 mb-3 line-clamp-3 text-sm leading-relaxed">
                      "{w.content}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-warm-500">
                      <div className="flex items-center gap-2">
                        <Avatar photoUrl={w.profiles.photo_url} size="xs" />
                        <span className="font-semibold text-warm-700 dark:text-warm-300">@{w.profiles.username}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Heart size={11} /> {w.reactions?.length || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} /> {w.comment_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stories from CHIMERA */}
          {chimeraStories.length > 0 && (
            <section>
              <SectionHeader
                icon={<BookOpen size={16} className="text-amber-500" />}
                title="Stories from CHIMERA"
                subtitle="Original stories crafted by creators"
                action={{ label: 'Explore More', href: chimeraUrl + '/plots', external: true }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chimeraStories.map(s => (
                  <StoryCard key={s.id} story={s} chimeraUrl={chimeraUrl} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {trendingCreators.length === 0 && recommendedCreators.length === 0 && recommendedCommunities.length === 0 && (
            <EmptyState
              icon={Star}
              title="Your Discover feed is warming up"
              description="Interact with posts and follow creators to personalize what you see here."
              actionLabel="Find Communities"
              onAction={() => navigate('/communities')}
            />
          )}

        </div>
      )}
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, subtitle, action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; href?: string; onClick?: () => void; external?: boolean };
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-xs text-warm-500 ml-6">{subtitle}</p>}
      </div>
      {action && (
        action.href ? (
          <a
            href={action.href}
            target={action.external ? '_blank' : undefined}
            rel={action.external ? 'noopener noreferrer' : undefined}
            className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 flex-shrink-0 mt-0.5"
          >
            {action.label}
            {action.external && <ExternalLink size={11} />}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="text-xs font-semibold text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 transition-colors flex items-center gap-1 flex-shrink-0 mt-0.5"
          >
            <RefreshCw size={11} />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

function CreatorCard({
  profile: p,
  isFollowing,
  onFollowToggle,
  onClick,
}: {
  profile: Profile;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onClick: () => void;
}) {

  return (
    <div className="flex-shrink-0 w-40 snap-start rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 overflow-hidden hover:shadow-md hover:border-warm-300 dark:hover:border-warm-600 transition-all">
      <div className="pt-4 pb-2 px-3 flex flex-col items-center cursor-pointer" onClick={onClick}>
        <Avatar photoUrl={p.photo_url} size="lg" />
        <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm mt-2 truncate w-full text-center">
          {p.display_name}
        </p>
        <p className="text-xs text-warm-500 truncate w-full text-center">@{p.username}</p>
        {p.creator_role_1 && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium text-center">
            {p.creator_role_1}
          </p>
        )}
      </div>
      <div className="px-3 pb-3">
        <button
          onClick={e => { e.stopPropagation(); onFollowToggle(); }}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isFollowing
              ? 'bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-200'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {isFollowing ? 'Following' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

function StoryCard({ story: s, chimeraUrl }: { story: any; chimeraUrl: string }) {
  return (
    <div className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📖</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Story</span>
        </div>
        <h4 className="font-serif font-bold text-warm-900 dark:text-white mb-2 line-clamp-2 text-sm leading-snug">{s.title}</h4>
        {s.summary && <p className="text-xs text-warm-500 line-clamp-3 leading-relaxed mb-4">{s.summary}</p>}
      </div>
      <a
        href={`${chimeraUrl}/plots`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1 group-hover:text-primary-600 transition-colors"
      >
        Read in CHIMERA <ExternalLink size={11} />
      </a>
    </div>
  );
}

function CommunityRow({ community: c, onClick }: { community: CommunityWithCount; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-md hover:border-warm-300 dark:hover:border-warm-600 transition-all text-left"
    >
      <CommunityAvatar size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm truncate">{c.name}</p>
        {c.description && <p className="text-xs text-warm-500 line-clamp-1">{c.description}</p>}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
            {c.interest}
          </span>
          <span className="text-xs text-warm-500">{c.member_count || 0} members</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-warm-400 flex-shrink-0" />
    </button>
  );
}
