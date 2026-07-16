import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, TrendingUp, Star, Sparkles, Users, ChevronRight } from 'lucide-react';
import type { Community } from '../types';
import { COMMUNITY_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreateCommunityModal } from '../components/communities/CreateCommunityModal';

type ViewMode = 'browse' | 'my' | 'recommended';

interface CommunityWithCount extends Community {
  community_members?: any[];
}

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allCommunities, setAllCommunities] = useState<CommunityWithCount[]>([]);
  const [myCommunities, setMyCommunities] = useState<CommunityWithCount[]>([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityWithCount[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<CommunityWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAllCommunities = useCallback(async () => {
    const { data } = await supabase
      .from('communities')
      .select('*, community_members(count)')
      .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (data) {
      setAllCommunities(data.map((c: any) => ({
        ...c,
        member_count: c.community_members?.[0]?.count || 0,
      })));
    }
  }, []);

  const loadMyCommunities = useCallback(async () => {
    if (!user) return;
    const { data: memberData } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setMyCommunities([]);
      return;
    }

    const ids = memberData.map(m => m.community_id);
    const { data } = await supabase
      .from('communities')
      .select('*, community_members(count)')
      .in('id', ids)
      .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (data) {
      setMyCommunities(data.map((c: any) => ({
        ...c,
        member_count: c.community_members?.[0]?.count || 0,
      })));
    }
  }, [user]);

  const loadRecommended = useCallback(async () => {
    if (!user) return;
    const { data: recData } = await supabase.rpc('get_recommended_communities', {
      p_user_id: user.id,
      p_limit: 12,
    });

    if (!recData || recData.length === 0) {
      setRecommendedCommunities([]);
      return;
    }

    const ids = recData.map((r: any) => r.community_id);
    const { data } = await supabase
      .from('communities')
      .select('*, community_members(count)')
      .in('id', ids);

    if (data) {
      const orderMap = new Map(ids.map((id: string, idx: number) => [id, idx]));
      const sorted = [...data].sort((a, b) => (orderMap.get(a.id) as number || 0) - (orderMap.get(b.id) as number || 0));
      setRecommendedCommunities(sorted.map((c: any) => ({
        ...c,
        member_count: c.community_members?.[0]?.count || 0,
      })));
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadAllCommunities(), loadMyCommunities(), loadRecommended()]);
      setIsLoading(false);
    };
    load();
  }, [loadAllCommunities, loadMyCommunities, loadRecommended]);

  // Filter logic
  useEffect(() => {
    const source = viewMode === 'my' ? myCommunities
      : viewMode === 'recommended' ? recommendedCommunities
      : allCommunities;

    let filtered = source;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.interest.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    setFilteredCommunities(filtered);
  }, [allCommunities, myCommunities, recommendedCommunities, viewMode, searchQuery, selectedCategory]);

  const featuredCommunities = allCommunities.filter(c => c.is_featured);
  const trendingCommunities = [...allCommunities]
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    .slice(0, 6);

  const handleCreated = () => {
    setShowCreateModal(false);
    loadAllCommunities();
    loadMyCommunities();
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-300 border-t-primary-500 mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Loading communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">Communities</h1>
          <p className="text-sm text-warm-500 mt-0.5">Find your people</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 py-2 px-4">
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
        <input
          type="text"
          placeholder="Search communities by name or creative focus..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
            <X size={18} />
          </button>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-5 bg-warm-100 dark:bg-warm-800 p-1 rounded-xl">
        {([
          { key: 'browse' as ViewMode, label: 'Browse', icon: Users },
          { key: 'my' as ViewMode, label: 'My Communities', icon: Star },
          { key: 'recommended' as ViewMode, label: 'For You', icon: Sparkles },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              viewMode === tab.key
                ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm'
                : 'text-warm-500 dark:text-warm-400 hover:text-warm-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filter (only in Browse mode, no search active) */}
      {viewMode === 'browse' && !searchQuery && (
        <div className="mb-5 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedCategory
                  ? 'bg-primary-500 text-white'
                  : 'bg-warm-100 dark:bg-warm-700 text-warm-600 dark:text-warm-300'
              }`}
            >
              All
            </button>
            {COMMUNITY_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-100 dark:bg-warm-700 text-warm-600 dark:text-warm-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Communities (only in browse mode, no search/filter active) */}
      {viewMode === 'browse' && !searchQuery && !selectedCategory && featuredCommunities.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">Featured</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
            {featuredCommunities.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/communities/${c.id}`)}
                className="flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-lg transition-shadow"
              >
                {c.banner_url ? (
                  <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${c.banner_url})` }} />
                ) : (
                  <div className="h-24 bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-4xl">
                    {c.emoji}
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-warm-500 mt-0.5">{c.member_count || 0} members</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending (only in browse mode, no search/filter active) */}
      {viewMode === 'browse' && !searchQuery && !selectedCategory && trendingCommunities.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-green-500" />
            <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider">Trending</h2>
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
        </div>
      )}

      {/* Recommended notice */}
      {viewMode === 'recommended' && recommendedCommunities.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <Sparkles size={14} className="text-primary-500 flex-shrink-0" />
          <p className="text-xs text-primary-700 dark:text-primary-300">Based on your creative identity, activity, and collaborations</p>
        </div>
      )}

      {/* Community List */}
      {filteredCommunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users size={40} className="text-warm-300 dark:text-warm-600 mb-4" />
          <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
            {viewMode === 'my' ? 'You haven\'t joined any communities yet'
              : viewMode === 'recommended' ? 'No recommendations yet'
              : searchQuery || selectedCategory ? 'No communities found'
              : 'No communities yet'}
          </h2>
          <p className="text-warm-500 text-sm mb-6 max-w-xs">
            {viewMode === 'my' ? 'Browse and join communities that match your creative goals.'
              : viewMode === 'recommended' ? 'Connect with other creators and build projects to get personalized recommendations.'
              : 'Be the first to start a community!'}
          </p>
          {viewMode === 'my' ? (
            <button onClick={() => setViewMode('browse')} className="btn-primary">Browse Communities</button>
          ) : (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">Create Community</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(viewMode === 'browse' && !searchQuery && !selectedCategory ? [] : filteredCommunities).length === 0 && viewMode === 'browse' && !searchQuery && !selectedCategory ? null : (
            <>
              {(searchQuery || selectedCategory || viewMode !== 'browse') && (
                <p className="text-xs text-warm-500 mb-2">{filteredCommunities.length} communit{filteredCommunities.length === 1 ? 'y' : 'ies'}</p>
              )}
              {filteredCommunities.map(c => (
                <CommunityRow key={c.id} community={c} onClick={() => navigate(`/communities/${c.id}`)} />
              ))}
            </>
          )}

          {/* All communities grid when browsing without filter */}
          {viewMode === 'browse' && !searchQuery && !selectedCategory && (
            <div>
              <h2 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider mb-3">All Communities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allCommunities.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/communities/${c.id}`)}
                    className="card text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-warm-900 dark:text-warm-50 truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                            {c.interest}
                          </span>
                          <span className="text-xs text-warm-500">{c.member_count || 0} members</span>
                        </div>
                      </div>
                    </div>
                    {c.description && (
                      <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-2">{c.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateCommunityModal onClose={() => setShowCreateModal(false)} onCommunityCreated={handleCreated} />
      )}
    </div>
  );
}

function CommunityRow({ community: c, onClick }: { community: CommunityWithCount; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 hover:shadow-md transition-all text-left"
    >
      <span className="text-3xl flex-shrink-0">{c.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm truncate">{c.name}</p>
          {c.is_featured && <Star size={12} className="text-amber-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-warm-500 line-clamp-1">{c.description}</p>
        <div className="flex items-center gap-3 mt-1">
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
