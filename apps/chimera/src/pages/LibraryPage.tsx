import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookOpen, Trash2, Eye, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StoryLibrary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [libraryItems, setLibraryItems] = useState<StoryLibrary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchLibrary();
    }
  }, [profile]);

  const fetchLibrary = async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('story_library')
        .select(`
          *,
          stories (
            id,
            title,
            summary,
            cover_url,
            genre,
            status,
            profiles:user_id (
              display_name,
              username
            )
          )
        `)
        .eq('user_id', profile.user_id)
        .order('last_read_at', { ascending: false });

      if (error) throw error;
      
      // Calculate progress and chapter numbers
      const itemsWithProgress = await Promise.all(
        (data || []).map(async (item: any) => {
          // Get total chapters in story
          const { count: totalChapters } = await supabase
            .from('story_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', item.story_id)
            .eq('status', 'published');

          // Get chapter_number for current_chapter_id if it exists
          let currentChapterNum = 0;
          if (item.current_chapter_id) {
            const { data: chapData } = await supabase
              .from('story_chapters')
              .select('chapter_number')
              .eq('id', item.current_chapter_id)
              .single();
            if (chapData) currentChapterNum = chapData.chapter_number;
          }

          return {
            ...item,
            total_chapters: totalChapters || 0,
            current_chapter_number: currentChapterNum
          };
        })
      );

      setLibraryItems(itemsWithProgress as any);
    } catch (err: any) {
      showToast(err.message || 'Error fetching library', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeFromLibrary = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('story_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLibraryItems(prev => prev.filter(item => item.id !== id));
      showToast('Removed from library', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error removing from library', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-2xl">
            <Bookmark size={24} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-warm-900 dark:text-white">My Library</h1>
            <p className="text-sm text-warm-500 mt-1">Keep track of your reading progress and favorite creations.</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-warm-850 rounded-2xl h-32 border border-warm-200/50 dark:border-warm-800" />
            ))}
          </div>
        ) : libraryItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-warm-850 rounded-2xl border border-warm-200/60 dark:border-warm-800 p-8">
            <Bookmark className="mx-auto text-warm-300 mb-4" size={48} />
            <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white">Your library is empty</h3>
            <p className="text-warm-500 text-sm mt-2 max-w-sm mx-auto">
              Find amazing stories on the Explore Nexus feed and save them to your library to track progress.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 flex items-center gap-2 bg-red-650 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md mx-auto"
            >
              <Compass size={18} />
              Browse Nexus
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {libraryItems.map((item) => {
              const story = item.stories;
              if (!story) return null;
              
              const totalChaps = item.total_chapters || 0;
              const progressPercent = totalChaps > 0 
                ? Math.round(((item.current_chapter_number || 0) / totalChaps) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/story/${story.id}`)}
                  className="group bg-white dark:bg-warm-850 rounded-2xl border border-warm-200/60 dark:border-warm-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all cursor-pointer relative"
                >
                  {/* Cover Thumb */}
                  <div className="w-full sm:w-24 h-32 bg-warm-100 dark:bg-warm-800 rounded-xl overflow-hidden flex-shrink-0">
                    {story.cover_url ? (
                      <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600/10 to-amber-600/15 flex items-center justify-center">
                        <BookOpen size={24} className="text-red-500/20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">
                            {story.genre}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white mt-1 group-hover:text-red-650 transition-colors line-clamp-1">
                            {story.title}
                          </h3>
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={(e) => removeFromLibrary(e, item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-warm-400 hover:text-red-600 transition-colors"
                          title="Remove from library"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-warm-500 mt-1">
                        by <span className="font-semibold text-warm-650 dark:text-warm-350">@{story.profiles?.username || 'creator'}</span>
                      </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-4 sm:mt-0">
                      <div className="flex justify-between text-xs font-semibold text-warm-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Eye size={13} />
                          {item.current_chapter_number ? `Read Chapter ${item.current_chapter_number}` : 'Not started'} 
                          <span className="opacity-50">/ {item.total_chapters} chapters</span>
                        </span>
                        <span>{progressPercent}% read</span>
                      </div>
                      <div className="w-full h-1.5 bg-warm-100 dark:bg-warm-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-600 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercent || 2}%` }}
                        />
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
