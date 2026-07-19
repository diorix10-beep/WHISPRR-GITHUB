import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Grid3X3, List, Filter, X, 
  Copy, Archive, Download, MoreHorizontal,
  SortAsc, Users, Globe, Lock, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface CharacterItem {
  id: string;
  user_id: string;
  creator_id: string;
  greeting: string;
  short_description: string;
  personality: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  content_rating?: string;
  status?: string;
  chats_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  bot_profile?: {
    display_name: string;
    username: string;
    avatar_emoji: string;
    photo_url: string | null;
  };
}

const CATEGORIES = [
  'All', 'Romance', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery',
  'Action', 'Adventure', 'Historical', 'Slice of Life', 'Anime',
  'Games', 'School', 'Medieval', 'Cyberpunk', 'Original Characters (OC)'
];

const SORT_OPTIONS = [
  { value: 'updated', label: 'Last Updated' },
  { value: 'created', label: 'Date Created' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'chats', label: 'Most Chats' },
];

export default function CharactersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [sortBy, setSortBy] = useState('updated');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('ai_characters')
        .select('*, bot_profile:profiles!ai_characters_user_id_fkey(display_name, username, avatar_emoji, photo_url)');

      if (tab === 'mine') {
        query = query.eq('creator_id', profile.user_id);
      } else {
        query = query.or(`visibility.eq.public,creator_id.eq.${profile.user_id}`);
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        query = query.or(`bot_profile.display_name.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      // Sort
      switch (sortBy) {
        case 'created': query = query.order('created_at', { ascending: false }); break;
        case 'name': query = query.order('created_at', { ascending: true }); break;
        case 'chats': query = query.order('chats_count', { ascending: false }); break;
        default: query = query.order('updated_at', { ascending: false });
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setCharacters(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading characters', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, tab, selectedCategory, searchQuery, sortBy, showToast]);

  useEffect(() => { fetchCharacters(); }, [fetchCharacters]);

  const handleDuplicate = async (characterId: string) => {
    try {
      const original = characters.find(c => c.id === characterId);
      if (!original || !profile) return;
      showToast('Duplicating character...', 'info');
      // Fetch full data
      const { data } = await supabase.from('ai_characters').select('*').eq('id', characterId).single();
      if (!data) return;
      const { id, user_id, created_at, updated_at, chats_count, likes_count, followers_count, ...rest } = data;
      // Create new profile for the character
      const { data: newProfile, error: profileError } = await supabase.from('profiles').insert({
        display_name: `${data.bot_profile?.display_name || 'Character'} (Copy)`,
        username: `copy_${Date.now().toString(36)}`,
        avatar_emoji: '🎭',
        role: 'ai_character',
        onboarding_complete: true,
      }).select().single();
      if (profileError || !newProfile) {
        showToast('Failed to duplicate', 'error');
        return;
      }
      await supabase.from('ai_characters').insert({
        ...rest,
        user_id: newProfile.user_id,
        creator_id: profile.user_id,
        visibility: 'private',
        status: 'draft',
        chats_count: 0,
        likes_count: 0,
        followers_count: 0,
      });
      showToast('Character duplicated!', 'success');
      fetchCharacters();
    } catch {
      showToast('Failed to duplicate character', 'error');
    }
    setActionMenuId(null);
  };

  const handleExport = async (characterId: string) => {
    try {
      const { data } = await supabase.from('ai_characters').select('*, bot_profile:profiles!ai_characters_user_id_fkey(display_name, username, avatar_emoji)').eq('id', characterId).single();
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.bot_profile?.display_name || 'character'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Character exported!', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
    setActionMenuId(null);
  };

  const visibilityIcon = (v: string) => {
    switch (v) {
      case 'public': return <Globe size={12} className="text-green-500" />;
      case 'unlisted': return <Eye size={12} className="text-yellow-500" />;
      default: return <Lock size={12} className="text-warm-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">Characters</h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            Build characters for your stories, worlds, and conversations.
          </p>
        </div>
        <button
          onClick={() => navigate('/characters/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-sm shadow-red-500/20 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Character
        </button>
      </div>

      {/* Tabs + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Mine / All tabs */}
        <div className="flex bg-warm-100 dark:bg-warm-800 rounded-xl p-1 gap-1">
          {(['mine', 'all'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t
                  ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
              }`}
            >
              {t === 'mine' ? 'My Characters' : 'All Characters'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>

        {/* View mode */}
        <div className="flex gap-1 bg-warm-100 dark:bg-warm-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-warm-700 shadow-sm' : 'text-warm-400 hover:text-warm-600'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-warm-700 shadow-sm' : 'text-warm-400 hover:text-warm-600'}`}
          >
            <List size={16} />
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600' : 'border-warm-200 dark:border-warm-700 text-warm-400 hover:text-warm-600'}`}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-750">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-warm-100 dark:bg-warm-800 animate-pulse h-56" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 flex items-center justify-center">
            <Users size={32} className="text-red-400" />
          </div>
          <h2 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-100 mb-2">
            {tab === 'mine' ? 'No characters yet' : 'No characters found'}
          </h2>
          <p className="text-sm text-warm-500 dark:text-warm-400 max-w-md mx-auto mb-6">
            {tab === 'mine'
              ? 'Create your first character — whether for a story, a world, or an AI conversation.'
              : 'Try adjusting your search or filters.'}
          </p>
          {tab === 'mine' && (
            <button
              onClick={() => navigate('/characters/new')}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-md active:scale-[0.98] transition-all"
            >
              <Plus size={16} className="inline mr-2" />
              Create Your First Character
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {characters.map(c => (
            <div
              key={c.id}
              className="group relative rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 overflow-hidden hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg hover:shadow-red-500/5 transition-all cursor-pointer"
              onClick={() => navigate(`/characters/${c.id}/edit`)}
            >
              {/* Avatar */}
              <div className="h-32 bg-gradient-to-br from-red-100 to-warm-100 dark:from-red-900/30 dark:to-warm-800 flex items-center justify-center relative">
                {c.bot_profile?.photo_url ? (
                  <img src={c.bot_profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{c.bot_profile?.avatar_emoji || '🎭'}</span>
                )}
                {/* Visibility badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px]">
                  {visibilityIcon(c.visibility)}
                  <span className="capitalize">{c.visibility}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm text-warm-900 dark:text-warm-50 truncate">
                  {c.bot_profile?.display_name || 'Unnamed'}
                </h3>
                <p className="text-xs text-warm-500 dark:text-warm-400 line-clamp-2 leading-relaxed">
                  {c.short_description || 'No description'}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 dark:bg-warm-750 text-warm-500 dark:text-warm-400 font-medium">
                    {c.category}
                  </span>
                  <span className="text-[10px] text-warm-400">{c.chats_count} chats</span>
                </div>
              </div>

              {/* Action menu */}
              <button
                onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === c.id ? null : c.id); }}
                className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>

              {actionMenuId === c.id && (
                <div className="absolute top-10 left-2 z-10 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200 dark:border-warm-700 py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDuplicate(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => handleExport(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750">
                    <Download size={12} /> Export JSON
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {characters.map(c => (
            <div
              key={c.id}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 hover:border-red-300 dark:hover:border-red-700 cursor-pointer transition-all"
              onClick={() => navigate(`/characters/${c.id}/edit`)}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-warm-100 dark:from-red-900/30 dark:to-warm-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.bot_profile?.photo_url ? (
                  <img src={c.bot_profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{c.bot_profile?.avatar_emoji || '🎭'}</span>
                )}
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-warm-900 dark:text-warm-50 truncate">
                    {c.bot_profile?.display_name || 'Unnamed'}
                  </h3>
                  {visibilityIcon(c.visibility)}
                </div>
                <p className="text-xs text-warm-500 dark:text-warm-400 truncate mt-0.5">
                  {c.short_description || 'No description'}
                </p>
              </div>
              {/* Meta */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-warm-400 flex-shrink-0">
                <span className="px-2 py-1 rounded-lg bg-warm-100 dark:bg-warm-750">{c.category}</span>
                <span>{c.chats_count} chats</span>
                <span>{new Date(c.updated_at).toLocaleDateString()}</span>
              </div>
              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); handleDuplicate(c.id); }} className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-750 text-warm-400" title="Duplicate">
                  <Copy size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); handleExport(c.id); }} className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-750 text-warm-400" title="Export">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
