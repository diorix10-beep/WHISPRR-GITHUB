import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Grid3X3, List, Filter, X, 
  Copy, Archive, Download, MoreHorizontal,
  SortAsc, Users, Globe, Lock, Eye, Sparkles, Flame, MessageSquare, FileText
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

interface CharacterDraftItem {
  id: string;
  title: string;
  form_data: { name?: string; shortDescription?: string; avatarUrl?: string };
  updated_at: string;
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
  const [characterDrafts, setCharacterDrafts] = useState<CharacterDraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'published' | 'private' | 'drafts'>('published');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedDetailChar, setSelectedDetailChar] = useState<any | null>(null);

  const fetchCharacters = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      if (tab === 'drafts') {
        const { data, error } = await supabase
          .from('chimera_character_drafts')
          .select('id, title, form_data, updated_at')
          .order('updated_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        const query = searchQuery.trim().toLowerCase();
        setCharacterDrafts((data || []).filter((draft) => !query || draft.title.toLowerCase().includes(query) || draft.form_data?.shortDescription?.toLowerCase().includes(query)));
        setCharacters([]);
        return;
      }
      let query = supabase
        .from('ai_characters')
        .select('*');

      query = query.eq('creator_id', profile.user_id);
      if (tab === 'published') {
        query = query.eq('visibility', 'public');
      } else {
        query = query.neq('visibility', 'public');
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
      setCharacterDrafts([]);
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
    <div className="rp-page font-sans pb-24 relative overflow-hidden">
      
      {/* Ambient Red Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-600/15 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1420px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 pt-10">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-10 space-y-5">
          <div className="rp-micro inline-flex items-center gap-2 rounded-full border border-[#c99b50]/50 bg-black/30 px-3.5 py-1.5">
            <Users size={14} />
            <span>YOUR ROLEPLAY LIBRARY</span>
          </div>

          <h1 className="rp-heading text-4xl sm:text-6xl font-extrabold tracking-tight">
            My Cast
          </h1>

          <p className="rp-copy text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            The people you’ve brought into CHIMERA. Create, protect, and return to every character whose story is still unfolding.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
            <button
              onClick={() => navigate('/characters/new')}
            className="rp-gold-button"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Bring someone into CHIMERA</span>
            </button>

            <button
              onClick={() => navigate('/characters/new?import=true')}
            className="rp-outline-button"
              title="Import Character Card (.json or .png from Character.AI / Janitor AI)"
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>Import Character Card</span>
            </button>
          </div>
        </section>


        {/* ── 2. QUICK ACTIONS & FILTER CONTROLS ── */}
        <section className="rp-panel p-4 rounded-3xl space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-2xl border border-[#c99b50]/35 bg-black/30 w-full sm:w-auto">
              <button
                onClick={() => setTab('published')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'published'
                    ? 'bg-[#2b2116] text-[#ffe2a1] shadow-md ring-1 ring-[#c99b50]/70'
                    : 'text-[#bfb4a3] hover:text-[#f4d390]'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setTab('private')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'private'
                    ? 'bg-[#2b2116] text-[#ffe2a1] shadow-md ring-1 ring-[#c99b50]/70'
                    : 'text-[#bfb4a3] hover:text-[#f4d390]'
                }`}
              >
                Private
              </button>
              <button
                onClick={() => setTab('drafts')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'drafts'
                    ? 'bg-[#2b2116] text-[#ffe2a1] shadow-md ring-1 ring-[#c99b50]/70'
                    : 'text-[#bfb4a3] hover:text-[#f4d390]'
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
                className="px-3 py-2 rounded-xl border border-[#c99b50]/35 bg-black/30 text-xs font-bold text-[#e6d7bf] focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center p-1 rounded-xl border border-[#c99b50]/35 bg-black/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-[#2b2116] text-[#f2d28f] shadow-sm' : 'text-[#a99e8f]'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-[#2b2116] text-[#f2d28f] shadow-sm' : 'text-[#a99e8f]'
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
                    ? 'bg-[#9b6934] text-[#fff1ce] shadow-sm'
                    : 'border border-[#c99b50]/25 bg-black/25 text-[#c8bba7] hover:text-[#f4d390]'
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
          ) : tab === 'drafts' ? characterDrafts.length === 0 ? (
            <RichEmptyState
              icon={FileText}
              title="No private drafts yet"
              description="When you choose Save private draft while creating a character, it will live here—visible only to you."
              actionLabel="Create Character"
              onAction={() => navigate('/characters/new')}
            />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {characterDrafts.map((draft) => (
                <button key={draft.id} onClick={() => navigate(`/characters/new?draftId=${draft.id}`)} className="group overflow-hidden rounded-3xl border border-[#d8b56a]/25 bg-warm-850 p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-[#d8b56a]/60">
                  <div className="flex aspect-[16/8] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_20%,rgba(153,103,193,0.35),transparent_35%),#1b1323]">
                    {draft.form_data?.avatarUrl ? <img src={draft.form_data.avatarUrl} alt="" className="h-full w-full object-cover" /> : <FileText size={30} className="text-[#d8b56a]/70" />}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3"><h3 className="font-serif text-lg font-semibold text-white">{draft.title}</h3><span className="rounded-full border border-[#d8b56a]/30 bg-[#d8b56a]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e9ca81]">Private draft</span></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-warm-400">{draft.form_data?.shortDescription?.replace(/<[^>]*>/g, '') || 'An unfinished character waiting for you.'}</p>
                  <p className="mt-4 text-[11px] font-semibold text-warm-500">Continue creating →</p>
                </button>
              ))}
            </div>
          ) : characters.length === 0 ? (
            <RichEmptyState
              icon={Users}
              title={tab === 'published' ? 'No one has stepped onto the stage yet.' : 'No private characters found'}
              description={tab === 'published' ? 'Your published characters will appear here once you choose to share them with the multiverse.' : 'Private characters stay here for you until you decide otherwise.'}
              actionLabel="Bring someone into CHIMERA"
              onAction={() => navigate('/characters/new')}
            />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character as any}
                  onClick={() => navigate(`/characters/${character.id}`)}
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
              navigate(`/characters/${selectedDetailChar.id}`);
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
