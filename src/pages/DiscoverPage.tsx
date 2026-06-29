import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, TrendingUp, Users, ChevronRight, Sparkles,
  Music, Gamepad2, Monitor, Dumbbell, Plane, Bike, Film,
  Trophy, Briefcase, Video, Hash,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterests } from '../contexts/InterestContext';
import { supabase } from '../lib/supabase';
import { MOODS, INTERESTS } from '../types';
import type { Profile, Community } from '../types';
import { UserCard } from '../components/discover/UserCard';
import { Avatar } from '../components/common/Avatar';

type SearchTab = 'users' | 'communities' | 'interests';

interface CommunityWithCount extends Community {
  member_count?: number;
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
  const { user, profile } = useAuth();
  const { track } = useInterests();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('users');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityWithCount[]>([]);
  const [interestResults, setInterestResults] = useState<string[]>([]);

  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityWithCount[]>([]);
  const [trendingCommunities, setTrendingCommunities] = useState<CommunityWithCount[]>([]);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadSuggestedUsers = useCallback(async () => {
    if (!user || !profile) return;

    let users: Profile[] = [];

    if (profile.interests && profile.interests.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .overlaps('interests', profile.interests)
        .limit(12);
      if (data) users = data;
    }

    if (users.length < 6) {
      const excludeIds = [user.id, ...users.map(u => u.user_id)];
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(12 - users.length);
      if (data) users = [...users, ...data];
    }

    setSuggestedUsers(users);
    await fetchFollowingStatus(users.map(u => u.user_id));
  }, [user, profile, fetchFollowingStatus]);

  const loadRecommendedCommunities = useCallback(async () => {
    if (!user) return;
    const { data: recData } = await supabase.rpc('get_recommended_communities', {
      p_user_id: user.id,
      p_limit: 6,
    });

    if (!recData || recData.length === 0) {
      const { data } = await supabase
        .from('communities')
        .select('*, community_members(count)')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) {
        setRecommendedCommunities(data.map((c: any) => ({
          ...c, member_count: c.community_members?.[0]?.count || 0,
        })));
      }
      return;
    }

    const ids = recData.map((r: any) => r.community_id);
    const { data } = await supabase
      .from('communities')
      .select('*, community_members(count)')
      .in('id', ids);
    if (data) {
      const orderMap = new Map(ids.map((id: string, idx: number) => [id, idx]));
      const sorted = [...data].sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      setRecommendedCommunities(sorted.map((c: any) => ({
        ...c, member_count: c.community_members?.[0]?.count || 0,
      })));
    }
  }, [user]);

  const loadTrendingCommunities = useCallback(async () => {
    const { data } = await supabase
      .from('communities')
      .select('*, community_members(count)')
      .order('post_count', { ascending: false })
      .limit(6);
    if (data) {
      setTrendingCommunities(data.map((c: any) => ({
        ...c, member_count: c.community_members?.[0]?.count || 0,
      })));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        loadSuggestedUsers(),
        loadRecommendedCommunities(),
        loadTrendingCommunities(),
      ]);
      setLoading(false);
    };
    load();
  }, [loadSuggestedUsers, loadRecommendedCommunities, loadTrendingCommunities]);

  const executeSearch = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setInterestResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();

    const [usersRes, communitiesRes] = await Promise.all([
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
        } catch { /* notification failure is non-critical */ }
        setFollowingMap(prev => ({ ...prev, [targetUserId]: true }));

        const followedProfile = [...suggestedUsers, ...userResults].find(p => p.user_id === targetUserId);
        if (followedProfile) {
          track({
            eventType: 'follow', targetType: 'profile', targetId: targetUserId,
            interests: followedProfile.interests || [], mood: followedProfile.mood || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  }, [user, profile, followingMap, suggestedUsers, userResults, track]);

  const handleInterestClick = (interest: string) => {
    setSearchQuery(interest);
    setSearchTab('communities');
    track({ eventType: 'search', targetType: 'search_term', targetId: interest.toLowerCase() });
  };

  const handleMoodFilter = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood);
  };

  const filteredSuggestedUsers = selectedMood
    ? suggestedUsers.filter(u => u.mood === selectedMood)
    : suggestedUsers;

  if (!user || !profile) {
    return (
      <div className="page-container">
        <p className="text-center text-warm-600">Please log in to discover</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-300 border-t-primary-500 mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Discovering...</p>
        </div>
      </div>
    );
  }

  const totalSearchResults = userResults.length + communityResults.length + interestResults.length;
  const hasNoSearchResults = isSearchActive && !searchLoading && totalSearchResults === 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title">Discover</h1>
        <p className="text-sm text-warm-500 mt-1">Find people, communities, and interests</p>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users, communities, or interests..."
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

      {/* Search Results */}
      {isSearchActive && (
        <div className="mb-8">
          {/* Search Tabs */}
          <div className="flex gap-1 mb-4 bg-warm-100 dark:bg-warm-800 p-1 rounded-xl">
            {([
              { key: 'users' as SearchTab, label: 'Users', count: userResults.length },
              { key: 'communities' as SearchTab, label: 'Communities', count: communityResults.length },
              { key: 'interests' as SearchTab, label: 'Interests', count: interestResults.length },
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

          {searchLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-300 border-t-primary-500" />
            </div>
          )}

          {/* User Results */}
          {!searchLoading && searchTab === 'users' && (
            <>
              {userResults.length > 0 ? (
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
              ) : (
                <NoSearchResultsFallback
                  message="No users found"
                  suggestedUsers={suggestedUsers.slice(0, 4)}
                  currentUserId={user.id}
                  currentInterests={profile.interests || []}
                  followingMap={followingMap}
                  onFollowToggle={handleFollowToggle}
                />
              )}
            </>
          )}

          {/* Community Results */}
          {!searchLoading && searchTab === 'communities' && (
            <>
              {communityResults.length > 0 ? (
                <div className="space-y-2">
                  {communityResults.map(c => (
                    <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
                  ))}
                </div>
              ) : (
                <NoSearchResultsFallback
                  message="No communities found"
                  trendingCommunities={trendingCommunities.slice(0, 4)}
                  onCommunityClick={id => navigate(`/communities/${id}`)}
                />
              )}
            </>
          )}

          {/* Interest Results */}
          {!searchLoading && searchTab === 'interests' && (
            <>
              {interestResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {interestResults.map(interest => (
                    <button
                      key={interest}
                      onClick={() => handleInterestClick(interest)}
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
              ) : (
                <div className="text-center py-8">
                  <Hash size={32} className="text-warm-300 dark:text-warm-600 mx-auto mb-3" />
                  <p className="text-sm text-warm-500">No matching interests found</p>
                </div>
              )}
            </>
          )}

          {hasNoSearchResults && (
            <div className="mt-4 text-center py-6">
              <p className="text-warm-500 text-sm">Try different keywords or browse the sections below</p>
            </div>
          )}
        </div>
      )}

      {/* Non-search content */}
      {!isSearchActive && (
        <>
          {/* Suggested Users */}
          {filteredSuggestedUsers.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary-500" />
                <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
                  Suggested for You
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-3 snap-x snap-mandatory">
                {filteredSuggestedUsers.slice(0, 8).map(p => (
                  <CompactUserCard
                    key={p.user_id}
                    profile={p}
                    currentInterests={profile.interests || []}
                    isFollowing={followingMap[p.user_id] || false}
                    onFollowToggle={() => handleFollowToggle(p.user_id)}
                    onClick={() => navigate(`/profile/${p.username}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Communities */}
          {recommendedCommunities.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary-500" />
                  <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
                    Recommended Communities
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/communities')}
                  className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-0.5"
                >
                  See all <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {recommendedCommunities.slice(0, 4).map(c => (
                  <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Trending Communities */}
          {trendingCommunities.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" />
                  <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">
                    Trending
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/communities')}
                  className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-0.5"
                >
                  See all <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trendingCommunities.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/communities/${c.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-md transition-all text-left"
                  >
                    <span className="text-lg font-bold text-warm-300 dark:text-warm-600 w-6 text-center">{idx + 1}</span>
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-900 dark:text-warm-50 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-warm-500">{c.member_count || 0} members</p>
                    </div>
                    <ChevronRight size={16} className="text-warm-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Explore by Interest */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider mb-3">
              Explore by Interest
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FEATURED_INTERESTS.map(interest => {
                const Icon = INTEREST_ICONS[interest] || Hash;
                return (
                  <button
                    key={interest}
                    onClick={() => handleInterestClick(interest)}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                      <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-xs font-medium text-warm-700 dark:text-warm-300 text-center leading-tight">{interest}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Mood Filters - Secondary */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider mb-1">
              Filter by Mood
            </h2>
            <p className="text-xs text-warm-500 mb-3">Find people who share your current vibe</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.slice(0, 8).map(mood => (
                <button
                  key={mood}
                  onClick={() => handleMoodFilter(mood)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedMood === mood
                      ? 'bg-primary-500 text-white shadow-warm'
                      : 'bg-warm-100 dark:bg-warm-700 text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-600'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
            {selectedMood && filteredSuggestedUsers.length === 0 && (
              <p className="text-xs text-warm-500 mt-3 text-center">
                No users with "{selectedMood}" mood right now. Check back later!
              </p>
            )}
          </section>
        </>
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
  const sharedCount = p.interests.filter(i => currentInterests.includes(i)).length;

  return (
    <div className="flex-shrink-0 w-40 snap-start rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 overflow-hidden hover:shadow-md transition-all">
      <div className="pt-4 pb-2 px-3 flex flex-col items-center cursor-pointer" onClick={onClick}>
        <Avatar emoji={p.avatar_emoji} photoUrl={p.photo_url} size="lg" />
        <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm mt-2 truncate w-full text-center">
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

function NoSearchResultsFallback({
  message,
  suggestedUsers,
  currentUserId,
  currentInterests,
  followingMap,
  onFollowToggle,
  trendingCommunities,
  onCommunityClick,
}: {
  message: string;
  suggestedUsers?: Profile[];
  currentUserId?: string;
  currentInterests?: string[];
  followingMap?: Record<string, boolean>;
  onFollowToggle?: (id: string) => void;
  trendingCommunities?: CommunityWithCount[];
  onCommunityClick?: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-center py-6 mb-4">
        <Search size={28} className="text-warm-300 dark:text-warm-600 mx-auto mb-2" />
        <p className="text-sm text-warm-500">{message}</p>
      </div>

      {suggestedUsers && suggestedUsers.length > 0 && currentUserId && (
        <div>
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">You might like</p>
          <div className="grid gap-3">
            {suggestedUsers.map(p => (
              <UserCard
                key={p.user_id}
                profile={p}
                currentUserId={currentUserId}
                currentInterests={currentInterests || []}
                isFollowing={followingMap?.[p.user_id] || false}
                onFollowToggle={() => onFollowToggle?.(p.user_id)}
              />
            ))}
          </div>
        </div>
      )}

      {trendingCommunities && trendingCommunities.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">Trending communities</p>
          <div className="space-y-2">
            {trendingCommunities.map(c => (
              <CommunityRow key={c.id} community={c} onClick={() => onCommunityClick?.(c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
