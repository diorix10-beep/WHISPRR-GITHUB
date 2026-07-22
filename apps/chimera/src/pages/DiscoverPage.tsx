import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Compass, Sparkles, MessageSquare, Search, Filter, ShieldCheck, Heart, User, X, Play, BookOpen, PenTool, Layers, BookMarked, UserCheck } from 'lucide-react';
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
  'Fantasy',
  'Sci-Fi',
  'Mystery & Thriller',
  'Romance',
  'Historical Fiction',
  'LitRPG / GameLit',
  'Cyberpunk',
  'Supernatural & Horror',
  'Slice of Life',
  'Poetry'
];

const ROLEPLAY_CATEGORIES = [
  'Fantasy',
  'Sci-Fi',
  'Cyberpunk',
  'Slice of Life',
  'Mystery',
  'Romance',
  'Historical',
  'Supernatural'
];

const MOCK_CHARACTERS = [
  {
    id: 'mock-1',
    user_id: 'mock-1',
    display_name: 'Aether the Archmage',
    username: 'aether_mage',
    avatar_emoji: '🧙‍♂️',
    bio: 'Keeper of ancient arcane knowledge, master of elemental sorcery, and guide through the mystical realm of Eldoria.',
    role: 'user',
    badges: ['verified'],
    personality_badges: ['Wise', 'Arcane', 'Mysterious']
  },
  {
    id: 'mock-2',
    user_id: 'mock-2',
    display_name: 'Elena Starling',
    username: 'elena_starling',
    avatar_emoji: '🗡️',
    bio: 'Rogue commander of the Silver Vanguard. Sharp-tongued, fearless, and ready for any high-stakes fantasy adventure.',
    role: 'user',
    badges: ['founder'],
    personality_badges: ['Bold', 'Strategic', 'Charming']
  },
  {
    id: 'mock-3',
    user_id: 'mock-3',
    display_name: 'Kaelen Drake',
    username: 'kaelen_drake',
    avatar_emoji: '🌌',
    bio: 'Starship captain and veteran explorer searching for lost alien artifacts on the uncharted galactic frontier.',
    role: 'user',
    badges: ['verified'],
    personality_badges: ['Sci-Fi', 'Leader', 'Adventurous']
  },
  {
    id: 'mock-4',
    user_id: 'mock-4',
    display_name: 'Nova AI',
    username: 'nova_cyber',
    avatar_emoji: '⚡',
    bio: 'Sentient cybernetic companion navigating neon-lit megacities and unraveling corporate synth-conspiracies.',
    role: 'user',
    badges: ['verified'],
    personality_badges: ['Cyberpunk', 'Witty', 'Tech']
  }
] as unknown as Profile[];

export default function DiscoverPage() {
  const outletContext = useOutletContext<{ creativeMode?: 'roleplay' | 'storytelling' }>();
  const creativeMode = outletContext?.creativeMode || 'roleplay';
  const isStoryMode = creativeMode === 'storytelling';

  const [characters, setCharacters] = useState<Profile[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [selectedChar, setSelectedChar] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setSearchQuery('');
    setSelectedGenre(null);
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
      
      setCharacters(formattedCharacters.length > 0 ? formattedCharacters : MOCK_CHARACTERS);
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      setCharacters(MOCK_CHARACTERS);
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
          { conversation_id: conv.id, user_id: user.id, role: 'admin' },
          { conversation_id: conv.id, user_id: character.user_id, role: 'member' }
        ]);

      if (partError) throw partError;

      navigate(`/conversations/${conv.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      showToast('Failed to start conversation', 'error');
    }
  };

  const filteredCharacters = characters.filter(c => 
    c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStories = stories.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.profiles?.display_name && s.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = !selectedGenre || (s.genre && s.genre.toLowerCase() === selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 pb-20 lg:pb-8">
      {/* Header with Distinct Identity */}
      <div className={`sticky top-0 z-20 bg-white/90 dark:bg-warm-900/90 backdrop-blur-md border-b transition-colors ${
        isStoryMode 
          ? 'border-purple-200 dark:border-purple-900/40 shadow-sm' 
          : 'border-warm-200 dark:border-warm-800 shadow-sm'
      } p-4 lg:px-8`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                isStoryMode 
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              }`}>
                {isStoryMode ? 'Storytelling Mode 📖' : 'Roleplay Mode 🎭'}
              </span>
            </div>
            
            <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2.5 mt-1.5">
              {isStoryMode ? (
                <>
                  <BookOpen className="text-purple-500" size={26} />
                  <span>Literary Haven & Story Library</span>
                </>
              ) : (
                <>
                  <Sparkles className="text-red-500" size={26} />
                  <span>Roleplay Universe</span>
                </>
              )}
            </h1>
            <p className="text-warm-500 dark:text-warm-400 text-xs sm:text-sm mt-1">
              {isStoryMode 
                ? 'Read, write, and explore published books, original novels, series, and written chapters by master authors.' 
                : 'Explore interactive AI characters, custom personas, and rich roleplay sessions.'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <input
                type="text"
                placeholder={isStoryMode ? "Search books, stories, authors, genres..." : "Search characters, personas, worlds..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-warm-100 dark:bg-warm-800 border-transparent rounded-full focus:ring-2 text-warm-900 dark:text-warm-50 placeholder-warm-400 ${
                  isStoryMode ? 'focus:ring-purple-500' : 'focus:ring-red-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Genre Pill Selector for Storytelling Mode */}
        {isStoryMode && (
          <div className="max-w-7xl mx-auto flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedGenre === null
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-750'
              }`}
            >
              All Genres
            </button>
            {STORY_GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedGenre === genre
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-750'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${
              isStoryMode ? 'border-purple-500' : 'border-red-500'
            }`} />
          </div>
        ) : isStoryMode ? (
          /* STORYTELLING MODE EXPERIENCE */
          filteredStories.length === 0 ? (
            <RichEmptyState
              icon={BookOpen}
              title="No stories match your search"
              description="We could not find any published books or stories matching those terms. Try selecting a literary genre or writing a brand new story."
              actionLabel="Write a Story"
              onAction={() => navigate('/stories/new')}
              categories={STORY_GENRES}
              onSelectCategory={(cat) => setSelectedGenre(cat)}
              accentColor="purple"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStories.map(story => (
                <div 
                  key={story.id}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="group relative bg-white dark:bg-warm-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-warm-200 dark:border-warm-800 flex flex-col hover:-translate-y-1"
                >
                  {/* Book Cover / Aesthetic Header */}
                  <div className="h-52 w-full relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-warm-950 flex items-center justify-center p-4">
                    {story.cover_image_url ? (
                      <img 
                        src={story.cover_image_url} 
                        alt={story.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <BookMarked size={40} className="mx-auto text-purple-300/60" />
                        <h4 className="font-serif font-bold text-white text-base line-clamp-2 px-2 shadow-black drop-shadow">
                          {story.title}
                        </h4>
                      </div>
                    )}
                    
                    {/* Genre Tag Badge */}
                    {story.genre && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-500/30">
                        {story.genre}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-3 left-4 right-4 text-white flex items-center justify-between">
                      <div className="truncate">
                        <h3 className="font-serif font-bold text-lg truncate shadow-black drop-shadow">
                          {story.title}
                        </h3>
                        <p className="text-purple-200 text-xs truncate flex items-center gap-1">
                          <span>by</span>
                          <span className="font-bold">{story.profiles?.display_name || 'Anonymous Author'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <p className="text-warm-600 dark:text-warm-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {story.summary || 'No story summary provided. Click to start reading...'}
                    </p>
                    
                    <div className="pt-3 border-t border-warm-100 dark:border-warm-800 flex items-center justify-between">
                      <span className="text-[11px] text-warm-400 flex items-center gap-1 font-medium">
                        <BookOpen size={13} className="text-purple-500" />
                        <span>Published Story</span>
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/stories/${story.id}`); }}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Read Story</span>
                        <BookOpen size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ROLEPLAY MODE EXPERIENCE */
          filteredCharacters.length === 0 ? (
            <RichEmptyState
              icon={Compass}
              title="No characters match your search"
              description="We could not find any active AI characters with those terms. Try selecting a category or creating a brand new character."
              actionLabel="Create a Character"
              onAction={() => navigate('/characters/new')}
              categories={ROLEPLAY_CATEGORIES}
              onSelectCategory={(cat) => setSearchQuery(cat)}
              accentColor="red"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCharacters.map(char => (
                <div 
                  key={char.id}
                  onClick={() => setSelectedChar(char)}
                  className="group relative bg-white dark:bg-warm-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-warm-200 dark:border-warm-800 flex flex-col hover:-translate-y-1"
                >
                  {/* Cover Image / Gradient */}
                  <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-900">
                    {char.photo_url ? (
                      <img 
                        src={char.photo_url} 
                        alt={char.display_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                        {char.avatar_emoji || '👤'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif font-bold text-xl truncate flex items-center gap-2 shadow-black drop-shadow-md">
                        {char.display_name}
                        <UserBadges badges={char.badges} role={char.role} size="sm" />
                      </h3>
                      <p className="text-white/80 text-sm truncate">@{char.username}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <p className="text-warm-600 dark:text-warm-300 text-sm line-clamp-2">
                      {char.bio || 'No bio provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-800">
                      <div className="flex flex-wrap gap-1.5 max-w-[65%]">
                        {char.personality_badges?.slice(0, 2).map((badge, i) => (
                          <span key={i} className="px-2 py-0.5 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 text-[10px] rounded-lg font-medium">
                            {badge}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartChat(char); }}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <MessageSquare size={12} />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Quick Character Preview Modal */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-warm-200 dark:border-warm-800 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedChar(null)}
              className="absolute top-4 right-4 p-2 text-warm-400 hover:text-warm-700 dark:hover:text-white rounded-full hover:bg-warm-100 dark:hover:bg-warm-800"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <Avatar photoUrl={selectedChar.photo_url} emoji={selectedChar.avatar_emoji} size="lg" />
              <div>
                <h3 className="font-serif font-bold text-xl text-warm-900 dark:text-white flex items-center gap-2">
                  {selectedChar.display_name}
                  <UserBadges badges={selectedChar.badges} role={selectedChar.role} size="sm" />
                </h3>
                <p className="text-sm text-warm-500">@{selectedChar.username}</p>
              </div>
            </div>

            <p className="text-sm text-warm-700 dark:text-warm-300 mb-6 leading-relaxed">
              {selectedChar.bio || 'No bio provided.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedChar(null)}
                className="flex-1 py-3 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 text-warm-800 dark:text-warm-200 font-bold rounded-2xl text-xs transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const charToStart = selectedChar;
                  setSelectedChar(null);
                  handleStartChat(charToStart);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                <span>Start Roleplay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
