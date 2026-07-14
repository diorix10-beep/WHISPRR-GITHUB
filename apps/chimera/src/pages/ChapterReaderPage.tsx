import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, Sun, Moon, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ChapterReaderPage() {
  const { storyId, chapterNumber } = useParams<{ storyId: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<StoryChapter | null>(null);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);

  // Styling settings
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [serifFont, setSerifFont] = useState(true);

  const chapNum = parseInt(chapterNumber || '1', 10);

  useEffect(() => {
    if (storyId) {
      fetchChapterData();
    }
  }, [storyId, chapterNumber]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);
      
      // Fetch Story details
      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      setStory(storyData);

      // Fetch Total chapter count
      const { count } = await supabase
        .from('story_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .eq('status', 'published');
      
      setTotalChapters(count || 0);

      // Fetch active chapter by number
      const { data: chapData, error: chapError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', storyId)
        .eq('chapter_number', chapNum)
        .eq('status', 'published')
        .maybeSingle();

      if (chapError) throw chapError;

      if (!chapData) {
        setChapter(null);
      } else {
        setChapter(chapData);
        // Track/update progress in library
        if (profile?.user_id) {
          updateReadingProgress(chapData.id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading chapter content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateReadingProgress = async (chapId: string) => {
    if (!profile?.user_id) return;
    try {
      // Check if it exists in library
      const { data: libItem } = await supabase
        .from('story_library')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('story_id', storyId)
        .maybeSingle();

      if (libItem) {
        // Update existing item
        await supabase
          .from('story_library')
          .update({
            current_chapter_id: chapId,
            last_read_at: new Date().toISOString()
          })
          .eq('id', libItem.id);
      } else {
        // Auto-add to library on read
        await supabase
          .from('story_library')
          .insert({
            user_id: profile.user_id,
            story_id: storyId,
            current_chapter_id: chapId
          });
      }
    } catch (err) {
      console.error('Error tracking reading progress:', err);
    }
  };

  const handlePrevChapter = () => {
    if (chapNum > 1) {
      navigate(`/story/${storyId}/chapter/${chapNum - 1}`);
    }
  };

  const handleNextChapter = () => {
    if (chapNum < totalChapters) {
      navigate(`/story/${storyId}/chapter/${chapNum + 1}`);
    }
  };

  const fontClass = {
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl'
  }[fontSize];

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  if (!chapter || !story) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex flex-col items-center justify-center p-8">
        <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white">Chapter not found</h2>
        <button onClick={() => navigate(`/story/${storyId}`)} className="mt-4 bg-red-650 text-white font-semibold px-4 py-2 rounded-xl">
          Back to Story Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 pb-28">
      
      {/* Reader Navbar */}
      <header className="sticky top-0 bg-white/80 dark:bg-warm-850/80 backdrop-blur-lg border-b border-warm-200/50 dark:border-warm-800 z-50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/story/${storyId}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-warm-600 dark:text-warm-300 hover:text-red-650 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Story Hub</span>
          </button>
          
          <div className="text-center max-w-[50%]">
            <h1 className="font-serif font-bold text-sm text-warm-900 dark:text-white truncate">
              {story.title}
            </h1>
            <span className="text-[10px] text-warm-500 dark:text-warm-400 block mt-0.5">
              Chapter {chapter.chapter_number} of {totalChapters}
            </span>
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSerifFont(!serifFont)}
              className={`p-2 rounded-lg border transition-colors ${
                serifFont 
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200 dark:border-red-900/30'
                  : 'bg-white dark:bg-warm-850 text-warm-500 border-warm-200 dark:border-warm-750'
              }`}
              title="Toggle Serif Font"
            >
              <Type size={14} />
            </button>
            <button
              onClick={() => setFontSize(prev => prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : prev === 'lg' ? 'xl' : 'sm')}
              className="p-2 rounded-lg border bg-white dark:bg-warm-850 text-warm-500 border-warm-200 dark:border-warm-750 text-xs font-bold"
              title="Change Font Size"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      {/* Reader Layout */}
      <main className="max-w-2xl mx-auto px-6 mt-12">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-bold tracking-wider text-red-650 dark:text-red-400 block mb-2">
            Chapter {chapter.chapter_number}
          </span>
          <h2 className="font-serif text-3xl font-bold text-warm-900 dark:text-white leading-tight">
            {chapter.title}
          </h2>
          <div className="w-12 h-0.5 bg-red-600/30 mx-auto mt-6" />
        </div>

        {/* Story Text */}
        <article className={`leading-relaxed text-warm-800 dark:text-warm-100 ${fontClass} ${serifFont ? 'font-serif' : 'font-sans'} whitespace-pre-line space-y-6`}>
          {chapter.content || (
            <p className="italic text-center text-warm-400 text-sm py-12">
              This chapter has no content.
            </p>
          )}
        </article>
      </main>

      {/* Bottom Paging Controller */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-white/70 dark:bg-warm-850/70 backdrop-blur-md border-t border-warm-200/50 dark:border-warm-800 z-40">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={handlePrevChapter}
            disabled={chapNum <= 1}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-white dark:bg-warm-850 text-warm-750 dark:text-warm-250 hover:bg-warm-50 dark:hover:bg-warm-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-xs font-bold text-warm-500">
            {progressReadPercent()}% Read
          </span>

          <button
            onClick={handleNextChapter}
            disabled={chapNum >= totalChapters}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-warm-200 dark:border-warm-750 bg-white dark:bg-warm-850 text-warm-750 dark:text-warm-250 hover:bg-warm-50 dark:hover:bg-warm-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

    </div>
  );

  function progressReadPercent() {
    return Math.round((chapNum / totalChapters) * 100);
  }
}
