import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, TrendingUp, Users, ChevronRight, Sparkles,
  Music, Gamepad2, Monitor, Dumbbell, Plane, Bike, Film,
  Trophy, Briefcase, Video, Hash, Loader2, RefreshCw,
  VolumeX, Trash2, Heart, MessageSquare, Compass, EyeOff,
  ExternalLink, BookOpen, Book, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { INTERESTS } from '../types';
import type { Profile, Community, Whisper, Reaction } from '../types';
import { UserCard } from '../components/discover/UserCard';
import { Avatar } from '../components/common/Avatar';
import { WhisperCard } from '../components/feed/WhisperCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton, WhisperSkeleton } from '../components/common/LoadingSkeleton';
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

type SearchTab = 'users' | 'communities' | 'interests' | 'stories' | 'characters' | 'worlds' | 'lorebooks';

interface CommunityWithCount extends Community {
  member_count?: number;
}

interface WhisperWithRelations extends Whisper {
  profiles: Profile;
  reactions: Reaction[];
  comment_count: number;
}

const INTEREST_ICONS: Record<string, typeof Music> = {
  Music, Gaming: Gamepad2, Technology: Monitor, Fitness: Dumbbell,
  Travel: Plane, Motorcycles: Bike, Movies: Film, Sports: Trophy,
  Business: Briefcase, 'Content Creation': Video,
};

const FEATURED_INTERESTS = [
  'Music', 'Gaming', 'Technology', 'Fitness', 'Travel',
  'Motorcycles', 'Movies', 'Sports', 'Business', 'Content Creation',
] as const;

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const { user, profile, updateProfile } = useAuth();
  const { track } = useInterests();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'explore' | 'for_you' | 'controls'>('explore');

  // Search state
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [searchTab, setSearchTab] = useState<SearchTab>('users');
  const [isSearchActive, setIsSearchActive] = useState(!!qParam);
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityWithCount[]>([]);
  const [interestResults, setInterestResults] = useState<string[]>([]);
  const [storyResults, setStoryResults] = useState<any[]>([]);
  const [characterResults, setCharacterResults] = useState<any[]>([]);
  const [worldResults, setWorldResults] = useState<any[]>([]);
  const [lorebookResults, setLorebookResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Discovery lists state
  const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityWithCount[]>([]);
  const [trendingDiscussions, setTrendingDiscussions] = useState<WhisperWithRelations[]>([]);
  const [personalizedWhispers, setPersonalizedWhispers] = useState<WhisperWithRelations[]>([]);
  
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

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

  // Recommended Communities
  const loadRecommendedCommunities = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const { data: recData } = await supabase.rpc('get_recommended_communities', {
        p_user_id: user.id,
        p_limit: 8,
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

      // Fallback
      const { data } = await supabase
        .from('communities')
        .select('*, community_members(count)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) {
        const filteredFallback = data.filter(c => !mutedComms.includes(c.id));
        setRecommendedCommunities(filteredFallback.map((c: any) => ({
          ...c, member_count: c.community_members?.[0]?.count || 0,
        })));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user, profile]);

  // Trending Discussions (conversation depth and reply count)
  const loadTrendingDiscussions = useCallback(async () => {
    try {
      const { data: trendData, error } = await supabase.rpc('get_trending_discussions', {
        p_limit: 5
      });
      if (error) throw error;

      if (trendData && trendData.length > 0) {
        const whisperIds = trendData.map((t: any) => t.whisper_id);
        const { data: whispers } = await supabase
          .from('whispers')
          .select(`
            *,
            profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges),
            reactions(id, whisper_id, user_id, type, created_at)
          `)
          .in('id', whisperIds);

        if (whispers) {
          const orderMap = new Map(whisperIds.map((id: string, idx: number) => [id, idx]));
          const sorted = [...whispers].sort((a, b) => (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0));
          
          const trendMap = new Map(trendData.map((t: any) => [t.whisper_id, t.comment_count]));
          
          setTrendingDiscussions(sorted.map((w: any) => ({
            ...w,
            comment_count: Number(trendMap.get(w.id)) || 0
          })));
        }
      }
    } catch (err) {
      console.error('Error loading trending discussions:', err);
    }
  }, []);



  // Personalized Feed
  const loadPersonalizedFeed = useCallback(async () => {
    if (!user) return;
    try {
      const { data: feedIds, error: feedError } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user.id,
        p_limit: 20
      });
      if (feedError) throw feedError;

      if (feedIds && feedIds.length > 0) {
        const whisperIds = feedIds.map((f: any) => f.whisper_id);
        const { data: whispersData } = await supabase
          .from('whispers')
          .select(`
            *,
            profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges),
            reactions(id, whisper_id, user_id, type, created_at)
          `)
          .in('id', whisperIds);

        if (whispersData) {
          const { data: commentData } = await supabase
            .from('comments')
            .select('whisper_id')
            .in('whisper_id', whisperIds);

          const countMap = new Map<string, number>();
          commentData?.forEach(c => {
            countMap.set(c.whisper_id, (countMap.get(c.whisper_id) || 0) + 1);
          });

          const orderMap = new Map(whisperIds.map((id: string, idx: number) => [id, idx]));
          const sorted = [...whispersData].sort((a, b) => (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0));

          setPersonalizedWhispers(sorted.map((w: any) => ({
            ...w,
            comment_count: countMap.get(w.id) || 0
          })));
        }
      } else {
        // Fallback to latest
        const { data } = await supabase
          .from('whispers')
          .select(`
            *,
            profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url, bio, mood, badges),
            reactions(id, whisper_id, user_id, type, created_at)
          `)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (data) {
          setPersonalizedWhispers(data.map((w: any) => ({
            ...w,
            comment_count: 0
          })));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const loadAllDiscoveryData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadRecommendedCommunities(),
      loadTrendingDiscussions(),
      loadPersonalizedFeed()
    ]);
    setLoading(false);
  }, [
    loadRecommendedCommunities,
    loadTrendingDiscussions,
    loadPersonalizedFeed
  ]);

  useEffect(() => {
    loadAllDiscoveryData();
  }, [loadAllDiscoveryData]);

  // Controls Handlers
  const handleResetRecommendations = async () => {
    if (!user) return;
    setResetting(true);
    try {
      const { error } = await supabase.rpc('reset_user_interests', { p_user_id: user.id });
      if (error) throw error;
      showToast('Recommendation algorithm reset successfully!', 'success');
      await loadAllDiscoveryData();
    } catch (err) {
      console.error(err);
      showToast('Failed to reset recommendations', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleInterestToggle = async (interest: string) => {
    if (!profile) return;
    const current = profile.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    
    try {
      await updateProfile({ interests: updated });
      showToast(`${interest} ${current.includes(interest) ? 'unfollowed' : 'followed'}`, 'success');
    } catch {
      showToast('Failed to update interest', 'error');
    }
  };

  const handleMuteInterest = async (interest: string) => {
    if (!profile) return;
    const current = profile.muted_interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    
    // Also remove from followed interests if muting
    let updatedFollowed = profile.interests || [];
    if (!current.includes(interest)) {
      updatedFollowed = updatedFollowed.filter(i => i !== interest);
    }

    try {
      await updateProfile({ 
        muted_interests: updated,
        interests: updatedFollowed
      });
      showToast(`${interest} ${current.includes(interest) ? 'unmuted' : 'muted'}`, 'success');
    } catch {
      showToast('Failed to mute topic', 'error');
    }
  };

  const handleMuteCommunity = async (commId: string) => {
    if (!profile) return;
    const current = profile.muted_communities || [];
    const updated = current.includes(commId)
      ? current.filter(id => id !== commId)
      : [...current, commId];

    try {
      await updateProfile({ muted_communities: updated });
      showToast(`Community ${current.includes(commId) ? 'unmuted' : 'muted'}`, 'success');
      loadRecommendedCommunities();
    } catch {
      showToast('Failed to mute community', 'error');
    }
  };

  // Search logic
  const executeSearch = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setInterestResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();

    const [usersRes, communitiesRes, storiesRes, charactersRes, worldsRes, lorebooksRes] = await Promise.all([
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
        .from('stories')
        .select('*')
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('ai_characters')
        .select('*')
        .or(`short_description.ilike.%${q}%,greeting.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('worlds')
        .select('*')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('lorebooks')
        .select('*')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(10),
    ]);

    const matchedInterests = INTERESTS.filter(i =>
      i.toLowerCase().includes(q)
    );
    setInterestResults(matchedInterests);

    if (usersRes.data) {
      setUserResults(usersRes.data);
      await fetchFollowingStatus(usersRes.data.map((u: Profile) => u.user_id));
    }

    if (communitiesRes.data) {
      setCommunityResults(communitiesRes.data.map((c: any) => ({
        ...c, member_count: c.community_members?.[0]?.count || 0,
      })));
    }

    if (storiesRes.data) setStoryResults(storiesRes.data);
    if (charactersRes.data) setCharacterResults(charactersRes.data);
    if (worldsRes.data) setWorldResults(worldsRes.data);
    if (lorebooksRes.data) setLorebookResults(lorebooksRes.data);

    track({
      eventType: 'search',
      targetType: 'search_term',
      targetId: q,
    });

    setSearchLoading(false);
  }, [user, track, fetchFollowingStatus]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setInterestResults([]);
      setStoryResults([]);
      setCharacterResults([]);
      setWorldResults([]);
      setLorebookResults([]);
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

  if (!user || !profile) {
    // ProtectedRoute handles the redirect, so we just return null here to avoid flashing incorrect messages.
    return null;
  }

  if (loading) {
    return (
      <div className="page-container max-w-4xl space-y-4">
        <LoadingSkeleton height={40} width="30%" className="mb-6" />
        <WhisperSkeleton />
        <WhisperSkeleton />
        <WhisperSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Discover</h1>
          <p className="text-sm text-warm-500 mt-1">Intelligent, human-centered discovery and controls</p>
        </div>

        {/* Tab switcher */}
        {!isSearchActive && (
          <div className="flex bg-warm-100 dark:bg-warm-850 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'explore' 
                  ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm' 
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('for_you')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'for_you' 
                  ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm' 
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'controls' 
                  ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm' 
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              Controls
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users, communities, or topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Render */}
      {isSearchActive ? (
        <div className="space-y-4">
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-1 p-1 bg-warm-100 dark:bg-warm-850 rounded-xl">
            {([
              { key: 'users' as SearchTab, label: 'Users', count: userResults.length },
              { key: 'communities' as SearchTab, label: 'Communities', count: communityResults.length },
              { key: 'interests' as SearchTab, label: 'Interests', count: interestResults.length },
              { key: 'stories' as SearchTab, label: 'Stories', count: storyResults.length },
              { key: 'characters' as SearchTab, label: 'Characters', count: characterResults.length },
              { key: 'worlds' as SearchTab, label: 'Worlds', count: worldResults.length },
              { key: 'lorebooks' as SearchTab, label: 'Lorebooks', count: lorebookResults.length },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setSearchTab(tab.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : searchTab === 'users' ? (
            <div className="grid gap-3">
              {userResults.map(p => (
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
          ) : searchTab === 'communities' ? (
            <div className="space-y-2">
              {communityResults.map(c => (
                <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
              ))}
            </div>
          ) : searchTab === 'stories' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {storyResults.map(s => (
                <div key={s.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-warm-900 dark:text-white mb-1">📖 {s.title}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">Story</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{s.summary}</p>
                  </div>
                  <a href={`${chimeraUrl}/plots`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Read Story <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              {storyResults.length === 0 && <div className="text-center py-8 text-warm-500 col-span-2">No matching stories found.</div>}
            </div>
          ) : searchTab === 'characters' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {characterResults.map(c => (
                <div key={c.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-white mb-1">🎭 {c.short_description || 'Unnamed Character'}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">AI Character</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{c.greeting}</p>
                  </div>
                  <a href={`${chimeraUrl}/chat/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Chat in CHIMERA <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              {characterResults.length === 0 && <div className="text-center py-8 text-warm-500 col-span-2">No matching characters found.</div>}
            </div>
          ) : searchTab === 'worlds' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {worldResults.map(w => (
                <div key={w.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-warm-900 dark:text-white mb-1">🗺️ {w.name}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">World</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{w.description}</p>
                  </div>
                  <a href={`${chimeraUrl}/worlds`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Explore World <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              {worldResults.length === 0 && <div className="text-center py-8 text-warm-500 col-span-2">No matching worlds found.</div>}
            </div>
          ) : searchTab === 'lorebooks' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {lorebookResults.map(l => (
                <div key={l.id} className="p-4 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-warm-900 dark:text-white mb-1">📚 {l.title}</h4>
                    <p className="text-xs font-medium text-warm-500 mb-2">Lorebook &bull; {l.entry_count || 0} entries</p>
                    <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">{l.description}</p>
                  </div>
                  <a href={`${chimeraUrl}/lorebooks`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary-500 hover:underline inline-flex items-center gap-1">
                    Manage Lorebook <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              {lorebookResults.length === 0 && <div className="text-center py-8 text-warm-500 col-span-2">No matching lorebooks found.</div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interestResults.map(interest => (
                <button
                  key={interest}
                  onClick={() => { setSearchQuery(interest); setSearchTab('communities'); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-md transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                    {INTEREST_ICONS[interest]
                      ? (() => { const Icon = INTEREST_ICONS[interest]; return <Icon size={16} className="text-primary-600 dark:text-primary-300" />; })()
                      : <Hash size={16} className="text-primary-600 dark:text-primary-300" />
                    }
                  </div>
                  <span className="text-sm font-medium text-warm-900 dark:text-warm-50 truncate">{interest}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'explore' ? (
        // EXPLORE TAB
        <div className="space-y-8">
          {recommendedCommunities.length === 0 && trendingDiscussions.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Welcome to the Creator Hub!"
              description="Join a community or start a trending discussion to connect with other creators."
            />
          ) : (
            <>
              {/* Recommended Communities */}
              {recommendedCommunities.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary-500" />
                      <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
                        Recommended Communities
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendedCommunities.slice(0, 6).map(c => (
                      <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Discussions */}
              {trendingDiscussions.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-green-500" />
                    <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
                      Trending Discussions
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {trendingDiscussions.map(w => (
                       <div key={w.id} onClick={() => navigate(`/whisper/${w.id}`)} className="cursor-pointer bg-white dark:bg-warm-800 p-4 rounded-3xl border border-warm-200/50 dark:border-warm-700/50 hover:shadow-md transition-shadow relative">
                         <p className="font-serif text-warm-800 dark:text-warm-100 mb-3 line-clamp-3">
                           "{w.content}"
                         </p>
                         <div className="flex items-center justify-between text-xs text-warm-500">
                            <div className="flex items-center gap-2">
                               <Avatar emoji={w.profiles.avatar_emoji} photoUrl={w.profiles.photo_url} size="xs" />
                               <span className="font-semibold text-warm-700 dark:text-warm-300">@{w.profiles.username}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="flex items-center gap-1"><Heart size={12}/> {w.reactions?.length || 0}</span>
                               <span className="flex items-center gap-1"><MessageSquare size={12}/> {w.comment_count}</span>
                            </div>
                         </div>
                       </div>
                     ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'for_you' ? (
        // PERSONALIZED FEED TAB ("FOR YOU")
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-1.5">
               <Sparkles size={18} className="text-primary-500" /> Recommended For You
            </h2>
            <button onClick={loadPersonalizedFeed} className="p-2 text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-all">
              <RefreshCw size={16} />
            </button>
          </div>
          {personalizedWhispers.length === 0 ? (
            <EmptyState
              icon={EyeOff}
              title="No whispers found yet"
              description="Interacting with communities & posts will generate personalized recommendations!"
            />
          ) : (
            <div className="space-y-4">
               {personalizedWhispers.map(whisper => (
                 <WhisperCard key={whisper.id} whisper={whisper} />
               ))}
            </div>
          )}
        </div>
      ) : (
        // ALGORITHM CONTROLS TAB
        <div className="space-y-6">
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 space-y-4">
             <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" /> Reset Recommendation History
             </h2>
             <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
                Resetting deletes the cached interest scoring weights, search logs, and engagement signals computed by our recommendation algorithm. This reverts your "Recommended for You" feed back to a general interest chronological base.
             </p>
             <button 
               onClick={handleResetRecommendations} 
               disabled={resetting}
               className="btn-primary bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 py-2.5 px-6 font-semibold"
             >
                {resetting ? <Loader2 size={16} className="animate-spin" /> : 'Reset My Feed Algorithm'}
             </button>
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 space-y-4">
             <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <Hash size={20} className="text-primary-500" /> Followed Topics
             </h2>
             <p className="text-sm text-warm-500 mb-2">Toggles topics to prioritize in your feed matching.</p>
             <div className="flex flex-wrap gap-2">
                {INTERESTS.map(topic => {
                  const isFollowing = (profile.interests || []).includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => handleInterestToggle(topic)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isFollowing
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-warm-50 text-warm-700 dark:bg-warm-900 dark:text-warm-300 border-warm-200 dark:border-warm-800 hover:bg-warm-100'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 space-y-4">
             <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <VolumeX size={20} className="text-warning-500" /> Muted Topics
             </h2>
             <p className="text-sm text-warm-600 dark:text-warm-400">
                Muting hides posts matching these topics from your Discovery page and Recommended feed completely.
             </p>
             <div className="flex flex-wrap gap-2">
                {INTERESTS.map(topic => {
                  const isMuted = (profile.muted_interests || []).includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => handleMuteInterest(topic)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isMuted
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-warm-50 text-warm-700 dark:bg-warm-900 dark:text-warm-300 border-warm-200 dark:border-warm-800 hover:bg-red-50 dark:hover:bg-red-950/20'
                      }`}
                    >
                      {isMuted ? 'Muted: ' : 'Mute '} {topic}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 space-y-4">
             <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <EyeOff size={20} className="text-warning-500" /> Muted Communities
             </h2>
             <p className="text-sm text-warm-600 dark:text-warm-400">
                You can mute specific communities to prevent them from showing up in your recommendations. Muted communities will show below:
             </p>
             {(profile.muted_communities || []).length === 0 ? (
               <p className="text-sm text-warm-500 italic">No communities muted yet.</p>
             ) : (
               <div className="space-y-2">
                  {(profile.muted_communities || []).map(cid => (
                     <div key={cid} className="flex items-center justify-between p-3 bg-warm-50 dark:bg-warm-900 rounded-2xl text-sm">
                        <span className="font-semibold text-warm-800 dark:text-warm-200">Community ID: {cid}</span>
                        <button onClick={() => handleMuteCommunity(cid)} className="text-xs text-red-500 font-semibold hover:underline">Unmute</button>
                     </div>
                  ))}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactUserCard({
  profile: p,
  currentInterests,
  isFollowing,
  onFollowToggle,
  onClick,
}: {
  profile: Profile;
  currentInterests: string[];
  isFollowing: boolean;
  onFollowToggle: () => void;
  onClick: () => void;
}) {
  const sharedCount = (p.interests || []).filter(i => currentInterests.includes(i)).length;

  return (
    <div className="flex-shrink-0 w-40 snap-start rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 overflow-hidden hover:shadow-md transition-all">
      <div className="pt-4 pb-2 px-3 flex flex-col items-center cursor-pointer" onClick={onClick}>
        <Avatar emoji={p.avatar_emoji} photoUrl={p.photo_url} size="lg" />
        <p className="font-semibold text-warm-900 dark:text-warm-55 text-sm mt-2 truncate w-full text-center">
          {p.display_name}
        </p>
        <p className="text-xs text-warm-500 truncate w-full text-center">@{p.username}</p>
        {sharedCount > 0 && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
            {sharedCount} shared interest{sharedCount !== 1 ? 's' : ''}
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

function CommunityRow({ community: c, onClick }: { community: CommunityWithCount; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-md transition-all text-left"
    >
      <span className="text-2xl flex-shrink-0">{c.emoji}</span>
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
