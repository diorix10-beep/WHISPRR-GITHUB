import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Flame, Star, Clock, BookOpen, ChevronRight, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CharacterCard } from '../components/chimera/CharacterCard';
import { motion } from 'framer-motion';

export default function CreatorDashboardPage() {
  const { creativeMode } = useOutletContext<{ creativeMode: 'roleplay' | 'storytelling' }>();
  const navigate = useNavigate();
  
  const [trendingCharacters, setTrendingCharacters] = useState<any[]>([]);
  const [trendingStories, setTrendingStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryData();
  }, [creativeMode]);

  const fetchDiscoveryData = async () => {
    try {
      setLoading(true);
      if (creativeMode === 'roleplay') {
        const { data, error } = await supabase
          .from('ai_characters')
          .select('*, creator:profiles!ai_characters_creator_id_fkey(username), profiles!ai_characters_user_id_fkey(display_name, avatar_emoji, photo_url)')
          .eq('visibility', 'public')
          .order('updated_at', { ascending: false })
          .limit(12);
        
        if (error) throw error;
        
        // Map data to fit CharacterCard structure
        const mapped = data?.map(c => ({
          ...c,
          bot_profile: c.profiles || {},
          creator: c.creator || { username: 'anonymous' }
        }));
        
        setTrendingCharacters(mapped || []);
      } else {
        const { data, error } = await supabase
          .from('stories')
          .select('*, author:profiles!stories_user_id_fkey(username, display_name)')
          .eq('visibility', 'public')
          .order('updated_at', { ascending: false })
          .limit(12);
          
        if (error) throw error;
        setTrendingStories(data || []);
      }
    } catch (err) {
      console.error('Error fetching discovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={creativeMode}
        className="mb-10 text-center sm:text-left px-4 sm:px-0"
      >
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-warm-900 dark:text-warm-50 mb-3 tracking-tight">
          {creativeMode === 'roleplay' ? 'Discover Characters' : 'Discover Stories'}
        </h1>
        <p className="text-warm-500 dark:text-warm-400 text-base sm:text-lg max-w-2xl">
          {creativeMode === 'roleplay' 
            ? 'Chat with thousands of user-created AI personalities. Find your next adventure.' 
            : 'Immerse yourself in original fiction and lore crafted by the community.'}
        </p>
      </motion.div>

      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide px-4 sm:px-0">
        <button className="px-5 py-2 rounded-full bg-red-600 text-white font-bold text-sm shadow-md whitespace-nowrap">
          <Flame size={14} className="inline mr-1.5" /> Trending
        </button>
        <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">
          <Clock size={14} className="inline mr-1.5" /> Latest
        </button>
        {creativeMode === 'roleplay' ? (
          <>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Romance</button>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Fantasy</button>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Sci-Fi</button>
          </>
        ) : (
          <>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Fiction</button>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Fanfic</button>
            <button className="px-5 py-2 rounded-full bg-white dark:bg-warm-850 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 font-bold text-sm hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors whitespace-nowrap">Poetry</button>
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 gap-3 px-4 sm:px-0">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="bg-warm-200 dark:bg-warm-800 animate-pulse rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      ) : creativeMode === 'roleplay' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 gap-3 px-4 sm:px-0">
          {trendingCharacters.length > 0 ? (
            trendingCharacters.map(char => (
              <CharacterCard
                key={char.id}
                character={char}
                onClick={() => navigate(`/characters/${char.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-warm-50 dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-800">
              <MessageSquare size={48} className="mx-auto text-warm-400 dark:text-warm-600 mb-4" />
              <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white mb-2">No characters found</h3>
              <p className="text-warm-500">The community hasn't created any public characters yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 gap-3 px-4 sm:px-0">
          {trendingStories.length > 0 ? (
            trendingStories.map(story => (
              <div 
                key={story.id} 
                onClick={() => navigate(`/stories/${story.id}`)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="w-full aspect-[2/3] bg-warm-800 rounded-xl overflow-hidden relative shadow-lg border border-warm-200 dark:border-warm-800 group-hover:border-red-400 dark:group-hover:border-red-600 transition-colors mb-3">
                  {story.cover_url ? (
                    <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-warm-100 to-warm-200 dark:from-warm-800 dark:to-warm-900 flex items-center justify-center">
                      <BookOpen size={32} className="text-warm-400 dark:text-warm-700" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded shadow-sm bg-black/60 text-white backdrop-blur-md">
                      {story.genre}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-serif font-bold text-warm-900 dark:text-white text-base line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5 truncate">
                  by {story.author?.username || 'Unknown'}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-warm-50 dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-800">
              <BookOpen size={48} className="mx-auto text-warm-400 dark:text-warm-600 mb-4" />
              <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white mb-2">No stories found</h3>
              <p className="text-warm-500">The community hasn't published any stories yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
