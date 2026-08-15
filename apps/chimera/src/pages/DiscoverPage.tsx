import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Compass, Sparkles, MessageSquare, Search, Filter, ShieldCheck, Heart, User, X, Play,
  BookOpen, PenTool, Layers, BookMarked, UserCheck, Globe, Users, ArrowRight, Flame, Plus,
  Award, ChevronRight
} from 'lucide-react';
import { RichEmptyState } from '../components/common/RichEmptyState';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../hooks/useTranslation';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';

interface StoryItem {
  id: string;
  title: string;
  summary: string;
  cover_image_url?: string;
  genre?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
    username: string;
    avatar_emoji?: string;
    photo_url?: string;
  };
}

const STORY_GENRES = [
  'All',
  'Fantasy',
  'Sci-Fi',
  'Mystery & Thriller',
  'Romance',
  'Historical Fiction',
  'LitRPG / GameLit',
  'Cyberpunk',
  'Supernatural & Horror',
  'Slice of Life',
];

const ROLEPLAY_CATEGORIES = [
  'All',
  'Fantasy',
  'Sci-Fi',
  'Cyberpunk',
  'Slice of Life',
  'Mystery',
  'Romance',
  'Historical',
  'Supernatural'
];

const AO3_TROPES = [
  'All Tropes',
  'Enemies to Lovers',
  'Slow Burn',
  'Isekai / Portal',
  'Found Family',
  'Fake Relationship',
  'Time Travel',
  'Dark Fantasy',
  'Cyberpunk'
];

export default function DiscoverPage() {
  const outletContext = useOutletContext<{ creativeMode?: 'roleplay' | 'storytelling' }>();
  const creativeMode = outletContext?.creativeMode || 'roleplay';
  const isStoryMode = creativeMode === 'storytelling';

  const [characters, setCharacters] = useState<any[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [selectedChar, setSelectedChar] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, formatNumber } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    if (isStoryMode) {
      fetchStories();
    } else {
      fetchCharacters();
    }
  }, [creativeMode]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_characters')
        .select('*, bot_profile:profiles!ai_characters_user_id_fkey(display_name, username, avatar_emoji, photo_url)')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedCharacters = (data || []).map((char: any) => ({
        id: char.id,
        user_id: char.user_id || char.id,
        display_name: char.name || char.bot_profile?.display_name || 'Untitled character',
        username: char.bot_profile?.username || '',
        photo_url: char.avatar_url || char.bot_profile?.photo_url || null,
        avatar_emoji: char.bot_profile?.avatar_emoji || '🎭',
        bio: char.short_description || char.long_description || '',
        badges: char.tags || ['Roleplay'],
        rating: char.content_rating || 'SFW',
        scenario: char.scenario || '',
        greeting: char.greeting || '',
        mood: '',
        interests: char.tags || [],
        role: 'ai_character'
      }));
      
      setCharacters(formattedCharacters);
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          summary,
          cover_image_url,
          genre,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            username,
            avatar_emoji,
            photo_url
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const formatStoryData = (rawData: any[]): StoryItem[] => {
        return (rawData || []).map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        }));
      };

      if (error) {
        const { data: fallbackData } = await supabase
          .from('stories')
          .select(`
            id,
            title,
            summary,
            cover_image_url,
            genre,
            created_at,
            user_id,
            profiles:user_id (
              display_name,
              username,
              avatar_emoji,
              photo_url
            )
          `)
          .order('created_at', { ascending: false });
        setStories(formatStoryData(fallbackData || []));
      } else {
        setStories(formatStoryData(data || []));
      }
    } catch (err: any) {
      console.error('Error fetching stories:', err);
      showToast(`Failed to load story feed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const matchesSearch = searchQuery === '' || 
      c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || 
      (c.mood && c.mood.toLowerCase() === selectedCategory.toLowerCase()) ||
      (c.interests && (c.interests as string[]).some(i => i.toLowerCase() === selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const filteredStories = stories.filter((s) => {
    const matchesSearch = searchQuery === '' || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = selectedCategory === 'All' || (s.genre && s.genre.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const featuredCharacter = characters[0];
  const featuredStory = stories[0];

  return (
    <div className={`${isStoryMode ? 'min-h-screen bg-transparent text-warm-900 dark:text-warm-50' : 'rp-page'} font-sans pb-24 relative overflow-hidden transition-colors duration-300`}>
      
      {/* Ambient Lighting & Glow Spheres */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl pointer-events-none ${
        isStoryMode ? 'bg-gradient-to-b from-purple-600/15 via-indigo-600/10 to-transparent' : 'bg-gradient-to-b from-red-600/15 via-amber-600/10 to-transparent'
      }`} />

      <div className={`${isStoryMode ? 'max-w-7xl' : 'max-w-[1420px]'} mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-8`}>

        {/* ── 1. CINEMATIC HERO SECTION ── */}
        <section className={`flex flex-col items-center text-center ${isStoryMode ? 'pt-6 sm:pt-10' : 'pt-8 sm:pt-14'} space-y-6`}>
          
          {/* Status Pill */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-inner ${
            isStoryMode 
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
              : 'border-[#c99b50]/55 bg-black/25 text-[#e9c680]'
          }`}>
            <Sparkles size={14} className="animate-spin" />
            <span>{isStoryMode ? 'CHIMERA Publishing Hub' : 'Roleplay discovery'}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 max-w-3xl">
            <h1 className={`${isStoryMode ? 'text-warm-900 dark:text-white' : 'rp-heading'} font-serif text-4xl sm:text-6xl font-extrabold tracking-tight drop-shadow-sm leading-tight`}>
              {isStoryMode ? (
                <>Where <span className="text-purple-600 dark:text-purple-400">Stories</span> Come to Life</>
              ) : (
                <>Find a doorway into someone else’s world.</>
              )}
            </h1>

            <p className={`${isStoryMode ? 'text-warm-600 dark:text-warm-300' : 'rp-copy'} text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-normal`}>
              {isStoryMode
                ? 'Discover immersive novels, original sagas, and world lore written by passionate human creators & AI co-authors.'
                : 'Meet characters, enter worlds, and begin where a story is already waiting.'}
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="w-full max-w-lg relative pt-2">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-warm-400" />
              <input
                type="text"
                placeholder={isStoryMode ? "Search stories by title, author, or genre..." : "Search real public characters by name, mood, or genre"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isStoryMode ? 'bg-white dark:bg-warm-850 border-warm-200 dark:border-warm-750 text-warm-900 dark:text-warm-50 placeholder-warm-400 focus:ring-primary-500' : 'border-[#c99b50]/65 bg-black/40 text-[#f4ead7] placeholder:text-[#b9ad9c] focus:ring-[#d7ad61]'} w-full pl-11 pr-10 py-4 rounded-full border text-xs sm:text-sm font-medium shadow-md focus:outline-none focus:ring-2 transition-all`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>


        {/* ── 2. ROLEPLAY ACTIONS ── */}
        {!isStoryMode && <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/characters')}
            className="rp-card group relative min-h-56 overflow-hidden rounded-2xl p-7 text-left"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,9,17,0.30),rgba(12,9,17,0.80)),url('/images/bg_characters.png')] bg-cover bg-center opacity-70 transition group-hover:scale-105" />
            <div className="relative mt-28 flex items-center gap-3"><span className="rounded-full border border-[#ab80d0]/70 bg-[#24162f]/80 p-3 text-[#d8b6f7]"><Users size={20} /></span><span className="font-serif text-2xl font-semibold text-[#fff3dd]">Characters</span></div>
          </button>

          <button
            onClick={() => navigate('/conversations')}
            className="rp-card group relative min-h-56 overflow-hidden rounded-2xl p-7 text-left"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,9,17,0.22),rgba(12,9,17,0.80)),url('/images/bg_worlds.jpg')] bg-cover bg-center opacity-70 transition group-hover:scale-105" />
            <div className="relative mt-28 flex items-center gap-3"><span className="rounded-full border border-[#8aa5d2]/70 bg-[#142238]/80 p-3 text-[#a8c5fb]"><MessageSquare size={20} /></span><span className="font-serif text-2xl font-semibold text-[#fff3dd]">Chats</span></div>
          </button>

          <button
            onClick={() => navigate('/characters/new')}
            className="rp-card group relative min-h-56 overflow-hidden rounded-2xl p-7 text-left"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,9,17,0.30),rgba(12,9,17,0.83)),url('/images/bg_worlds.jpg')] bg-cover bg-center opacity-60 transition group-hover:scale-105" />
            <div className="relative mt-28 flex items-center gap-3"><span className="rounded-full border border-[#d7b06c]/70 bg-[#312313]/80 p-3 text-[#f0cf8a]"><Sparkles size={20} /></span><span className="font-serif text-2xl font-semibold text-[#fff3dd]">Start with a spark</span></div>
          </button>
        </section>}


        {/* ── 3. EXPLORATION FEED (100% Honest Empty States) ── */}


        {/* ── 4. CATEGORIES & GENRES SELECTOR ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`${isStoryMode ? 'font-serif text-xl font-bold text-warm-900 dark:text-white' : 'rp-heading text-xl font-bold'} flex items-center gap-2`}>
              <Filter size={18} className={isStoryMode ? 'text-purple-500' : 'text-[#e6c377]'} />
              <span>{t('discover.categories')}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(isStoryMode ? STORY_GENRES : ROLEPLAY_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? isStoryMode
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[#9b6934] text-[#fff1ce] shadow-md'
                    : 'border border-[#c99b50]/30 bg-black/35 text-[#c8bba7] hover:border-[#c99b50]/65 hover:text-[#f4d390]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>


        {/* ── 5. COMMUNITY & TRENDING GRID ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`${isStoryMode ? 'font-serif text-2xl font-bold text-warm-900 dark:text-white' : 'rp-heading text-2xl font-bold'} flex items-center gap-2`}>
              {isStoryMode ? <BookOpen size={22} className="text-purple-500" /> : <Users size={22} className="text-[#e6c377]" />}
              <span>{isStoryMode ? 'Published Stories & Sagas' : 'Public characters'}</span>
            </h2>

            <button
              onClick={() => navigate(isStoryMode ? '/stories' : '/characters')}
              className={`${isStoryMode ? 'text-xs font-bold text-warm-500 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white' : 'text-xs font-bold text-[#c9bda9] hover:text-[#f8e6bf]'} flex items-center gap-1`}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-warm-200 dark:bg-warm-800 animate-pulse" />
              ))}
            </div>
          ) : !isStoryMode ? (
            filteredCharacters.length === 0 ? (
              <div className="rp-panel rounded-3xl px-6 py-16 text-center">
                <Sparkles className="mx-auto mb-5 text-[#e7c272]" size={34} />
                <h3 className="rp-heading text-3xl font-semibold">{searchQuery || selectedCategory !== 'All' ? 'No doorway found' : 'The public rooms are quiet for now'}</h3>
                <p className="rp-copy mx-auto mt-3 max-w-xl text-sm leading-relaxed">{searchQuery || selectedCategory !== 'All' ? `Nothing public matches “${searchQuery || selectedCategory}” yet. Try another path.` : 'When creators publish characters and worlds, you will find them here. Your own story can be the first doorway.'}</p>
                <button onClick={searchQuery || selectedCategory !== 'All' ? () => { setSearchQuery(''); setSelectedCategory('All'); } : () => navigate('/characters/new')} className="rp-gold-button mt-6">{searchQuery || selectedCategory !== 'All' ? 'Clear search' : 'Create a character'}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCharacters.map((char) => (
                  <div
                    key={char.id}
                    className="rp-card p-6 rounded-3xl transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                    onClick={() => setSelectedChar(char)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        photoUrl={char.photo_url}
                        emoji={char.avatar_emoji}
                        size="lg"
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-base text-[#fff3df] truncate group-hover:text-[#f1cf8d] transition-colors">
                          {char.display_name}
                        </h4>
                        <p className="text-xs text-[#c9bda9] line-clamp-2 leading-relaxed">
                          {char.bio || 'A public character waiting for the right story.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#c99b50]/20 text-xs">
                      <span className="text-[#b9ad9c] font-medium">{char.username ? `@${char.username}` : 'Creator'}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/characters/${char.id}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#d9b56a]/70 bg-[#73502b] px-4 py-1.5 text-xs font-bold text-[#fff2d3] shadow-md transition hover:bg-[#9b6934]"
                      >
                        <MessageSquare size={13} />
                        <span>Enter their story</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredStories.length === 0 ? (
              <RichEmptyState
                icon={BookOpen}
                accentColor="purple"
                title="No stories found"
                description={searchQuery || selectedCategory !== 'All' ? `No stories match "${searchQuery || selectedCategory}". Try clearing your search query or exploring a different genre.` : "Publish the first original story or saga on CHIMERA!"}
                actionLabel={searchQuery || selectedCategory !== 'All' ? "Clear Search & Filters" : "Write Story"}
                onAction={searchQuery || selectedCategory !== 'All' ? () => { setSearchQuery(''); setSelectedCategory('All'); } : () => navigate('/write/desk')}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    className="p-6 rounded-3xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 hover:border-purple-500/40 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                    onClick={() => navigate(`/stories/${story.id}`)}
                  >
                    <div className="space-y-3">
                      {story.cover_image_url && (
                        <img
                          src={story.cover_image_url}
                          alt={story.title}
                          className="w-full h-40 rounded-2xl object-cover border border-warm-200 dark:border-warm-700"
                        />
                      )}

                      <h4 className="font-serif font-bold text-lg text-warm-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {story.title}
                      </h4>

                      <p className="text-xs text-warm-500 dark:text-warm-400 line-clamp-3 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-warm-800 text-xs">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{story.genre || 'Story'}</span>
                      <span className="text-warm-400">By {story.profiles?.display_name || 'Author'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>

      </div>
    </div>
  );
}
