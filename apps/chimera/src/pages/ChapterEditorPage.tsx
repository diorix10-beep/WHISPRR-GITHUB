import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe, MoreHorizontal, AlignLeft, Bold, Italic, Underline, Link, Image as ImageIcon, Check, Sparkles, Download, Maximize2, Feather, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Story, StoryChapter } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { clearSavedDraft, draftKey, draftMatches, readDraft, writeDraft, type DraftRecord } from '../lib/draftJournal';
import { checkUserPromptSafety, CRISIS_HELPLINE_INFO } from '../lib/safetyGuard';
import { useToast } from '../contexts/ToastContext';
import { AiCoPilotDrawer } from '../components/writers/AiCoPilotDrawer';
import { SceneIllustrationModal } from '../components/writers/SceneIllustrationModal';

interface ChapterDraft {
  title: string; content: string; status: 'draft' | 'published';
  choices: { id: string; text: string; target_chapter_id?: string | null }[];
}

export default function ChapterEditorPage() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { user } = useAuth();
  const userId=user?.id;
  const journalScope = user?.id && storyId && chapterId ? draftKey(user.id, 'chapter', storyId, chapterId) : null;
  const readyScopeRef = useRef<string | null>(null);
  const loadSequence = useRef(0);
  const baseRevisionRef = useRef<string | undefined>(undefined);
  const saveLock = useRef(false);
  const [pendingRecovery, setPendingRecovery] = useState<DraftRecord<ChapterDraft> | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [canEdit,setCanEdit]=useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [destinations,setDestinations]=useState<Array<{id:string;title:string;chapter_number:number;status:string}>>([]);
  const [worldOptions,setWorldOptions]=useState<Array<{id:string;name:string}>>([]);
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

  const fetchData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    readyScopeRef.current = null;
    setPendingRecovery(null);
    setDirty(false);
    try {
      setLoading(true);
      
      const { data: storyData, error: storyErr } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyErr) throw storyErr;
      if (sequence !== loadSequence.current) return;
      let editable=storyData.user_id===userId;
      if (!editable) {
        const { data: allowed, error: permissionError } = await supabase.rpc('can_access_chimera_project', { p_type:'story', p_id:storyId, p_edit:true });
        if(permissionError)throw new Error('Chapter permission could not be checked.');
        editable=Boolean(allowed);
        if(!editable){const {data:readAccess,error}=await supabase.rpc('can_access_chimera_project',{p_type:'story',p_id:storyId,p_edit:false});if(error || !readAccess)throw new Error('Project read permission is required.');}
      }
      setStory(storyData);
      const [{data:chapterOptions},{data:worlds}]=await Promise.all([supabase.from('story_chapters').select('id,title,chapter_number,status').eq('story_id',storyId).order('chapter_number'),supabase.from('worlds').select('id,name').eq('user_id',userId)]);
      if(sequence!==loadSequence.current)return;setDestinations(chapterOptions||[]);setWorldOptions(worlds||[]);

      const { data: chapData, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('id', chapterId)
        .eq('story_id', storyId)
        .single();

      if (error) throw error;
      if (sequence !== loadSequence.current) return;
      if(storyData.user_id!==userId && chapData.status!=='draft')editable=false;
      setCanEdit(editable);
      setChapter(chapData);
      setTitle(chapData.title);
      setContent(chapData.content || '');
      setStatus(chapData.status);
      setChoices(chapData.choices || []);
      baseRevisionRef.current = chapData.updated_at;
      readyScopeRef.current = journalScope;
      const recovered = editable && journalScope ? readDraft<ChapterDraft>(journalScope) : null;
      const serverDraft: ChapterDraft = { title: chapData.title, content: chapData.content || '', status: chapData.status, choices: chapData.choices || [] };
      if (recovered && typeof recovered.value.title === 'string' && typeof recovered.value.content === 'string' && Array.isArray(recovered.value.choices)) {
        if (draftMatches(recovered, serverDraft)) { if (journalScope) clearSavedDraft(journalScope, serverDraft); }
        else setPendingRecovery(recovered);
      }

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
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [storyId,chapterId,journalScope,userId,showToast]);

  useEffect(()=>{if(storyId&&chapterId&&userId)void fetchData();},[storyId,chapterId,userId,fetchData]);

  const handleSaveDraft = async (publishStatus?: 'draft' | 'published', isAutoSave = false) => {
    if (!canEdit || !journalScope || readyScopeRef.current !== journalScope || pendingRecovery || saveLock.current) return;
    const activeStatus = publishStatus || status;
    if (activeStatus === 'published' && story?.user_id !== userId) { showToast('Only the creator can publish chapters.', 'error'); return; }
    const snapshot: ChapterDraft = { title, content, choices, status: activeStatus };
    // Preserve first, including text that existing safety checks decline to send.
    setStorageFailed(!writeDraft(journalScope, snapshot, baseRevisionRef.current));

    // Run SafetyGuard check on chapter title & content
    const titleSafety = checkUserPromptSafety(title);
    const contentSafety = checkUserPromptSafety(content);
    if ((!titleSafety.isSafe && titleSafety.crisisTriggered) || (!contentSafety.isSafe && contentSafety.crisisTriggered)) {
      if (!isAutoSave) showToast(`💜 Help is available. Call/text ${CRISIS_HELPLINE_INFO.phone} (${CRISIS_HELPLINE_INFO.name}). You are not alone.`, 'error');
      setSaveStatus('offline');
      return;
    }

    saveLock.current = true;
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

      const { data: savedChapter, error } = await supabase
        .from('story_chapters')
        .update(payload)
        .eq('id', chapterId)
        .eq('story_id', storyId)
        .eq('updated_at', baseRevisionRef.current!)
        .select('id, updated_at')
        .maybeSingle();

      if (error) throw error;
      if (!savedChapter) throw new Error('This chapter changed elsewhere. Your local draft is safe; reload to compare versions.');
      if (readyScopeRef.current !== journalScope) return;
      baseRevisionRef.current = savedChapter.updated_at;
      const cleared = clearSavedDraft(journalScope, snapshot);
      setDirty(!cleared);
      setChapter(current => current ? { ...current, ...payload, updated_at: savedChapter.updated_at } : current);
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
      saveLock.current = false;
      if (!isAutoSave) setSaving(false);
    }
  };

  const handleSceneIllustration = (image: { id: string; signedUrl: string }) => {
    setSceneIllustrations((current) => [image, ...current]);
    showToast('Your private scene illustration is ready.', 'success');
  };

  useEffect(() => {
    if (!canEdit || !journalScope || readyScopeRef.current !== journalScope || loading || pendingRecovery) return;
    const serverSnapshot = chapter && { title: chapter.title, content: chapter.content || '', status: chapter.status, choices: chapter.choices || [] };
    const current: ChapterDraft = { title, content, status, choices };
    if (serverSnapshot && JSON.stringify(serverSnapshot) === JSON.stringify(current)) return;
    setDirty(true);
    setStorageFailed(!writeDraft(journalScope, current, baseRevisionRef.current));
  }, [title, content, status, choices, journalScope, loading, pendingRecovery, chapter, canEdit]);

  useEffect(() => {
    if (!dirty && !pendingRecovery) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, pendingRecovery]);

  // Keep the existing draft-only autosave behavior; include choices and prevent
  // unresolved recovery or stale network acknowledgements from replacing work.
  useEffect(() => {
    if (loading || pendingRecovery || !dirty || readyScopeRef.current !== journalScope) return;
    const timeoutId = setTimeout(() => {
      if (status === 'draft') void handleSaveDraft('draft', true);
    }, 10000);
    return () => clearTimeout(timeoutId);
  }, [title, content, status, choices, loading, pendingRecovery, dirty, journalScope]);

  const restoreRecovery = () => {
    if (!pendingRecovery) return;
    setTitle(pendingRecovery.value.title);
    setContent(pendingRecovery.value.content);
    setChoices(pendingRecovery.value.choices);
    // Recover words without silently changing the server publication status.
    setPendingRecovery(null);
    setDirty(true);
    setSaveStatus('offline');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-red-750 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-900 flex flex-col font-sans">
      
      {pendingRecovery && <div role="status" className="flex flex-wrap items-center gap-3 border-b border-warm-700 p-4 text-sm text-white">
        <span>A local chapter draft is available{pendingRecovery.baseRevision !== baseRevisionRef.current ? '; the server version also changed' : ''}. Choose which version to keep before saving.</span>
        <button type="button" onClick={restoreRecovery} className="min-h-11 rounded-xl border px-3 py-2">Restore local draft</button>
        <button type="button" onClick={() => { if (journalScope) clearSavedDraft(journalScope, pendingRecovery.value); setPendingRecovery(null); }} className="min-h-11 rounded-xl border px-3 py-2">Keep server version</button>
      </div>}
      {storageFailed && <p role="alert" className="p-4 text-sm text-amber-300">This browser cannot save a recovery copy. Keep this tab open or export your chapter before leaving.</p>}
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
                disabled={!canEdit || saving || Boolean(pendingRecovery) || !chapter}
                className="text-warm-300 hover:text-white font-bold text-sm transition-all"
              >
                Save
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={!canEdit || saving || Boolean(pendingRecovery) || !chapter || story?.user_id !== userId}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all ml-2"
              >
                Publish
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSaveDraft('draft')}
                disabled={!canEdit || saving || Boolean(pendingRecovery) || !chapter}
                className="text-warm-400 hover:text-white font-bold text-sm transition-all"
              >
                Revert to Draft
              </button>
              <button
                onClick={() => handleSaveDraft('published')}
                disabled={!canEdit || saving || Boolean(pendingRecovery) || !chapter || story?.user_id !== userId}
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
            disabled={!canEdit}
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
              aria-label="Chapter title"
              placeholder="Untitled Part"
              readOnly={!canEdit || Boolean(pendingRecovery)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-serif font-bold bg-transparent border-0 focus:ring-0 px-0 pb-6 text-[#1A1817] dark:text-[#F7F5F0] placeholder-[#8A8580] dark:placeholder-[#6A6867]"
            />

            {/* Content field */}
            <textarea aria-label="Chapter manuscript"
              placeholder="Tap here to start writing..."
              readOnly={!canEdit || Boolean(pendingRecovery)}
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
                  disabled={!canEdit || choices.length >= 40 || Boolean(pendingRecovery)}
                  onClick={() => setChoices([...choices, { id: crypto.randomUUID(), text: '' }])}
                  className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 text-xs font-bold transition-all border border-red-500/20 flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add Choice</span>
                </button>
              </div>

              <p className="text-xs text-warm-500 mb-2">A blank destination continues to the next published chapter. Named destinations must be published before readers can open them.</p>
              {choices.length === 0 ? (
                <p className="text-xs text-warm-400 italic">
                  No reader choices added. This is a standard narrative chapter. Click "Add Choice" to create branch paths for your readers!
                </p>
              ) : (
                <div className="space-y-3">
                  {choices.map((c, index) => (
                    <div key={c.id || index} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        aria-label={`Reader choice ${index+1} text`}
                        maxLength={2000}
                        placeholder={`Choice ${index + 1}: e.g. "Enter the mysterious cavern..."`}
                        readOnly={!canEdit || Boolean(pendingRecovery)}
                        value={c.text}
                        onChange={(e) => {
                          const next = [...choices];
                          next[index].text = e.target.value;
                          setChoices(next);
                        }}
                        className="flex-1 bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-2 text-xs text-warm-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      <label className="text-xs">Destination
                        <select className="input-field max-w-full" disabled={!canEdit || Boolean(pendingRecovery)} value={c.target_chapter_id||''} onChange={e=>setChoices(old=>old.map((choice,i)=>i===index?{...choice,target_chapter_id:e.target.value||null}:choice))}>
                          <option value="">Choose chapter</option>
                          {destinations.filter(d=>d.id!==chapterId).map(d=><option key={d.id} value={d.id}>{d.chapter_number}. {d.title} ({d.status})</option>)}
                        </select>
                      </label>
                      <button
                        aria-label={`Remove reader choice ${index+1}`}
                        type="button"
                        onClick={() => setChoices(choices.filter((_, i) => i !== index))}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        disabled={!canEdit || Boolean(pendingRecovery)}
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

      {story && story.user_id===userId && <label className="block text-sm p-4">Story world for optional AI context (only lore visible to the requesting collaborator is recalled)
        <select className="input-field" value={story.world_id||''} onChange={async e=>{
          const worldId=e.target.value||null;const {data,error}=await supabase.from('stories').update({world_id:worldId}).eq('id',story.id).eq('updated_at',story.updated_at).select('*').maybeSingle();
          if(error || !data)showToast('World link was not saved. Reload the latest story before retrying.','error');else setStory(data);
        }}><option value="">No world linked</option>{worldOptions.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
      </label>}
      {!canEdit && <p role="status" className="p-4 text-sm">Read-only chapter preview. Only the creator can change published chapters; accepted editors can change drafts.</p>}
      {/* Optional AI Assistant Drawer */}
      <AiCoPilotDrawer
        storyId={storyId || ''}
        chapterId={chapterId || ''}
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
