import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe, MoreHorizontal, AlignLeft, Bold, Italic, Underline, Link, Image as ImageIcon, Check, Sparkles, Download, Maximize2, Feather } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useToast } from '../contexts/ToastContext';
import { AiCoPilotDrawer } from '../components/writers/AiCoPilotDrawer';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Human-First & AI States
  const [focusMode, setFocusMode] = useState(false);
  const [isHandcrafted, setIsHandcrafted] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Word count logic
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  useEffect(() => {
    if (storyId && chapterId) {
      fetchData();
    }
  }, [storyId, chapterId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      setStory(storyData);

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

  const handleSaveDraft = async (publishStatus?: 'draft' | 'published', isAutoSave = false) => {
    const activeStatus = publishStatus || status;
    try {
      if (isAutoSave) setSaveStatus('saving');
      else setSaving(true);

      const payload: Partial<StoryChapter> = {
        title,
        content,
        status: activeStatus,
        updated_at: new Date().toISOString()
      };

      if (activeStatus === 'published' && status !== 'published') {
        payload.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('story_chapters')
        .update(payload)
        .eq('id', chapterId);

      if (error) throw error;
      
      setStatus(activeStatus);
      
      if (isAutoSave) {
        setSaveStatus('saved');
      } else {
        showToast(activeStatus === 'published' ? 'Chapter Published!' : 'Draft Saved Successfully', 'success');
      }
    } catch (err: any) {
      if (!isAutoSave) showToast(err.message || 'Error saving chapter', 'error');
      setSaveStatus('offline');
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  // Auto-save every 10 seconds if content changes
  useEffect(() => {
    if (!title && !content) return;
    const timeoutId = setTimeout(() => {
      if (status === 'draft') {
        handleSaveDraft('draft', true);
      }
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [title, content, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-900 flex flex-col font-sans">
      
      {/* Editor Navbar - Wattpad Style */}
      <header className="bg-warm-850 border-b border-warm-800 px-6 h-16 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/write`)}
            className="text-warm-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm text-white font-bold">{story?.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-warm-500 font-semibold uppercase tracking-wider">Part {chapter?.chapter_number}</span>
              <span className="text-[10px] text-warm-500 flex items-center gap-1">
                {saveStatus === 'saving' && <span className="text-yellow-500">Saving...</span>}
                {saveStatus === 'saved' && <><Check size={10} className="text-green-500" /> Saved</>}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {status === 'draft' ? (
            <>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="text-warm-300 hover:text-white font-bold text-sm transition-all"
              >
                Save
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all ml-2"
              >
                Publish
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={saving}
                className="text-warm-400 hover:text-white font-bold text-sm transition-all"
              >
                Revert to Draft
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all ml-2"
              >
                Update
              </button>
            </>
          )}
          {/* Human-First Tools */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`p-2 rounded-xl border transition-all ${
              focusMode
                ? 'bg-red-600 text-white border-red-500'
                : 'text-warm-400 hover:text-white border-warm-800 hover:bg-warm-800'
            }`}
            title="Focus Mode (Distraction Free)"
          >
            <Maximize2 size={16} />
          </button>

          <button
            onClick={() => {
              setIsHandcrafted(!isHandcrafted);
              showToast(
                !isHandcrafted
                  ? 'Handcrafted by Human Author badge enabled!'
                  : 'Handcrafted badge disabled',
                'info'
              );
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isHandcrafted
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'text-warm-400 border-warm-800 hover:text-white'
            }`}
            title="Toggle Handcrafted Badge"
          >
            <Feather size={14} />
            <span className="hidden md:inline">{isHandcrafted ? '100% Handcrafted' : 'Badge'}</span>
          </button>

          <button
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center gap-1 text-xs font-bold"
            title="Optional AI Co-Pilot"
          >
            <Sparkles size={16} />
            <span className="hidden md:inline">AI Co-Pilot</span>
          </button>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Editor Panel */}
        <div className="flex-1 overflow-y-auto bg-[#F7F5F0] dark:bg-[#1A1817] flex justify-center py-12 px-6">
          <div className="max-w-[700px] w-full flex flex-col h-full relative">
            
            {/* Mock Rich Text Toolbar (Visual Only) */}
            <div className="flex items-center gap-1 mb-8 border-b border-[#E5E0D8] dark:border-[#2A2827] pb-3 text-[#8A8580] dark:text-[#6A6867]">
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors" title="Paragraph"><AlignLeft size={18} /></button>
              <div className="w-px h-4 bg-[#E5E0D8] dark:bg-[#2A2827] mx-1"></div>
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors font-serif font-bold text-lg leading-none" title="Bold">B</button>
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors font-serif italic text-lg leading-none" title="Italic">I</button>
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors font-serif underline text-lg leading-none" title="Underline">U</button>
              <div className="w-px h-4 bg-[#E5E0D8] dark:bg-[#2A2827] mx-1"></div>
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors" title="Link"><Link size={18} /></button>
              <button className="p-1.5 hover:bg-[#E5E0D8] dark:hover:bg-[#2A2827] rounded transition-colors" title="Image"><ImageIcon size={18} /></button>
            </div>

            {/* Title field */}
            <input
              type="text"
              placeholder="Untitled Part"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-serif font-bold bg-transparent border-0 focus:ring-0 px-0 pb-6 text-[#1A1817] dark:text-[#F7F5F0] placeholder-[#8A8580] dark:placeholder-[#6A6867]"
            />

            {/* Content field */}
            <textarea
              placeholder="Tap here to start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 min-h-[60vh] text-lg font-serif bg-transparent border-0 focus:ring-0 px-0 text-[#2A2827] dark:text-[#E5E0D8] placeholder-[#8A8580] dark:placeholder-[#6A6867] resize-none leading-relaxed"
            />
            
            {/* Word Count Footer */}
            <div className="pt-8 pb-4 text-center">
              <span className="text-xs font-bold text-[#8A8580] dark:text-[#6A6867] uppercase tracking-widest">
                {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional AI Assistant Drawer */}
      <AiCoPilotDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        chapterContent={content}
        onInsertText={(text) => setContent(prev => prev + '\n\n' + text)}
      />
    </div>
  );
}
