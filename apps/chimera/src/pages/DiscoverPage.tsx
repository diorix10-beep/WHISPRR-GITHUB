import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Filter, MessageSquare, ChevronRight, UserPlus, Heart, X, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';
import type { Profile } from '../types';

export default function DiscoverPage() {
  const [characters, setCharacters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChar, setSelectedChar] = useState<Profile | null>(null);
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters();
  }, []);

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
          profiles!inner(
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
      
      // Flatten the response so it matches the expected Profile array format
      const formattedCharacters = data?.map((char: any) => ({
        ...char.profiles,
        user_id: char.user_id, // ensure user_id is the bot's user_id
        bio: char.short_description || char.profiles.bio,
      })) || [];
      
      setCharacters(formattedCharacters);
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      showToast(`Failed to load discover feed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (character: Profile) => {
    if (!user) return;
    try {
      // 1. Create a DM conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add both participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conv.id, user_id: user.id, role: 'admin' },
          { conversation_id: conv.id, user_id: character.user_id, role: 'member' }
        ]);

      if (partError) throw partError;

      // 3. Navigate to the chat
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

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 pb-20 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-warm-900/80 backdrop-blur-md border-b border-warm-200 dark:border-warm-800 p-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
              <Sparkles className="text-primary-500" size={28} />
              Discover
            </h1>
            <p className="text-warm-500 text-sm mt-1">Explore the CHIMERA roleplay universe.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-warm-100 dark:bg-warm-800 border-transparent rounded-full focus:ring-2 focus:ring-primary-500 text-warm-900 dark:text-warm-50 placeholder-warm-400"
              />
            </div>
            <button className="p-2 rounded-full bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-warm-500">No characters found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCharacters.map(char => (
              <div 
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className="group relative bg-white dark:bg-warm-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-warm-200 dark:border-warm-800 flex flex-col"
              >
                {/* Cover Image / Gradient */}
                <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-primary-400 to-accent-500">
                  {char.photo_url ? (
                    <img 
                      src={char.photo_url} 
                      alt={char.display_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                      {char.avatar_emoji}
                    </div>
                  )}
                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Name and Badges pinned to bottom */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-serif font-bold text-xl truncate flex items-center gap-2 shadow-black drop-shadow-md">
                      {char.display_name}
                      <UserBadges badges={char.badges} role={char.role} size="sm" />
                    </h3>
                    <p className="text-white/80 text-sm truncate">@{char.username}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-warm-600 dark:text-warm-300 text-sm line-clamp-2 mb-4 flex-1">
                    {char.bio || 'No bio provided.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {char.personality_badges?.slice(0, 3).map((badge, i) => (
                      <span key={i} className="px-2 py-1 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 text-xs rounded-lg font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedChar(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-warm-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedChar(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="h-64 sm:h-80 w-full relative shrink-0 bg-gradient-to-br from-primary-500 to-accent-600">
              {selectedChar.photo_url ? (
                <img src={selectedChar.photo_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-50">
                  {selectedChar.avatar_emoji}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-warm-900 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
                    {selectedChar.display_name}
                    <UserBadges badges={selectedChar.badges} role={selectedChar.role} size="md" />
                  </h2>
                  <p className="text-white/80 text-lg drop-shadow-md">@{selectedChar.username}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="space-y-6">
                
                <div>
                  <h4 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider mb-2">About</h4>
                  <p className="text-warm-700 dark:text-warm-300 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                    {selectedChar.bio || 'No bio provided.'}
                  </p>
                </div>

                {selectedChar.personality_badges && selectedChar.personality_badges.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-warm-900 dark:text-warm-50 uppercase tracking-wider mb-3">Personality</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChar.personality_badges.map((badge, i) => (
                        <span key={i} className="px-3 py-1.5 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-200 rounded-xl text-sm font-medium">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="p-6 border-t border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 shrink-0">
              <button
                onClick={() => handleStartChat(selectedChar)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold text-lg shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare size={24} />
                Start Roleplay
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
