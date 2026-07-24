import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Compass, Sparkles, MessageSquare, Search, Filter, ShieldCheck, Heart, User, X, Play,
  BookOpen, PenTool, Layers, BookMarked, UserCheck, Globe, Users, ArrowRight, Flame, Plus,
  TrendingUp, Award, ChevronRight
} from 'lucide-react';
import { RichEmptyState } from '../components/common/RichEmptyState';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';
import type { Profile } from '../types';

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

export default function DiscoverPage() {
  const outletContext = useOutletContext<{ creativeMode?: 'roleplay' | 'storytelling' }>();
  const creativeMode = outletContext?.creativeMode || 'roleplay';
  const isStoryMode = creativeMode === 'storytelling';

  const [characters, setCharacters] = useState<Profile[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [selectedChar, setSelectedChar] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { user } = useAuth();
  const { showToast } = useToast();
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
        .select(`
          user_id,
          greeting,
          short_description,
          tags,
          profiles:profiles!ai_characters_user_id_fkey!inner(
            id,
            display_name,
            username,
            avatar_emoji,
            photo_url,
            bio,
            badges,
            role,
            personality_badges
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedCharacters = (data || []).map((char: any) => ({
        ...char.profiles,
        user_id: char.user_id,
        bio: char.short_description || char.profiles?.bio,
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

  const handleStartChat = async (character: Profile) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conv.id, user_id: user.id },
          { conversation_id: conv.id, user_id: character.id }
        ]);

      if (partError) throw partError;

      navigate(`/conversations/${conv.id}`);
    } catch (err: any) {
      showToast('Error creating conversation: ' + err.message, 'error');
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const matchesSearch = searchQuery === '' || 
      c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || true;
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
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-50 font-sans pb-24 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Lighting & Glow Spheres */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl pointer-events-none ${
        isStoryMode ? 'bg-gradient-to-b from-purple-600/15 via-indigo-600/10 to-transparent' : 'bg-gradient-to-b from-red-600/15 via-amber-600/10 to-transparent'
      }`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10 pt-6">

        {/* ── 1. CINEMATIC HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-10 space-y-6">
          
          {/* Status Pill */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-inner ${
            isStoryMode 
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}>
            <Sparkles size={14} className="animate-spin" />
            <span>{isStoryMode ? 'CHIMERA Publishing Hub' : 'CHIMERA Multiverse Discovery'}</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-warm-900 dark:text-white drop-shadow-sm leading-tight">
              {isStoryMode ? (
                <>Where <span className="text-purple-600 dark:text-purple-400">Stories</span> Come to Life</>
              ) : (
                <>Step Into an Infinite <span className="text-red-600 dark:text-red-500">Multiverse</span></>
              )}
            </h1>

            <p className="text-sm sm:text-base text-warm-600 dark:text-warm-300 max-w-xl mx-auto leading-relaxed font-normal">
              {isStoryMode
                ? 'Discover immersive novels, original sagas, and world lore written by passionate human creators & AI co-authors.'
                : 'Roleplay with persistent AI identities, explore deep worldbuilding, and craft original narrative adventures.'}
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="w-full max-w-lg relative pt-2">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-warm-400" />
              <input
                type="text"
                placeholder={isStoryMode ? "Search stories by title, author, or genre..." : "Search characters by name, personality, or tag..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-full bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 text-xs sm:text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-warm-900 dark:text-warm-50 placeholder-warm-400"
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


        {/* ── 2. PRIMARY QUICK ACTIONS BAR ── */}
        <section className="p-3 rounded-3xl bg-white/70 dark:bg-warm-850/80 backdrop-blur-xl border border-warm-200/80 dark:border-warm-750/80 shadow-lg flex items-center justify-around flex-wrap gap-2">
          <button
            onClick={() => navigate('/characters')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-warm-100/50 dark:bg-warm-800/50 hover:bg-red-500/10 text-warm-800 dark:text-warm-200 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Users size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span>Characters</span>
          </button>

          <button
            onClick={() => navigate('/stories')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-warm-100/50 dark:bg-warm-800/50 hover:bg-purple-500/10 text-warm-800 dark:text-warm-200 hover:text-purple-600 dark:hover:text-purple-400 border border-transparent hover:border-purple-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <BookOpen size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
            <span>Stories</span>
          </button>

          <button
            onClick={() => navigate('/worlds')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-warm-100/50 dark:bg-warm-800/50 hover:bg-cyan-500/10 text-warm-800 dark:text-warm-200 hover:text-cyan-600 dark:hover:text-cyan-400 border border-transparent hover:border-cyan-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Globe size={16} className="text-cyan-500 group-hover:scale-110 transition-transform" />
            <span>Worlds</span>
          </button>

          <button
            onClick={() => navigate('/studio')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-warm-100/50 dark:bg-warm-800/50 hover:bg-amber-500/10 text-warm-800 dark:text-warm-200 hover:text-amber-600 dark:hover:text-amber-400 border border-transparent hover:border-amber-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Sparkles size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => navigate('/shards')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Award size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span>SHARDS Hub</span>
          </button>
        </section>


        {/* ── 3. FEATURED HIGHLIGHT SHOWCASE ── */}
        {!isStoryMode && featuredCharacter && (
          <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-warm-900 via-warm-900 to-warm-950 text-white border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-wider">
                  <Flame size={14} />
                  <span>Featured Identity of the Week</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {featuredCharacter.display_name}
                </h2>

                <p className="text-xs sm:text-sm text-warm-300 leading-relaxed line-clamp-3">
                  {featuredCharacter.bio || "An intriguing AI companion ready for deep storytelling and roleplay adventures."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleStartChat(featuredCharacter)}
                    className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    <span>Start Roleplay Chat</span>
                  </button>

                  <button
                    onClick={() => setSelectedChar(featuredCharacter)}
                    className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Avatar Showcase */}
              <div className="shrink-0 self-center md:self-auto">
                <Avatar
                  photoUrl={featuredCharacter.photo_url}
                  emoji={featuredCharacter.avatar_emoji}
                  size="xl"
                />
              </div>

            </div>
          </section>
        )}

        {isStoryMode && featuredStory && (
          <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-950 via-warm-900 to-warm-950 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                  <BookMarked size={14} />
                  <span>Featured Novel of the Week</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {featuredStory.title}
                </h2>

                <p className="text-xs sm:text-sm text-purple-200 leading-relaxed line-clamp-3">
                  {featuredStory.summary || "Dive into an enchanting literary journey crafted with passion."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/stories/${featuredStory.id}`)}
                    className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <BookOpen size={16} />
                    <span>Read Novel</span>
                  </button>
                </div>
              </div>

              {/* Book Cover Showcase */}
              {featuredStory.cover_image_url && (
                <div className="shrink-0 self-center md:self-auto">
                  <img
                    src={featuredStory.cover_image_url}
                    alt={featuredStory.title}
                    className="w-36 h-48 sm:w-44 sm:h-60 rounded-2xl border-2 border-white/20 shadow-2xl object-cover"
                  />
                </div>
              )}

            </div>
          </section>
        )}


        {/* ── 4. CATEGORIES & GENRES SELECTOR ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
              <Filter size={18} className={isStoryMode ? 'text-purple-500' : 'text-red-500'} />
              <span>Explore Categories &amp; Genres</span>
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
                      : 'bg-red-600 text-white shadow-md'
                    : 'bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 border border-warm-200 dark:border-warm-750'
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
            <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={22} className={isStoryMode ? 'text-purple-500' : 'text-red-500'} />
              <span>{isStoryMode ? 'Trending Stories & Sagas' : 'Trending AI Characters'}</span>
            </h2>

            <button
              onClick={() => navigate(isStoryMode ? '/stories' : '/characters')}
              className="text-xs font-bold text-warm-500 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white flex items-center gap-1"
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
              <RichEmptyState
                icon={Users}
                title="No characters found"
                description="Try clearing your search filters or create the first character!"
                actionLabel="Create Character"
                onAction={() => navigate('/studio')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCharacters.map((char) => (
                  <div
                    key={char.id}
                    className="p-6 rounded-3xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 hover:border-red-500/40 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                    onClick={() => setSelectedChar(char)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        photoUrl={char.photo_url}
                        emoji={char.avatar_emoji}
                        size="lg"
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-base text-warm-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {char.display_name}
                        </h4>
                        <p className="text-xs text-warm-500 dark:text-warm-400 line-clamp-2 leading-relaxed">
                          {char.bio || "Persistant AI identity ready for roleplay."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-warm-800 text-xs">
                      <span className="text-warm-400 font-medium">@{char.username || 'creator'}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(char);
                        }}
                        className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
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
                title="No stories found"
                description="Try clearing your search query or publish the first story!"
                actionLabel="Write Story"
                onAction={() => navigate('/write/desk')}
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
