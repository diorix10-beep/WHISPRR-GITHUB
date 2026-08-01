import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Grid3X3, List, Filter, X, 
  Copy, Archive, Download, MoreHorizontal,
  SortAsc, Users, Globe, Lock, Eye, Sparkles, Flame, MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { CharacterCard } from '../components/chimera/CharacterCard';
import { CharacterDetailsModal } from '../components/chimera/CharacterDetailsModal';
import { RichEmptyState } from '../components/common/RichEmptyState';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'mine' | 'drafts' | 'all'>('mine');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedDetailChar, setSelectedDetailChar] = useState<any | null>(null);

  const fetchCharacters = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('ai_characters')
        .select('*');

      if (tab === 'mine') {
        query = query.eq('creator_id', profile.user_id);
      } else if (tab === 'drafts') {
        query = query.eq('creator_id', profile.user_id).eq('visibility', 'private');
      } else {
        query = query.or(`visibility.eq.public,creator_id.eq.${profile.user_id}`);
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
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

      let results = data || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        results = results.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          (c.bot_profile as any)?.display_name?.toLowerCase().includes(q) ||
          c.short_description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
        );
      }

      setCharacters(results);
    } catch (err: any) {
      console.error('Error loading characters:', err);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  }, [profile, tab, selectedCategory, searchQuery, sortBy]);

  useEffect(() => { fetchCharacters(); }, [fetchCharacters]);

  const handleDuplicate = async (characterId: string) => {
    try {
      const original = characters.find(c => c.id === characterId);
      if (!original || !profile) return;
      showToast('Duplicating character...', 'info');
      
      const { data } = await supabase.from('ai_characters').select('*').eq('id', characterId).single();
      if (!data) return;
      const { id, user_id, created_at, updated_at, chats_count, likes_count, followers_count, ...rest } = data;
      
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
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-50 font-sans pb-24 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Red Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-600/15 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-6">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <Users size={14} />
            <span>AI Character Multiverse</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-warm-900 dark:text-white">
            Characters &amp; OCs
          </h1>

          <p className="text-sm sm:text-base text-warm-600 dark:text-warm-300 max-w-xl mx-auto leading-relaxed">
            Build, roleplay, and manage persistent AI character identities with customizable personalities, greetings, and memory.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
            <button
              onClick={() => navigate('/characters/new')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Create New Character</span>
            </button>

            <button
              onClick={() => navigate('/characters/new?import=true')}
              className="px-5 py-3 rounded-full bg-white/10 dark:bg-warm-800/80 hover:bg-white/20 text-warm-800 dark:text-white font-bold text-xs border border-warm-200 dark:border-warm-700 transition-all flex items-center gap-2"
              title="Import Character Card (.json or .png from Character.AI / Janitor AI)"
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>Import Character Card</span>
            </button>
          </div>
        </section>


        {/* ── 2. QUICK ACTIONS & FILTER CONTROLS ── */}
        <section className="p-4 rounded-3xl bg-white/70 dark:bg-warm-850/80 backdrop-blur-xl border border-warm-200/80 dark:border-warm-750/80 shadow-lg space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-2xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 w-full sm:w-auto">
              <button
                onClick={() => setTab('mine')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'mine'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
              >
                My Characters
              </button>
              <button
                onClick={() => setTab('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'all'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
              >
                Public Multiverse
              </button>
              <button
                onClick={() => setTab('drafts')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'drafts'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
              >
                Drafts
              </button>
            </div>

            {/* View Mode & Sort */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs font-bold text-warm-700 dark:text-warm-300 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center p-1 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white dark:bg-warm-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-warm-400'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-white dark:bg-warm-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-warm-400'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </section>


        {/* ── 3. CHARACTER CATALOGUE MATRIX ── */}
        <section className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-warm-200 dark:bg-warm-800 animate-pulse" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <RichEmptyState
              icon={Users}
              title={tab === 'mine' ? 'No characters created yet' : 'No characters found'}
              description={tab === 'mine' ? 'Start building your first AI character with rich backstory & greeting!' : 'Try selecting a different category or search term.'}
              actionLabel="Create Character"
              onAction={() => navigate('/characters/new')}
            />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character as any}
                  onClick={() => navigate(`/conversations/new?characterId=${character.id}`)}
                  onViewDetails={() => setSelectedDetailChar(character)}
                  onEdit={() => navigate(`/characters/${character.id}/edit`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Character Details Modal */}
        <CharacterDetailsModal
          isOpen={!!selectedDetailChar}
          onClose={() => setSelectedDetailChar(null)}
          character={selectedDetailChar}
          onStartChat={() => {
            if (selectedDetailChar) {
              navigate(`/conversations/new?characterId=${selectedDetailChar.id}`);
            }
          }}
          onEdit={
            selectedDetailChar?.creator_id === profile?.user_id || selectedDetailChar?.user_id === profile?.user_id
              ? () => navigate(`/characters/${selectedDetailChar.id}/edit`)
              : undefined
          }
        />

      </div>
    </div>
  );
}
