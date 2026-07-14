import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Star, Heart, Bookmark, Eye, PenTool } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story } from '../types';
import { useToast } from '../contexts/ToastContext';

const GENRES = [
  'All',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Mystery',
  'Horror',
  'Historical',
  'Adventure',
  'Drama',
  'Non-Fiction'
];

export default function ExploreNexusPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    fetchStories();
  }, [selectedGenre]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_emoji
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (selectedGenre !== 'All') {
        query = query.eq('genre', selectedGenre);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map statistics
      const storiesWithStats = await Promise.all(
        (data || []).map(async (story) => {
          // Fetch chapters count
          const { count: chaptersCount } = await supabase
            .from('story_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id)
            .eq('status', 'published');

          // Fetch votes count
          const { count: votesCount } = await supabase
            .from('story_votes')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return {
            ...story,
            chapters_count: chaptersCount || 0,
            votes_count: votesCount || 0
          };
        })
      );

      setStories(storiesWithStats);
    } catch (err: any) {
      showToast(err.message || 'Error fetching stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-20">
      {/* Featured Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-800 to-amber-900 text-white py-16 px-8 sm:px-12 rounded-b-[2.5rem] shadow-xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />
        <div className="relative max-w-4xl mx-auto z-10 text-center sm:text-left">
          <span className="bg-red-500/30 border border-red-400/30 text-red-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Explore Nexus
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mt-4 leading-tight">
            Where Human Creativity Meets Infinite Collaboration
          </h1>
          <p className="text-warm-100 mt-4 max-w-2xl text-base sm:text-lg leading-relaxed">
            Read captivating stories, support fellow creators, and outline worlds. Quietly brainstorm ideas with your Oracle AI partner when inspiration stalls.
          </p>
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-4">
            <button
              onClick={() => navigate('/write')}
              className="flex items-center gap-2 bg-white text-red-900 hover:bg-warm-100 transition-all font-semibold px-6 py-3 rounded-xl shadow-lg hover:scale-105 active:scale-95"
            >
              <PenTool size={18} />
              Start Writing
            </button>
            <button
              onClick={() => navigate('/roleplay')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all font-semibold px-6 py-3 rounded-xl hover:scale-105 active:scale-95"
            >
              <Star size={18} />
              Explore Roleplay
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8 bg-white dark:bg-warm-850 p-4 rounded-2xl border border-warm-200/60 dark:border-warm-800 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
            <input
              type="text"
              placeholder="Search stories, summaries, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedGenre === genre
                    ? 'bg-red-550 border-red-550 text-white shadow-sm shadow-red-500/20'
                    : 'bg-warm-100 dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-650 dark:text-warm-350 hover:bg-warm-200 dark:hover:bg-warm-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-warm-850 rounded-2xl h-80 border border-warm-200/50 dark:border-warm-800" />
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200/60 dark:border-warm-800 p-8">
            <BookOpen className="mx-auto text-warm-400 mb-4 animate-bounce" size={48} />
            <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white">No stories found</h3>
            <p className="text-warm-500 text-sm mt-2 max-w-md mx-auto">
              We couldn't find any stories matching your search. Be the first to start writing!
            </p>
            <button
              onClick={() => navigate('/write')}
              className="mt-6 bg-red-650 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              Create a Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const author = story.profiles;
              return (
                <div
                  key={story.id}
                  onClick={() => navigate(`/story/${story.id}`)}
                  className="group bg-white dark:bg-warm-850 rounded-3xl border border-warm-200/60 dark:border-warm-800 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  {/* Cover Image */}
                  <div className="h-44 w-full bg-warm-100 dark:bg-warm-800 relative overflow-hidden">
                    {story.cover_url ? (
                      <img
                        src={story.cover_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600/10 to-amber-600/15 flex items-center justify-center">
                        <BookOpen size={48} className="text-red-500/20" />
                      </div>
                    )}
                    <span className="absolute top-4 right-4 bg-warm-950/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                      {story.genre}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white line-clamp-1 mb-1.5 group-hover:text-red-650 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-xs text-warm-500 mb-3 flex items-center gap-1.5">
                        <span className="text-base">{author?.avatar_emoji || '✍️'}</span>
                        by <span className="font-semibold text-warm-700 dark:text-warm-300">@{author?.username || 'creator'}</span>
                      </p>
                      <p className="text-sm text-warm-650 dark:text-warm-350 line-clamp-3 leading-relaxed mb-4">
                        {story.summary || 'No description provided.'}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div>
                      {/* Tags */}
                      {story.tags && story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {story.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-warm-400 border-t border-warm-100 dark:border-warm-800 pt-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <BookOpen size={13} />
                            {story.chapters_count || 0} chapters
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={13} className="text-red-500" />
                            {story.votes_count || 0} votes
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-md">
                          {story.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
