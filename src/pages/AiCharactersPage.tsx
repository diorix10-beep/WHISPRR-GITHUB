import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MessageSquare, Heart, Sparkles, Compass, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface AICharacter {
  id: string;
  user_id: string;
  creator_id: string;
  greeting: string;
  short_description: string;
  long_description: string;
  personality: string;
  scenario: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  content_rating?: 'SFW' | 'Mature' | 'NSFW';
  avatar_url?: string;
  banner_url?: string;
  chats_count: number;
  likes_count: number;
  followers_count: number;
  created_at: string;
  bot_profile?: {
    display_name: string;
    username: string;
    avatar_emoji: string;
    photo_url: string | null;
  };
  creator_profile?: {
    display_name: string;
    username: string;
  };
}

const CATEGORIES = [
  'All',
  'Romance',
  'Fantasy',
  'Sci-Fi',
  'Horror',
  'Mystery',
  'Action',
  'Adventure',
  'Historical',
  'Slice of Life',
  'Anime',
  'Games',
  'Superheroes',
  'School',
  'Mafia',
  'Royalty',
  'Medieval',
  'Cyberpunk',
  'Post-Apocalyptic',
  'Original Characters (OC)',
  'Fandoms'
];

const RATINGS = [
  'All Ratings',
  'SFW',
  'Mature',
  'NSFW'
];

export default function AiCharactersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All Ratings');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'my-creations' | 'favorites'>('explore');

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_characters')
        .select(`
          *,
          bot_profile:profiles!ai_characters_user_id_fkey(display_name, username, avatar_emoji, photo_url),
          creator_profile:profiles!ai_characters_creator_id_fkey(display_name, username)
        `);

      if (error) throw error;
      
      const ORACLE_FAMILY_IDS = [
        'da01a00a-60d7-41ec-b827-8178cd3bf084', // Oracle
        'da01a00b-60d7-41ec-b827-8178cd3bf084', // Iris
        'da01a00c-60d7-41ec-b827-8178cd3bf084', // Atlas
        'da01a00d-60d7-41ec-b827-8178cd3bf084', // Athena
        'da01a00e-60d7-41ec-b827-8178cd3bf084', // Aegis
        'da01a00f-60d7-41ec-b827-8178cd3bf084'  // Whisprr
      ];
      
      const filtered = (data || []).filter(char => !ORACLE_FAMILY_IDS.includes(char.user_id));
      setCharacters(filtered);

      if (profile?.user_id) {
        const { data: likes } = await supabase
          .from('ai_character_likes')
          .select('character_id')
          .eq('user_id', profile.user_id);
        setLikedIds((likes || []).map(l => l.character_id));

        const { data: follows } = await supabase
          .from('ai_character_followers')
          .select('character_id')
          .eq('user_id', profile.user_id);
        setFollowingIds((follows || []).map(f => f.character_id));
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching characters:', error);
      showToast('Failed to load NEXA Characters', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, showToast]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handleLike = async (characterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) {
      showToast('Please log in to like characters', 'info');
      return;
    }

    const isLiked = likedIds.includes(characterId);
    try {
      if (isLiked) {
        await supabase
          .from('ai_character_likes')
          .delete()
          .eq('character_id', characterId)
          .eq('user_id', profile.user_id);
        setLikedIds(prev => prev.filter(id => id !== characterId));
        setCharacters(prev =>
          prev.map(c => c.id === characterId ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c)
        );
      } else {
        await supabase
          .from('ai_character_likes')
          .insert({ character_id: characterId, user_id: profile.user_id });
        setLikedIds(prev => [...prev, characterId]);
        setCharacters(prev =>
          prev.map(c => c.id === characterId ? { ...c, likes_count: c.likes_count + 1 } : c)
        );
      }
    } catch {
      showToast('Error updating like status', 'error');
    }
  };

  const handleFollow = async (characterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) {
      showToast('Please log in to follow characters', 'info');
      return;
    }

    const isFollowing = followingIds.includes(characterId);
    try {
      if (isFollowing) {
        await supabase
          .from('ai_character_followers')
          .delete()
          .eq('character_id', characterId)
          .eq('user_id', profile.user_id);
        setFollowingIds(prev => prev.filter(id => id !== characterId));
        setCharacters(prev =>
          prev.map(c => c.id === characterId ? { ...c, followers_count: Math.max(0, c.followers_count - 1) } : c)
        );
      } else {
        await supabase
          .from('ai_character_followers')
          .insert({ character_id: characterId, user_id: profile.user_id });
        setFollowingIds(prev => [...prev, characterId]);
        setCharacters(prev =>
          prev.map(c => c.id === characterId ? { ...c, followers_count: c.followers_count + 1 } : c)
        );
      }
    } catch {
      showToast('Error updating follow status', 'error');
    }
  };

  const handleStartChat = async (character: AICharacter) => {
    if (!profile) {
      showToast('Please log in to chat with NEXA Characters', 'info');
      return;
    }

    try {
      showToast(`Opening channel with ${character.bot_profile?.display_name || 'NEXA Character'}...`, 'success');

      const { data: myConvs, error: myConvsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile.user_id);

      if (myConvsError) throw myConvsError;

      const myIds = (myConvs || []).map(c => c.conversation_id);
      if (myIds.length > 0) {
        const { data: match, error: matchError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(type)')
          .in('conversation_id', myIds)
          .eq('user_id', character.user_id);

        if (matchError) throw matchError;

        interface ConversationParticipantMatch {
          conversation_id: string;
          conversations: {
            type: string;
          } | null;
        }
        const existing = (match as unknown as ConversationParticipantMatch[])?.find(
          (m) => m.conversations?.type === 'dm'
        );
        if (existing) {
          navigate(`/messages/${existing.conversation_id}`);
          return;
        }
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: profile.user_id,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      if (!newConv) throw new Error('Failed to create conversation.');

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: profile.user_id },
          { conversation_id: newConv.id, user_id: character.user_id }
        ]);

      if (partError) throw partError;

      await supabase.from('messages').insert({
        conversation_id: newConv.id,
        sender_id: character.user_id,
        content: character.greeting,
        read: false
      });

      await supabase
        .from('conversations')
        .update({
          last_message: character.greeting,
          last_message_at: new Date().toISOString()
        })
        .eq('id', newConv.id);

      navigate(`/messages/${newConv.id}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error starting conversation:', error);
      showToast(error.message || 'Could not start conversation', 'error');
    }
  };

  // Filtered lists
  const exploreCharacters = characters.filter(c => {
    const matchesSearch = 
      c.bot_profile?.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'All' || 
      c.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesRating = 
      selectedRating === 'All Ratings' ||
      c.content_rating === selectedRating;

    return matchesSearch && matchesCategory && matchesRating;
  });

  const filteredCharacters = exploreCharacters.filter(c => {
    if (activeTab === 'explore') return true;
    if (activeTab === 'my-creations') return c.creator_id === profile?.user_id;
    if (activeTab === 'favorites') return likedIds.includes(c.id);
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-br from-warm-900 via-warm-950 to-primary-950/60 p-8 lg:p-12 border border-warm-850 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm tracking-wide uppercase mb-2">
            <Sparkles size={16} />
            <span>Living Digital Society</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-warm-50 mb-3 leading-tight">
            NEXA Character Directory
          </h1>
          <p className="text-warm-400 text-sm lg:text-base">
            Create, customize, and converse with intelligent personas built by the community. Seamlessly follow creators, build relationships, and discover new minds.
          </p>
        </div>
        <button
          onClick={() => navigate('/nexa/create')}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 duration-200"
        >
          <Plus size={20} />
          <span>Create Character</span>
        </button>
      </div>

      {/* Tabs, Search and Rating Filter */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8 border-b border-warm-200 dark:border-warm-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-warm-100 dark:bg-warm-850 rounded-2xl self-stretch lg:self-auto">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'explore'
                ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                : 'text-warm-500 dark:text-warm-450 hover:text-warm-800 dark:hover:text-warm-200'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('my-creations')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'my-creations'
                ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                : 'text-warm-500 dark:text-warm-450 hover:text-warm-800 dark:hover:text-warm-200'
            }`}
          >
            My Creations
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'favorites'
                ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                : 'text-warm-500 dark:text-warm-450 hover:text-warm-800 dark:hover:text-warm-200'
            }`}
          >
            Favorites
          </button>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
          {/* Content Rating Selector */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl px-4 py-3 text-xs text-warm-700 dark:text-warm-300 font-semibold focus:outline-none"
          >
            {RATINGS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-450" />
            <input
              type="text"
              placeholder="Search by name, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-warm-800/80 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 pl-11 pr-4 text-xs text-warm-900 dark:text-warm-50 placeholder-warm-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      {/* Categories Scroller */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-white dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:border-warm-350 dark:hover:border-warm-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main Grid Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl border border-warm-200 dark:border-warm-700/60 bg-white dark:bg-warm-850 p-6 flex flex-col justify-between animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-warm-200 dark:bg-warm-700 rounded-2xl" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/2" />
                  <div className="h-3 bg-warm-200 dark:bg-warm-700 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-warm-200 dark:bg-warm-700 rounded-xl" />
              <div className="flex justify-between items-center border-t border-warm-100 dark:border-warm-800 pt-4">
                <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/4" />
                <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-850 p-8 shadow-sm">
          <div className="w-16 h-16 bg-warm-100 dark:bg-warm-800 rounded-full flex items-center justify-center text-warm-400 dark:text-warm-500 mb-4">
            <Compass size={32} />
          </div>
          <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">No Characters Found</h3>
          <p className="text-warm-500 dark:text-warm-400 text-sm max-w-sm mb-6">
            There are no characters matching your criteria. Try adjusting your search query, selecting another category, or build your own NEXA Character.
          </p>
          <button
            onClick={() => navigate('/nexa/create')}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-all duration-200"
          >
            <Plus size={18} />
            <span>Create NEXA Character</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.map(char => {
            const isLiked = likedIds.includes(char.id);
            const isFollowing = followingIds.includes(char.id);
            const avatarImg = char.avatar_url || char.bot_profile?.photo_url;

            return (
              <div
                key={char.id}
                onClick={() => handleStartChat(char)}
                className="group relative rounded-3xl border border-warm-200 dark:border-warm-700/60 bg-white dark:bg-warm-850 p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary-500/25 dark:hover:border-primary-500/15 dark:hover:bg-warm-800/40 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Visual Accent Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full filter blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {avatarImg ? (
                        <img
                          src={avatarImg}
                          alt={char.bot_profile?.display_name || 'Avatar'}
                          className="w-14 h-14 rounded-2xl object-cover border border-warm-150 dark:border-warm-750"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center text-3xl border border-warm-150 dark:border-warm-750">
                          {char.bot_profile?.avatar_emoji || '🤖'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 truncate">
                          {char.bot_profile?.display_name}
                        </h3>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-primary-500">
                          NEXA Bot
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 rounded-lg">
                        {char.category}
                      </span>
                      {char.content_rating && (
                        <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.2 rounded ${
                          char.content_rating === 'NSFW' 
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400' 
                            : 'bg-warm-200 dark:bg-warm-750 text-warm-600 dark:text-warm-400'
                        }`}>
                          {char.content_rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-warm-600 dark:text-warm-350 text-sm line-clamp-3 mb-4 leading-relaxed h-15">
                    {char.short_description}
                  </p>

                  {/* Character Tags */}
                  {char.tags && char.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-6">
                      {char.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-warm-100 dark:border-warm-800/80 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Chat Count */}
                    <div className="flex items-center gap-1 text-warm-450 hover:text-warm-600 dark:hover:text-warm-200 text-xs">
                      <MessageSquare size={14} />
                      <span>{char.chats_count}</span>
                    </div>

                    {/* Like Action */}
                    <button
                      onClick={(e) => handleLike(char.id, e)}
                      className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
                        isLiked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-warm-450 hover:text-red-400 dark:hover:text-red-300'
                      }`}
                    >
                      <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{char.likes_count}</span>
                    </button>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={(e) => handleFollow(char.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isFollowing
                        ? 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
                        : 'border border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800'
                    }`}
                  >
                    <Star size={12} fill={isFollowing ? 'currentColor' : 'none'} />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
