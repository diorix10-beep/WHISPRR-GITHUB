import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe, MoreHorizontal, AlignLeft, Bold, Italic, Underline, Link, Image as ImageIcon, Check, Sparkles, Download, Maximize2, Feather, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { checkUserPromptSafety, CRISIS_HELPLINE_INFO } from '../lib/safetyGuard';
import { useToast } from '../contexts/ToastContext';
import { AiCoPilotDrawer } from '../components/writers/AiCoPilotDrawer';
import { SceneIllustrationModal } from '../components/writers/SceneIllustrationModal';

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
  const [choices, setChoices] = useState<{ id: string; text: string; target_chapter_id?: string | null }[]>([]);

  // Human-First & AI States
  const [focusMode, setFocusMode] = useState(false);
  const [isHandcrafted, setIsHandcrafted] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [sceneIllustrationOpen, setSceneIllustrationOpen] = useState(false);
  const [sceneIllustrations, setSceneIllustrations] = useState<{ id: string; signedUrl: string }[]>([]);

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
      
      const { data: storyData, error: storyErr } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyErr) throw storyErr;
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
      setChoices(chapData.choices || []);

      const { data: illustrations, error: illustrationsError } = await supabase
        .from('story_scene_illustrations')
        .select('id, storage_path')
        .eq('chapter_id', chapterId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (illustrationsError) throw illustrationsError;
      const signedIllustrations = await Promise.all((illustrations || []).map(async (illustration) => {
        if (!illustration.storage_path) return null;
        const { data } = await supabase.storage.from('story-illustrations').createSignedUrl(illustration.storage_path, 60 * 60);
        return data?.signedUrl ? { id: illustration.id, signedUrl: data.signedUrl } : null;
      }));
      setSceneIllustrations(signedIllustrations.filter((illustration): illustration is { id: string; signedUrl: string } => Boolean(illustration)));

    } catch (err: any) {
      showToast(err.message || 'Error loading chapter details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (publishStatus?: 'draft' | 'published', isAutoSave = false) => {
    const activeStatus = publishStatus || status;

    // Run SafetyGuard check on chapter title & content
    const titleSafety = checkUserPromptSafety(title);
    const contentSafety = checkUserPromptSafety(content);
    if ((!titleSafety.isSafe && titleSafety.crisisTriggered) || (!contentSafety.isSafe && contentSafety.crisisTriggered)) {
      if (!isAutoSave) showToast(`💜 Help is available. Call/text ${CRISIS_HELPLINE_INFO.phone} (${CRISIS_HELPLINE_INFO.name}). You are not alone.`, 'error');
      setSaveStatus('offline');
      return;
    }

    try {
      if (isAutoSave) setSaveStatus('saving');
      else setSaving(true);

      const payload: Partial<StoryChapter> = {
        title,
        content,
        status: activeStatus,
        choices,
        is_cyoa: choices.length > 0,
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

  const handleSceneIllustration = (image: { id: string; signedUrl: string }) => {
    setSceneIllustrations((current) => [image, ...current]);
    showToast('Your private scene illustration is ready.', 'success');
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
          <button
            onClick={() => setSceneIllustrationOpen(true)}
            className="p-2 rounded-xl bg-[#e4c77e]/10 text-[#e4c77e] border border-[#e4c77e]/30 hover:bg-[#e4c77e]/20 transition-all flex items-center gap-1 text-xs font-bold"
            title="Illustrate this scene with VELLUM"
          >
            <ImageIcon size={16} />
            <span className="hidden lg:inline">Illustrate</span>
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
            <div className="py-4 text-center">
              <span className="text-xs font-bold text-[#8A8580] dark:text-[#6A6867] uppercase tracking-widest">
                {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
              </span>
            </div>

            {sceneIllustrations.length > 0 && (
              <section className="mt-6 border-t border-[#E5E0D8] dark:border-[#2A2827] pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#b99145]" />
                  <h3 className="font-serif text-lg font-semibold text-[#1A1817] dark:text-[#F7F5F0]">Private scene illustrations</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sceneIllustrations.map((image) => <img key={image.id} src={image.signedUrl} alt="Generated scene illustration" className="aspect-video w-full rounded-2xl object-cover shadow-lg" />)}
                </div>
              </section>
            )}

            {/* CYOA Reader Choices Creator */}
            <div className="mt-6 pt-6 border-t border-[#E5E0D8] dark:border-[#2A2827]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-warm-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-red-500" />
                  <span>Interactive Reader Choices (CYOA)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setChoices([...choices, { id: `choice-${Date.now()}`, text: '' }])}
                  className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 text-xs font-bold transition-all border border-red-500/20 flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add Choice</span>
                </button>
              </div>

              {choices.length === 0 ? (
                <p className="text-xs text-warm-400 italic">
                  No reader choices added. This is a standard narrative chapter. Click "Add Choice" to create branch paths for your readers!
                </p>
              ) : (
                <div className="space-y-3">
                  {choices.map((c, index) => (
                    <div key={c.id || index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Choice ${index + 1}: e.g. "Enter the mysterious cavern..."`}
                        value={c.text}
                        onChange={(e) => {
                          const next = [...choices];
                          next[index].text = e.target.value;
                          setChoices(next);
                        }}
                        className="flex-1 bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-2 text-xs text-warm-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setChoices(choices.filter((_, i) => i !== index))}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove choice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
      {storyId && chapterId && (
        <SceneIllustrationModal
          isOpen={sceneIllustrationOpen}
          onClose={() => setSceneIllustrationOpen(false)}
          storyId={storyId}
          chapterId={chapterId}
          chapterTitle={title}
          chapterContent={content}
          onGenerated={handleSceneIllustration}
        />
      )}
    </div>
  );
}
