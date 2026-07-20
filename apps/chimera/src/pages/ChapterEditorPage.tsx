import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, ChevronRight, ChevronLeft, Send, Eye, BookOpen, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useToast } from '../contexts/ToastContext';

export default function ChapterEditorPage() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<StoryChapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storyId && chapterId) {
      fetchData();
    }
  }, [storyId, chapterId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Story Details
      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      setStory(storyData);

      // Fetch Active Chapter Details
      const { data: chapData, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      setChapter(chapData);
      setTitle(chapData.title);
      setContent(chapData.content || '');
      setStatus(chapData.status);

    } catch (err: any) {
      showToast(err.message || 'Error loading chapter details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (publishStatus?: 'draft' | 'published') => {
    const activeStatus = publishStatus || status;
    try {
      setSaving(true);
      const payload: Partial<StoryChapter> = {
        title,
        content,
        status: activeStatus,
        updated_at: new Date().toISOString()
      };

      if (activeStatus === 'published') {
        payload.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('story_chapters')
        .update(payload)
        .eq('id', chapterId);

      if (error) throw error;
      
      setStatus(activeStatus);
      showToast(activeStatus === 'published' ? 'Chapter Published!' : 'Draft Saved Successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving chapter', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex flex-col">
      
      {/* Editor Navbar */}
      <header className="bg-white dark:bg-warm-850 border-b border-warm-200 dark:border-warm-800 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/write`)}
            className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-850 text-warm-650 dark:text-warm-350"
            title="Exit to Workspace"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs text-warm-500 font-semibold">{story?.title}</h1>
            <span className="text-[10px] text-warm-400 block">Editing Chapter #{chapter?.chapter_number}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {status === 'draft' ? (
            <>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warm-250 dark:border-warm-750 text-warm-700 dark:text-warm-300 font-bold text-xs hover:bg-warm-50 dark:hover:bg-warm-800 transition-all"
              >
                <Save size={14} />
                Save Draft
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Globe size={14} />
                Publish Chapter
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md border border-green-200/50 dark:border-green-900/30">
                Published
              </span>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Save size={14} />
                Update Publish
              </button>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="px-3 py-1.5 text-xs text-warm-500 border border-warm-200 rounded-xl hover:bg-warm-50 dark:hover:bg-warm-800"
              >
                Revert to Draft
              </button>
            </>
          )}

        </div>
      </header>

      {/* Editor & Sidebar Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Main Editor Panel */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center bg-warm-50 dark:bg-warm-900">
          <div className="max-w-2xl w-full flex flex-col h-full space-y-6">
            
            {/* Title field */}
            <input
              type="text"
              placeholder="Chapter Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-serif font-bold bg-transparent border-0 border-b border-transparent focus:border-warm-250 dark:focus:border-warm-750 focus:ring-0 px-0 pb-2 text-warm-900 dark:text-white"
            />

            {/* Content field */}
            <textarea
              placeholder="Start writing your masterpiece here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 min-h-[500px] text-lg font-serif bg-transparent border-0 focus:ring-0 px-0 text-warm-800 dark:text-warm-100 placeholder-warm-400 resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
