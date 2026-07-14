import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Smile, Paperclip, ArrowLeft, Book, Sparkles, Compass, BookOpen, Briefcase, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useInterests } from '../../contexts/InterestContext';
import { supabase } from '../../lib/supabase';
import { EmojiPicker } from '../common/EmojiPicker';

interface ComposeWhisperProps {
  onClose: () => void;
  onWhisperCreated?: () => void;
  communityId?: string;
}

const CHAR_LIMIT = 5000;
const WARN_THRESHOLD = 0.8;
const DANGER_THRESHOLD = 0.95;

type AttachType = 'menu' | 'story' | 'character' | 'world' | 'lorebook' | 'collab' | 'progress' | null;

export function ComposeWhisper({
  onClose,
  onWhisperCreated,
  communityId,
}: ComposeWhisperProps) {
  const { user, profile } = useAuth();
  const { track } = useInterests();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Attachments State
  const [attachPanel, setAttachPanel] = useState<AttachType>(null);
  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Collab Request form state
  const [collabForm, setCollabForm] = useState({
    role: 'writer',
    title: '',
    description: '',
  });

  // Progress Update form state
  const [progressForm, setProgressForm] = useState({
    project: '',
    percentage: 50,
    notes: '',
  });

  const charCount = content.length;
  const isOverLimit = charCount > CHAR_LIMIT;
  const charRatio = charCount / CHAR_LIMIT;
  const isWarning = charRatio >= WARN_THRESHOLD && charRatio < DANGER_THRESHOLD;
  const isDanger = charRatio >= DANGER_THRESHOLD;

  // Auto-expand textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 256)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        el.selectionStart = start + emoji.length;
        el.selectionEnd = start + emoji.length;
        el.focus();
      });
    } else {
      setContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Fetch creations from database
  const fetchCreations = async (type: 'story' | 'character' | 'world' | 'lorebook') => {
    if (!user) return;
    setLoadingItems(true);
    try {
      let items: any[] = [];
      if (type === 'story') {
        const { data } = await supabase
          .from('stories')
          .select('id, title, summary, cover_url')
          .eq('user_id', user.id);
        items = data || [];
      } else if (type === 'character') {
        const { data } = await supabase
          .from('ai_characters')
          .select('id, short_description, greeting, category')
          .eq('creator_id', user.id);
        items = (data || []).map(c => ({
          id: c.id,
          title: c.short_description || 'Unnamed Character',
          description: c.greeting,
          cover_url: c.category
        }));
      } else if (type === 'world') {
        const { data } = await supabase
          .from('worlds')
          .select('id, name, description')
          .eq('user_id', user.id);
        items = (data || []).map(w => ({
          id: w.id,
          title: w.name,
          description: w.description
        }));
      } else if (type === 'lorebook') {
        const { data } = await supabase
          .from('lorebooks')
          .select('id, title, description, entry_count')
          .eq('user_id', user.id);
        items = (data || []).map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          entry_count: l.entry_count
        }));
      }
      setFetchedItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectAttachment = (type: 'story' | 'character' | 'world' | 'lorebook', item: any) => {
    let tag = '';
    if (type === 'story') {
      tag = `\n[Story: ${item.title} | ${item.summary || ''} | ${item.cover_url || ''}]\n`;
    } else if (type === 'character') {
      tag = `\n[Character: ${item.title} | ${item.description || ''} | ${item.description || ''} | ${item.id}]\n`;
    } else if (type === 'world') {
      tag = `\n[World: ${item.title} | ${item.description || ''}]\n`;
    } else if (type === 'lorebook') {
      tag = `\n[Lorebook: ${item.title} | ${item.description || ''} | ${item.entry_count || 0}]\n`;
    }
    setContent(prev => prev + tag);
    setAttachPanel(null);
  };

  const handleAddCollabTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = `\n[Collaboration: ${collabForm.role} | ${collabForm.title} | ${collabForm.description} | null | ${profile?.username || ''}]\n`;
    setContent(prev => prev + tag);
    setAttachPanel(null);
  };

  const handleAddProgressTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = `\n[Progress: ${progressForm.project} | ${progressForm.percentage}% | ${progressForm.notes}]\n`;
    setContent(prev => prev + tag);
    setAttachPanel(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isOverLimit || charCount === 0) return;

    setIsPosting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('whispers').insert({
        content: content.trim(),
        community_id: communityId || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      track({
        eventType: 'post',
        targetType: 'whisper',
        communityId: communityId || undefined,
      });

      setContent('');
      onWhisperCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post whisper');
    } finally {
      setIsPosting(false);
    }
  };

  const counterColor = isOverLimit
    ? 'text-error-600 dark:text-error-400'
    : isDanger
    ? 'text-warning-600 dark:text-warning-400'
    : isWarning
    ? 'text-warm-600 dark:text-warm-400'
    : 'text-warm-400 dark:text-warm-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 sm:items-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg mx-auto bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-scale-in border border-warm-100 dark:border-warm-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title text-xl">Share your thought</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind… (Your voice matters here. Take your time to write. ✨)"
              className="input-field font-serif leading-relaxed resize-none overflow-y-auto"
              style={{ minHeight: '8rem', maxHeight: '16rem', height: 'auto' }}
              disabled={isPosting}
            />
            {/* Counter + Emoji + Attachment button row */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(p => !p)}
                  className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
                  aria-label="Insert emoji"
                >
                  <Smile size={18} className="text-warm-400 hover:text-primary-500 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={() => setAttachPanel(attachPanel ? null : 'menu')}
                  className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
                  aria-label="Attach creation"
                  title="Attach Creation, Recruitment or Progress"
                >
                  <Paperclip size={18} className={`text-warm-400 hover:text-primary-500 transition-colors ${attachPanel ? 'text-primary-500' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isOverLimit && (
                  <span className="text-xs text-error-600 dark:text-error-400 font-medium">
                    {charCount - CHAR_LIMIT} over limit
                  </span>
                )}
                <span className={`text-xs font-medium tabular-nums ${counterColor}`}>
                  {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 animate-scale-in">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>

          {/* Attachments panel */}
          {attachPanel && (
            <div className="p-4 bg-warm-50 dark:bg-warm-900/40 rounded-2xl border border-warm-150 dark:border-warm-750/80 animate-fade-in text-sm">
              {attachPanel === 'menu' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">Attach Creator Asset</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setAttachPanel('story'); fetchCreations('story'); }} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <BookOpen size={16} className="text-primary-500" /> Story Preview
                    </button>
                    <button type="button" onClick={() => { setAttachPanel('character'); fetchCreations('character'); }} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <Sparkles size={16} className="text-primary-500" /> AI Character
                    </button>
                    <button type="button" onClick={() => { setAttachPanel('world'); fetchCreations('world'); }} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <Compass size={16} className="text-primary-500" /> World Preview
                    </button>
                    <button type="button" onClick={() => { setAttachPanel('lorebook'); fetchCreations('lorebook'); }} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <Book size={16} className="text-primary-500" /> Lorebook
                    </button>
                    <button type="button" onClick={() => setAttachPanel('collab')} className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <Briefcase size={16} className="text-primary-500" /> Add Collaboration Recruitment Request
                    </button>
                    <button type="button" onClick={() => setAttachPanel('progress')} className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 dark:hover:border-primary-700 transition-all font-semibold">
                      <Activity size={16} className="text-primary-500" /> Share Project Progress Update
                    </button>
                  </div>
                </div>
              )}

              {/* Stories, Characters, Worlds, Lorebooks Lists */}
              {['story', 'character', 'world', 'lorebook'].includes(attachPanel) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button type="button" onClick={() => setAttachPanel('menu')} className="p-1 hover:bg-warm-200 dark:hover:bg-warm-800 rounded-lg">
                      <ArrowLeft size={16} />
                    </button>
                    <span className="font-bold uppercase tracking-wider text-xs text-warm-500">Select {attachPanel}</span>
                  </div>
                  {loadingItems ? (
                    <div className="text-center py-4 text-xs text-warm-400">Loading your creations...</div>
                  ) : fetchedItems.length === 0 ? (
                    <div className="text-center py-4 text-xs text-warm-500">No {attachPanel}s found. Build one in CHIMERA first!</div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {fetchedItems.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectAttachment(attachPanel as any, item)}
                          className="w-full text-left p-2 rounded-xl bg-white dark:bg-warm-800 border hover:border-primary-300 text-xs font-semibold truncate"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Collab Form */}
              {attachPanel === 'collab' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAttachPanel('menu')} className="p-1 hover:bg-warm-200 dark:hover:bg-warm-800 rounded-lg">
                      <ArrowLeft size={16} />
                    </button>
                    <span className="font-bold uppercase tracking-wider text-xs text-warm-500">Collaboration Details</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-warm-500 uppercase mb-1">Role Needed</label>
                      <select
                        value={collabForm.role}
                        onChange={e => setCollabForm(prev => ({ ...prev, role: e.target.value }))}
                        className="input-field py-1 px-2.5 text-xs"
                      >
                        <option value="writer">Writer</option>
                        <option value="editor">Editor</option>
                        <option value="prompt_engineer">Prompt Engineer</option>
                        <option value="character_designer">Character Designer</option>
                        <option value="worldbuilder">Worldbuilder</option>
                        <option value="lore_writer">Lore Writer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-warm-500 uppercase mb-1">Project Name / Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cyberpunk Roleplay Lore"
                        value={collabForm.title}
                        onChange={e => setCollabForm(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field py-1 px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-warm-500 uppercase mb-1">Description & Requirements</label>
                      <textarea
                        required
                        placeholder="What are you building and what support do you need?"
                        value={collabForm.description}
                        onChange={e => setCollabForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="input-field py-1.5 px-2.5 text-xs resize-none"
                      />
                    </div>
                    <button type="button" onClick={handleAddCollabTag} disabled={!collabForm.title || !collabForm.description} className="w-full btn-primary py-1.5 text-xs">
                      Attach Collaboration Recruitment
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Update Form */}
              {attachPanel === 'progress' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAttachPanel('menu')} className="p-1 hover:bg-warm-200 dark:hover:bg-warm-800 rounded-lg">
                      <ArrowLeft size={16} />
                    </button>
                    <span className="font-bold uppercase tracking-wider text-xs text-warm-500">Progress Update</span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-warm-500 uppercase mb-1">Project Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Magic Academy lorebook"
                        value={progressForm.project}
                        onChange={e => setProgressForm(prev => ({ ...prev, project: e.target.value }))}
                        className="input-field py-1 px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-warm-500 uppercase mb-1">
                        <span>Milestone Progress</span>
                        <span>{progressForm.percentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progressForm.percentage}
                        onChange={e => setProgressForm(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-warm-500 uppercase mb-1">Milestone Notes / Progress description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Drafted first 12 characters and main scenario beats!"
                        value={progressForm.notes}
                        onChange={e => setProgressForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="input-field py-1 px-2.5 text-xs"
                      />
                    </div>
                    <button type="button" onClick={handleAddProgressTag} disabled={!progressForm.project || !progressForm.notes} className="w-full btn-primary py-1.5 text-xs">
                      Attach Progress Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPosting}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPosting || charCount === 0 || isOverLimit}
              className="btn-primary flex-1"
            >
              {isPosting ? 'Posting…' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
